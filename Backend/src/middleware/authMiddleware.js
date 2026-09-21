const Driver = require('../models/Driver');
const jwt = require('jsonwebtoken');
const Client = require('../models/Client');


// ---------------------------- Client Middleware ------------------------------//

exports.driverMiddleware = async (req,res,next) =>{

    try{

        const token = req.cookies.token;

        if(!token){
            return res.status(401).json({
                message : "Unauthorized access, token not found",
                success : false
            })
        }

        const decoded = await jwt.verify(token,process.env.JWT_SECRET);

        const driver = await Driver.findById(decoded.id);

        if(!driver){
            return res.status(404).json({
                message : "Driver not found",
                success : false
            })
        }

        req.driver = driver;
        next();

    }catch(error){

        return res.status(500).json({
            message : "Internal server error",
            success : false
        })
    }

}


//------------------------------------------------------------------------------//


//--------------------------- Client Middleware --------------------------------//

exports.clientMiddleware = async (req,res,next) =>{

    try{
        const token = req.cookies.token;

        if(!token){
            return res.status(401).json({
                message : "Unauthorized access, token not found",
                success : false
            })
        }

        const decoded = await jwt.verify(token,process.env.JWT_SECRET);

        const client = await Client.findById(decoded.id);

        if(!client){
            return res.status(404).json({
                message : "Client not found",
                success : false
            })
        }

        req.client = client;
        next();

    }catch(error){

        return res.status(500).json({
            message : "Internal server error",
            success : false
        })
    }

}