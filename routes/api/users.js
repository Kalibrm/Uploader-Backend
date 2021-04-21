const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

const User = require('../../models/user');
const {userToken} = require('../../midlewares/checkTokens');


router.get('/info', userToken, async function(req, res, next) {
  const user = req.user;
  user.password = undefined;
  user.userToken = undefined;
  res.type('json');
  res.send(user);
});

router.get('/sharex-config', userToken, async function(req, res, next){

})


router.patch('/gen-token', userToken, async function (req, res, next){
  const user=req.user;
  try {
    const appToken = jwt.sign({'/': "^%"}, process.env.TOKEN_SECRET,{header: {userId: user.userId, type: 'App'}});
    user.appToken=appToken;
    await user.save();
  } catch (err){
    console.error(err);
    return res.status(500).render('error', {message: "An error has occurred", error: {status: 500}});
  }
  res.type('json');
  res.status(201).send({
    "userId": user.userId,
    "appToken": user.appToken
  })
})

router.patch('/change-password', userToken,async function (req, res, next){
  const user = req.user;
  if(!req.body.oldPassword || !req.body.newPassword) return res.status(400).render('error', {message: "No payload provided", error: {status: 400}});
    bcrypt.compare(req.body.oldPassword, user.password, async (err, result) => {
      if(err) {
        console.error(err);
        return res.status(500).render('error', {message: "An error has occurred", error: {status: 500}});
      }
      if(!result) return res.status(401).render('error', {message: "Bad password", error: {status: 401}});
      bcrypt.hash(req.body.newPassword, Number(process.env.PASS_SALT_ROUNDS), async (err, hash)=>{
        if(err) {
          console.error(err);
          return res.status(500).render('error', {message: "An error has occurred", error: {status: 500}});
        }
        user.password = hash;
        try {
         await user.save();
        } catch (err){
          console.error(err);
          return res.status(500).render('error', {message: "An error has occurred", error: {status: 500}});
        }
        res.type('json');
        res.status(201).send({
          "userId": req.params.userId,
          "message": "Password has been changed"
        })
      })
    })
})

module.exports = router;
