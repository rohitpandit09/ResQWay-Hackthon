const mongoose = require("mongoose");

exports.connectDB = async () => {

    try{
        if(!process.env.MONGO_DB_URI){
            console.log("MONGO_DB_URI is not defined in env file")
        }

        await mongoose.connect(process.env.MONGO_DB_URI);

        console.log("MongoDB connected successfully");

    } catch (error) {

        console.error("Error connecting to MongoDB:", error);
        
    }
}