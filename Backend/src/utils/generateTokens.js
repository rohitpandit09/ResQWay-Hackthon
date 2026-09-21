const jwt = require('jsonwebtoken');

exports.generateTokens = (user)=>{

    try{

        const token = jwt.sign({
            id : user._id,
            email : user.email,
            mobile : user.mobile
        },process.env.JWT_SECRET,{
            expiresIn : '7d'
        });

        return token;

    }catch(error){
        console.error("Error generating token:", error);
        process.exit(1);
    }
}