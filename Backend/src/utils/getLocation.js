const Driver = require('../models/Driver');
const Client = require("../models/Client");
const redis = require('../config/redis');


//--------------------------- Get Client Location ------------------------------//

exports.getClientLocation = async (req,res) => {

    try{

        const {clientId} = req.params;
        const {lattitude,longitude} = req.body;

        const client = await Client.findById(clientId);

        if(!client){
            return res.status(404).json({
                message : "Client not found",
                success : false
            })
        }

        client.location.lattitude = lattitude;
        client.location.longitude = longitude;
        client.location.timestamp = Date.now();

        await client.save();

        await redis.set(`client:${clientId} : location`,client.location);

        return res.status(200).json({
            message : "Client location updated successfully",
            success : true,
            location : client.location
        })

    }catch(error){

        return res.status(500).json({
            message : "Internal server error",
            success : false
        })
    }

}

//-----------------------------------------------------------------------------//



//--------------------------- Get Driver Location ------------------------------//

exports.getDriverLocation = async (req,res) => {

    try{

        const {driverId} = req.params;
        const {lattitude,longitude} = req.body; 

        const driver = await Driver.findById(driverId);

        if(!driver){
            return res.status(404).json({
                message : "Driver not found",
                success : false
            })
        }

        driver.location.lattitude = lattitude;
        driver.location.longitude = longitude;
        driver.location.timestamp = Date.now();

        await driver.save();

        await redis.set(`driver:${driverId} : location`,driver.location);

        return res.status(200).json({
            message : "Driver location updated successfully",
            success : true,
            location : driver.location
        })

    }catch(error){

        return res.status(500).json({
            message : "Internal server error",
            success : false
        })
    }

}