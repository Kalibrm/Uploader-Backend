const {Schema, model} = require('mongoose');

const File = new Schema({
    filename: {
        type: String,
        required: true,
        unique: true
    },
    name: {
      type: String,
      required: true
    },
    mimetype: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    uploaderId: {
        type: String,
    },
    view: {
        type: String,
        default: 'l'
    },

}, {timestamps: true})

module.exports = model('File', File);