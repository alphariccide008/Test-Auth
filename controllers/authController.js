const { signupSchema, signinSchema, acceptCodeSchema, changePasswordSchema, acceptFPCodeScheme} = require('../middlewares/validators');
const User = require('../models/usersModel')
const jwt = require("jsonwebtoken")
const { doHash, doHashValidation, hmacprocess } = require('../utils/hashing')
const transport = require('../middlewares/sendMail')
exports.signup = async (req, res) =>{
const { signupSchema, signinSchema} = require('../middlewares/validators');


    
    // Recieveing the user input Data
    const {email, password} = req.body;

    // setting the behaviour of the function
    try {
        const {error, value} = signupSchema.validate({email,password});

        if (error){
            return res.status(401).json({success:false, message:error.details[0].message})
        }
        //checking for existing user in the Database 
        const existingUsers = await User.findOne({email});
        if(existingUsers){
            return res.status(401).json({sucess:false, message:'User already exist'})
        }


        //Nb: always remember that the password has to be hashed 
         const hashPassword = await doHash(password, 12)

         //saving the user information as a new user to the database
         const newUser = new User({
            email,
            password:hashPassword
         });
         const result = await newUser.save();
         //This would enable not sending the hased password back to the client
         result.password = undefined;
         res.status(201).json({
            success:true,messages:'Account has successfully been created successuflly', result
         })

        
    } catch (error) {
        console.log(error)
    }
}



exports.signin = async (req, res) =>{
    const {email, password} = req.body;
    try {
        const {error, value} = signinSchema.validate({email, password});
        if(error){
           return res.status(401).json({success:false, message: error.details[0].message});
        }
        
        //Retrieving and comparing thing the input and the in the Database selecting both the email and password 
        const existingUsers = await User.findOne({email}).select('+password');

        //Checking the database with the email to see if the use exists and sending the error 
        if(!existingUsers){
            return res.status(401).json({success : false , message:"User does not exist"})
        }

        //Validating and checking the password using the hashpassword unhashiong value 
        const result = await doHashValidation(password, existingUsers.password);
        if(!result){
            return res.status(401).json({success:false , message : "Invalid Credentials"});
        }

        //If correct store the user with a section and creating cookies 
        const token = jwt.sign({
            userId : existingUsers._id,
            email : existingUsers.email,
            verfied : existingUsers.verfied,
        }, process.env.TOKEN_SECRET,
        {
            expiresIn: '8h'
        }
    );

        //Creating a cookie and sending the feedback to the user 
       // Creating a cookie and sending the feedback to the user
        res.cookie("Authorization", "Bearer " + token, {
        expires: new Date(Date.now() + 8 * 3600000), // 8 hours
        httpOnly: process.env.NODE_ENV === "production", // Prevent client-side access in production
        secure: process.env.NODE_ENV === "production"  // Use HTTPS in production
        
        }).json({
        success: true,
        token,
        message: "Logged in successfully"
        });
         


    } catch (error) {
        console.log(error)
    }
}

//this sis the sign out function clearing the cookie 
exports.signout = async(req, res) =>{
    res.clearCookie("Authorization").status(200).json({
        success:true,
        message:"Logged out successfully"
    });
};

//send verification code to check if they are verified 
exports.sendVerifcationCode = async(req,res) => {
    //pick the email from the Input 
    const { email } = req.body;
    try {
        //checking if the email is attached already to an existing user
        const exisitingUser = await User.findOne({email});
        if(!exisitingUser){
            return res.status(201).json({
                success:false,
                message:"user Does not exist"
            });
        }
        //If the user exist , check if the email or user is already verified
        if(exisitingUser.verified){
           return res.status(400).json({success:false , message: "you've already been verified"}) 
        }
        //if the user is not verified first you create the codeValue that would be sent to the user email and also creating the sendMail function file in the middleware
        const codeValue = Math.floor(10000 + Math.random() * 1000000).toString()
        //forming the mail
        const info = await transport.sendMail({
            from : process.env.NODE_CODE_SENDER_EMAIL,
            to : exisitingUser.email,
            subject: 'Verification Code',
            html : '<h1>' + codeValue + '</h1>'
        });

        //checking if the code was sent and saving it to the Database.
        if(info.accepted[0] === exisitingUser.email){
            const hashedCodeValue = hmacprocess( 
                codeValue,
                process.env.HMAC_VERIFICATION_CODE_SENDER
            );
            exisitingUser.verificationCode = hashedCodeValue;
            exisitingUser.verificationCodeValidation = Date.now();
            await exisitingUser.save();
            return res.status(200).json({ success:true, message :'code sent !'})
        }
        return res.status(400).json({ success: false  , message : 'code sent failed'})

    } catch (error) {
        console.log(error)
    }
};

//verifying the code that was sent to the email 
exports.verifyVerificationCode = async (req, res) =>{
    //collec the Data from the UI input 
    const { email, providedCode } = req.body;
    
    //Always remember to write in a try an catch error 
    try {
    //Validate the date i just incase it's empty
    const {error, value} = acceptCodeSchema.validate({ email ,providedCode});
    if(error){
        return res.status(400).json({
            success: false, message : error.details[0].message
        })
    }
    //Check if the user exists
    const exisitingUser = await User.findOne({email}).select("+verificationCode +verificationCodeValidation");
    //if user exist check if the user has already been verified 
    if(!exisitingUser){
        return res.status(400).json({
            success:false,
            message:"User does not exist"
        });

    }
     //if the User exist , verify if the user has been verifies 
     if(exisitingUser.verified){
        return res.status(400).json({
            success: false,
            message:"You are already  verified"
        })
     };
     //if the user doest not hava a verification code sent 
     if(!exisitingUser.verificationCode || !exisitingUser.verificationCodeValidation){
        return res.status(400).json({
            success: false,
            message: "Something is wrong with the code "
        })
     }

    //Checking if the otp sent is still active or hve expired withh 5 minutes 
    if(Date.now() - exisitingUser.verificationCodeValidation > 5* 60 * 1000 ){
        return res.status(400).json({
            success:false, message:"Code has expired"
        })
    }
    //But if its true then validating the code is corred 
    const hashedCodeValue = hmacprocess(providedCode, process.env.HMAC_VERIFICATION_CODE_SENDER)
    //checking if its the same 
    if(hashedCodeValue === exisitingUser.verificationCode){
        exisitingUser.verfied = true;
        exisitingUser.verificationCode =undefined;
        exisitingUser.verificationCodeValidation = undefined;
        await exisitingUser.save();
        return res.status(200).json({
            success:true,
            message:"User has been verified"
        })

    }
    //this is the else statement 
    return res.status(400).json({
        success:false,
        message: "Something went wrong"
    })

    } catch (error) {
        console.log(error)
    }
}


exports.changePassword = async (req, res) =>{
    const {userId, verified} = req.user;
    const {oldPassword, newPassword} = req.body;
    try {
        const {error, value} = changePasswordSchema.validate({oldPassword,newPassword})
        //checking if there's an error 
        if(error){
            return res.status(400).json({
                success:false,
                message: error.details[0].message
            })
        }
        //if there is not error you can either choose to check if the user is verified or not to be able to change their password 
        //if(!verified){ return res.status(401).json({success:false, message:"user not verified"})}


        //checking if the user and password exist 
        const exisitingUser = await User.findOne({_id:userId}).select("+password");
        if(!exisitingUser){
            return res.status(402).json({
                success:false, 
                message:"User  does not exist"
            })
        }
        //Validating if the passowrd provide corresponds with the one that was provided
        const result = await doHashValidation(oldPassword, exisitingUser.password);
        if(!result){
            return res.status(401).json({
                success:false,
                message:"Invalid credential"
            })
        }
        //if the result is true then we would be updating the password with the one in the database using doHash.
        const hashedPassword = await doHash(newPassword, 12);
        exisitingUser.password = hashedPassword;
        exisitingUser.save();
        return res.status(200).json({
            success: true,
            message: "Password successfully Updated"
        })
    } catch (error) {
        console.log(error)
    }
}


//send verification code to check for forgot password  
exports.sendForgotPasswordCode = async(req,res) => {
    //pick the email from the Input 
    const { email } = req.body;
    try {
        //checking if the email is attached already to an existing user
        const exisitingUser = await User.findOne({email});
        if(!exisitingUser){
            return res.status(201).json({
                success:false,
                message:"user Does not exist"
            });
        }
        
        //if the user is not verified first you create the codeValue that would be sent to the user email and also creating the sendMail function file in the middleware
        const codeValue = Math.floor(10000 + Math.random() * 1000000).toString()
        //forming the mail
        const info = await transport.sendMail({
            from : process.env.NODE_CODE_SENDER_EMAIL,
            to : exisitingUser.email,
            subject: 'Forgot password Verification Code',
            html : '<h1>' + codeValue + '</h1>'
        });

        //checking if the code was sent and saving it to the Database.
        if(info.accepted[0] === exisitingUser.email){
            const hashedCodeValue = hmacprocess( 
                codeValue,
                process.env.HMAC_VERIFICATION_CODE_SENDER
            );
            exisitingUser.forgotPasswordCode = hashedCodeValue;
            exisitingUser.forgotPasswordCodeValidation = Date.now();
            await exisitingUser.save();
            return res.status(200).json({ success:true, message :'code sent !'})
        }
        return res.status(400).json({ success: false  , message : 'code sent failed'})

    } catch (error) {
        console.log(error)
    }
};

//verifying the code that was sent to the email 
exports.verifyForgotPasswordCode = async (req, res) =>{
    //collec the Data from the UI input 
    const { email, providedCode , newPassword } = req.body;
    
    //Always remember to write in a try an catch error 
    try {
    //Validate the date i just incase it's empty
    const {error, value} = acceptFPCodeScheme.validate({ email ,providedCode , newPassword});
    if(error){
        return res.status(400).json({
            success: false, message : error.details[0].message
        })
    }
    //Check if the user exists
    const codeValue = providedCode.toString();
    const exisitingUser = await User.findOne({email}).select("+forgotPasswordCode +forgotPasswordCodeValidation");
    //if user exist check if the user has already been verified 
    if(!exisitingUser){
        return res.status(400).json({
            success:false,
            message:"User does not exist"
        });

    }
 
     //if the user doest not hava a verification code sent 
     if(!exisitingUser.forgotPasswordCode || !exisitingUser.forgotPasswordCodeValidation){
        return res.status(400).json({
            success: false,
            message: "Something is wrong with the code "
        })
     }

    //Checking if the otp sent is still active or hve expired withh 5 minutes 
    if(Date.now() - exisitingUser.forgotPasswordCodeValidation > 5* 60 * 1000 ){
        return res.status(400).json({
            success:false, message:"Code has expired"
        })
    }
    //But if its true then validating the code is corred 
    const hashedCodeValue = hmacprocess(codeValue, process.env.HMAC_VERIFICATION_CODE_SENDER)
    //checking if its the same 
    if(hashedCodeValue === exisitingUser.forgotPasswordCode){
        const hashPassword = await doHash(newPassword, 12)
        exisitingUser.password = hashPassword;
        exisitingUser.forgotPasswordCode = undefined;
        exisitingUser.forgotPasswordCodeValidation = undefined;
        await exisitingUser.save();
        return res.status(200).json({
            success:true,
            message:"Password Updated Successfully"
        })

    } 
    //this is the else statement 
    return res.status(400).json({
        success:false,
        message: "Something went wrong"
    })

    } catch (error) {
        console.log(error)
    }
}
