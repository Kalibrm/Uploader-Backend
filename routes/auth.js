const express = require('express');
const router = express.Router();
const createError = require("http-errors");
const bcrypt = require('bcrypt');
const User = require("../models/user");
const jwt = require('jsonwebtoken');
const SnowflakeId = require('snowflake-id').default;

const snowflake = new SnowflakeId({
    mid: 36,
    offset: (2020-1970)*31536000*1000
});

const NotLoggedIn = async (req, res, next) => {
    if (req.session.userId){
        res.send("Logged in");
    } else {
        next();
    }
}

const LoggedIn = async (req, res, next) => {
    if (req.session.userId){
        next()
    } else{
        res.send("Not logged in")
    }
}

router.post('/register', NotLoggedIn, async function(req,res,next){
    if(!req.body.username || !req.body.email || !req.body.password) return next(createError(400));
    const userId = snowflake.generate();

    const user = new User({
        _id: userId,
        username: req.body.username,
        email: req.body.email,
    });
    try {
        const userToken = jwt.sign({'^': "!@"}, process.env.TOKEN_SECRET,{header: {userId: userId, type: 'User'}, noTimestamp: true});
        const appToken = jwt.sign({'/': "^%"}, process.env.TOKEN_SECRET,{header: {userId: userId, type: 'App'}, });
        user.userToken=userToken;
        user.appToken=appToken;
    } catch (err){
        console.error(err);
        return res.status(500).render('error', {message: "An error has occurred", error: {status: 500}});
    }

    bcrypt.hash(req.body.password, Number(process.env.PASS_SALT_ROUNDS), async function (err, hash){
        user.password = hash
        try {
           await user.save();
        } catch (err){
            console.log(err);
            return res.status(400).render('error', {message: "User with this username exists!", error: {status: 400}});
        }
        req.session.userId = userId;
        req.session.authToken = user.userToken;
        user.password=undefined;
        res.send(user);
    });

})

router.post('/login', NotLoggedIn, async function(req, res, next){
    await User.findOne({username: req.body.username}).exec(function (err, user){
        if(err) return res.render('error', {message: "This user doesn't exist!", error: {status: 400}});
        if(!user) return res.status(400).render('error', {message: "This user doesn't exists", error: {status: 400}});
        bcrypt.compare(req.body.password, user.password, function (err, result){
            if (err) {
                console.error(err);
                return next(createError(500));
            }
            if(!result) return res.status(400).render('error', {message: "Password invalid", error: {status: 400}});
            req.session.userId = user._id;
            req.session.authToken = `User ${user.userToken}`;
            console.log(req.session);
            res.send("Authorized");
        })
    });
});

/*router.put('/2fa', LoggedIn, async function (req, res, next){
    await User.findOne({username: req.body.username}).exec(async function (err, user){
        if(err) return res.render('error', {message: "This user doesn't exist!", error: {status: 400}});
        try {
            await User.updateOne({username: req.body.username}, {"2fa": true});
        } catch (err){
            console.error(err)
            return next(err);
        }
        res.send("Done");
    })
})*/

router.post('/logout', LoggedIn, async function (req, res, next){
    req.session.destroy(err => {
        if(err){
            return res.redirect('/');
        }
        res.clearCookie('sid');
        res.redirect('/');
    })
})

router.get('/', (req, res, next)=>{
    res.render('api', {title: 'Api Backendu', logged: !!req.signedCookies.token});
});

module.exports = router;