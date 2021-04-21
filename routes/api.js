var express = require('express');
var router = express.Router();

const usersRouter = require('./api/users')
const galleryRouter = require('./api/gallery');
const filesRouter = require('./api/files');

router.use('/gallery', galleryRouter);
router.use('/user', usersRouter);
router.use('/files', filesRouter);

module.exports = router;