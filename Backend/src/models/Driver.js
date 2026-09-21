const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({

    name : {
        type : String,
        required : true 
    },

    email : {
        type : String,
        required : true
    },

    password : {
        type : String,
        required : true
    },

    mobile : {
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

    },

    isOnline : {
        type : Boolean,
        default : false
    },

    isAvailable : {
        type : Boolean,
        default : false
    },

    VehicleNumber : {
        type : String,
        required : true
    },

    VehicleType : {
        type : String,
        required : true
    }

});

module.exports = mongoose.model('Driver',DriverSchema);