//Creating the email sender 
const nodemailer = require('nodemailer');

//Import the transport from nodemailer to process the email the code is sending from 
const transport = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user:process.env.NODE_CODE_SENDER_EMAIL,
        pass :process.env.NODE_CODE_SENDER_PASSWORD
    },
})

module.exports = transport;