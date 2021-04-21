const Mongoose = require('mongoose');

const User = Mongoose.Schema({
    _id: String,
    username: {
        type: String,
        required: true,
        unique: true
    },
    age: {
        type: Number,
        min: 13
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        min: 8,
        max: 72,
        required: true
    },
    "2fa": {
        type: Boolean,
        default: false
    },
    appToken: {
        type: String,
        unique: true,
        required: true
    },
    userToken: {
        type: String,
        unique: true,
        required: true
    },
    domain: {
      type: String
    },
    plan: {
        type: String,
        default: 'free',
    },
    activated: {
        type: Boolean,
        default: false
    }
});

module.exports = Mongoose.model('User', User);