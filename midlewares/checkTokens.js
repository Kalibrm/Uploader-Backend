const User = require('../models/user');

exports.appToken = async(req, res, next)=>{
    const token=req.header('Authorization');
    if(!token || token=='' || token.substring(0,3).toLowerCase()!="app") return res.status(401).type('json').send({status: 401, message: "No access"});
    await User.findOne({appToken: token.slice(4)}).exec(async (err, user)=>{
        if(err) return res.status(500).render('error', {message: "An error has occurred", error: {status: 500}});
        if(!user) return res.status(401).type('json').send({status: 401, message: "Invalid token"});
        req.user=user;
        next()
    })
}

exports.userToken = async(req, res, next)=>{
    let token;
    if(!req.session.authToken) token = req.header('Authorization');
    else token = req.session.authToken;

    if (!token || token=='' || token.substring(0,4).toLowerCase()!="user") return res.status(403).type('json').send({status: 403, message: "No access"});
    await User.findOne({userToken: token.slice(5)}).exec(async (err, user)=>{
        if(err)return res.status(500).render('error', {message: "An error has occurred", error: {status: 500}});
        if(!user) return res.status(401).type('json').send({status: 401, message: "Invalid token"});
        req.user=user;
        next()
    })
}
