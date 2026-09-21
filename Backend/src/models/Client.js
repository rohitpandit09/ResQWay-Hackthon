const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({

    name : {
        type : String,
        required : true
    },

    email : {
        type : String,
        required : true
    },

    mobile : {
        type : String,
        required : true
    },

    password : {
        type : String,
        required : true
    },

    location : {

        lattitude : {
            type : Number,
            
        },

        longitude : {
            type : Number
        },

        timestamp : {
            type : Date,
            default : Date.now
        }
    }
})

module.exports = mongoose.model('Client',clientSchema);