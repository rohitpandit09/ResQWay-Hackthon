const Client = require('../models/Client');
const Driver = require('../models/Driver');
const bcrypt = require('bcrypt');

const { generateTokens } = require('../utils/generateTokens');


// --------------------------- Login function for Clients ------------------------------//

exports.clientLogin = async (req,res) =>{

    try{
        const {email,password} = req.body;

        if(!email || !password){
            return res.status(400).json({
            
                message : "Please provide email and password"
            });
        }

        const client = await Client.findOne({email});

        if(!client){
            return res.status(404).json({
                message : "Client not found",
                sucess : false
            })
        }

        const isPasswordValid = await bcrypt.compare(password,client.password);

        if(!isPasswordValid){

            return res.status(401).json({
                message : "Invalid password",
                sucess : false
            })
        }

        const token = generateTokens(client);

        res.cookie('token',token);

        return res.status(200).json({
            message : "Client logged in successfully",
            sucess : true,
            token : token
        });

    }catch(error){

        return res.status(500).json({
            message : "Internal server error",
            sucess : false
        })
    }
}

//--------------------------------------------------------------------------------------//



// --------------------------- Login function for Drivers ------------------------------//

exports.driverLogin = async (req,res)=>{

    try{

        const {email,password} = req.body;

        if(!email || !password){
            return res.status(400).json({
                message : "Please provide email and password",
                sucess : false
            })
        }

        const driver = await Driver.findOne({email});

        if(!driver){
            return res.status(404).json({
                message : "Driver not found",
                sucess : false
            })
        }

        const isPasswordValid = await bcrypt.compare(password,driver.password);

        if(!isPasswordValid){

            return res.status(401).json({
                message : "Invalid password",
                sucess : false
            })
        }

        const token = generateTokens(driver);

        res.cookie('token',token);

        return res.status(200).json({
            message : "Driver logged in successfully",
            sucess : true,
            token : token
        });

    }catch(error){

        return res.status(500).json({
            message : "Internal server error",
            sucess : false
        })
    }
}


//-----------------------------------------------------------------------------------------//



// --------------------------- Register function for Clients ------------------------------//

exports.clientRegister = async (req,res) =>{

    try{

        const {name,email,mobile,password} = req.body;

        if(!name || !email || !mobile || !password){
            return res.status(400).json({
                message : "Please provide all required fields",
                sucess : false
            })
        }

        const existingClient = await Client.findOne({email});

        if(existingClient){
            return res.status(409).json({
                message : "Client with this email already exists",
                sucess : false
            })
        }

        const hashedPassword = await bcrypt.hash(password,10);

        const newClient = await Client.create({

            name : name,
            email : email,
            password : hashedPassword,
            mobile : mobile
        });


        const token = generateTokens(newClient);

        res.cookie('token',token);

        return res.status(201).json({
            message : "Client registered successfully",
            sucess : true,
            token : token
        })

    }catch(error){
        
        return res.status(500).json({
            message : error.message,
            success : false
        })
    }
}



//-----------------------------------------------------------------------------------------//



// --------------------------- Register function for Drivers ------------------------------//

exports.driverRegister = async (req,res) =>{

    try{
        const {name,email,mobile,password,VehicleNumber,VehicleType} = req.body;    

        if(!name || !email || !mobile || !password || !VehicleNumber || !VehicleType){
            return res.status(400).json({
                message : "Please provide all required fields",
                sucess : false
            })
        }

        const existingDriver = await Driver.findOne({email});

        if(existingDriver){
            return res.status(409).json({
                message : "Driver with this email already exists",
                sucess : false
            })
        }

        const hashedPassword = await bcrypt.hash(password,10);

        const newDriver = await Driver.create({
            name : name,
            email : email,
            password : hashedPassword,
            mobile : mobile,
            VehicleNumber : VehicleNumber,
            VehicleType : VehicleType
        });

        const token = generateTokens(newDriver);

        res.cookie('token',token);  

        return res.status(201).json({
            message : "Driver registered successfully",
            sucess : true,
            token : token
        })

    }catch(error){
        return res.status(500).json({
            message : error.message,    
            success : false
        })
    }
}
