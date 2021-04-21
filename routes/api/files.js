const express = require('express');
const multer = require('multer')
const createError = require('http-errors')
const mime = require('mime-types');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sizeOf = require('image-size');

const File = require('../../models/file');
const {appToken} = require('../../midlewares/checkTokens');
const router = express.Router();

const userDirectory = async (dir, cb)=> {
    fs.access(dir, async (err) => {
        if (err) {
            fs.mkdir(dir, async (err) => {
                return cb(null, dir);
            })
        } else {
            cb(null, dir);
        }
    });
}

const streamSend = async (req, res, path, data)=>{
    await fs.stat(path, async (err, stat)=>{
        const fileSize = stat.size
        const range = req.headers.range
        if(range) {
            const parts = range.replace(/bytes=/, "").split("-")
            const start = parseInt(parts[0], 10)
            const end = parts[1]
                ? parseInt(parts[1], 10)
                : fileSize-1;
            const chunkSize = (end-start)+1
            const file = fs.createReadStream(path, {start, end})
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': data.mimetype,
            }
            res.writeHead(206,head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': data.mimetype,
            }
            res.writeHead(200, head)
            fs.createReadStream(path).pipe(res)
        }
    })
}

var storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const dir = `./uploads/${req.user._id}`;
        fs.access('./uploads', async(err)=>{
            if(err){
                fs.mkdir('./uploads', async(err)=>{
                    userDirectory(dir, cb);
                })
            } else {
                userDirectory(dir, cb);
            }
        })

    },
    filename: function (req, file, cb) {
        cb(null, `${uuidv4()}`);
    }
})

const upload = multer({
    storage: storage,
    fileFilter: async function (req, file, cb){
        switch (file.mimetype){
            case "video/x-ms-asf":
            case "video/x-msvideo":
                req.fileNotSupported = true;
                cb(null, false);
                break;
            default:
                cb(null, true);
                break;
        }
    },

})

/*
Limit miejsca na dane
ustawienia sharex z backendu

*/
router.post('/upload', appToken, upload.single('file'), async function (req, res, next){
    if(req.fileNotSupported) return res.status(400).render('error', {message: "File format not supported", error: {status: 400}});
    const user = req.user;
    const file = req.file;
    if (!file) {
        return next(createError(400));
    }
    if(file.mimetype.substring(0,5)==="image"){
        const dim = sizeOf(file.path);
        /*
         file.width=dim.width;
         file.height=dim.height;
         */
        console.log(dim);
    }
    const dFile = new File({
        filename: file.filename,
        name: file.originalname,
        mimetype: file.mimetype,
        path: file.path,
        size: file.size,
        uploaderId: user._id
    })
    try {
        await dFile.save();
    } catch (err){
        console.error(err);
        fs.rm(file.path, function (err){
            console.error(err);
        })
        return res.send(err);
    }

    const resp = {
        status: 200,
        data: {
            "url": `http://localhost:3000/files/${dFile.filename}`,
        }
    }

    res.send(resp);
})

router.get('/:filename', async function (req,res,next){
    await File.findOne({filename: req.params.filename}).exec(async (err, file)=>{
        if(!file) return res.status(404).render('error', {message: "File not found", error: {status: 404}});
        const path = file.path;
        if(file.mimetype.includes('video') || file.mimetype.includes('audio')){
            await streamSend(req, res, path, file);
        } else {
            fs.readFile(file.path, function (err, data){
                if(err) console.error(err);
                res.type(file.mimetype);
                res.send(data);
            })
        }

    })
});





module.exports = router;