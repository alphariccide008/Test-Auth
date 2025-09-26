const joi = require("joi");

exports.signupSchema = joi.object({
    email: joi.string().min(6).max(60).required().email({tlds:{allow:['com','net']}

        //NB: this validates the type of data , the length of date, the domain of the data usinf email tids 
    }),
    password: joi.string().required()
            //NB: This validate the tupe of data , emptiness and the pattern of the pattern of the password to be used as tailored by the client
})


exports.signinSchema = joi.object({
    email: joi.string().min(6).max(60).required().email({tlds:{allow:['com','net']}

        //NB: this validates the type of data , the length of date, the domain of the data usinf email tids 
    }),
    password: joi.string().required()
            //NB: This validate the tupe of data , emptiness and the pattern of the pattern of the password to be used as tailored by the client
});

exports.acceptCodeSchema = joi.object({
     email: joi.string().min(6).max(60).required().email({tlds:{allow:['com','net']}

        //NB: this validates the type of data , the length of date, the domain of the data usinf email tids 
    }),
    providedCode: joi.number().required()
})


exports.changePasswordSchema = joi.object({
    newPassword: joi.string().required(),
    oldPassword : joi.string().required()
});


exports.acceptFPCodeScheme = joi.object({
    email: joi.string().required(),
    providedCode: joi.number().required(),
    newPassword: joi.string().required(),

});

exports.createPostSchema = joi.object({
    title: joi.string().required(),
    description: joi.string().min(3).max(600).required(),
    userId:joi.string().required()
    

});
