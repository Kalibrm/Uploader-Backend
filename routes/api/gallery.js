const express = require('express');
const fs = require('fs');

const File = require('../../models/file');
const User = require('../../models/user');
const router = express.Router();
const {userToken} = require('../../midlewares/checkTokens');

router.delete('/:userid/:filename/delete', userToken, async function(req, res, next){
    const user = req.user;
    if(!req.params.userid|| !req.params.filename) return res.send('nope')
    if(req.params.userid!=user._id) return res.status(403).type('json').send({status: 403, message: "No permission"});
    File.findOne({filename: req.params.filename, uploaderId: user._id}, async (err, file)=>{
        if(err) return res.status(500).type('json').send({status: 500, message: "An error has occurred"});
        if(!file) return res.status(404).type('json').send({status: 404, message: "File not found"});
        fs.rm(file.path, async(err)=>{
            if(err){
                console.error(err)
                return res.status(500).type('json').send({status: 500, message: "An error has occurred"});
            } else{
                try {
                    await File.deleteOne({path: file.path});
                } catch (err){
                    console.error(err);
                }
               return  res.status(200).type('json').send({status: 200, message: "File removed"});
            }
        });

    });
})

router.get('/list', async function(req, res, next){
    if(!req.query.username) return res.status(400).render('error', {message: "No user specified", error: {status: 400}});
    let limit,sort;
    if(!req.query.limit || req.query.limit<10) limit=10;
    else if(req.query.limit>100) limit=100;
    else limit=Number(req.query.limit);
    if(!req.query.sort || req.query.sort<=-1) sort=-1;
    else sort=1;
    User.findOne({username: req.query.username},async (err, user)=>{
        if(err) return res.status(500).type('json').send({status: 500, message: "An error has occurred"});
        if(!user) return res.status(404).type('json').send({status: 404, message: "User not found"});
        File.find({uploaderId: user._id}, null, {limit: limit, sort: {createdAt: sort}}, async (err, files)=>{
            if(err) return res.status(500).type('json').send({status: 500, message: "An error has occurred"});
            if(!files) return res.status(404).type('json').send({status: 404, message: "Files not found"});
            res.status(200).type('json').send(files);
        })
    })
})

module.exports = router;