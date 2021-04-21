var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/token',  async function (req, res, next){
  var token = jwt.sign({ "?": '^!' }, 'test', {noTimestamp: true, header: {userId: "143040035447521280"}});
  var decoded = jwt.decode(token, {complete: true})
  res.type('json')
  res.send({token: token,decoded: decoded.header.userId});
})

module.exports = router;
