const nodemailer = require("nodemailer");

const emailPassword = process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD;

const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
        user: process.env.EMAIL_USER,
        pass: emailPassword
    }
});

module.exports = transporter;