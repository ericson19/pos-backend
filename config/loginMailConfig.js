const nodemailer = require("nodemailer");
const otpMail = require("../mails/loginMail");

const mailTransporter = (name, store) => {
  const mailConfig = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    // logger: true,
    // debug: true,
  });
  (async () => {
    try {
      const info = await mailConfig.sendMail({
        from: `"POS System" <${process.env.MAIL_USER}>`, // sender address
        to: process.env.MAIL_USER, // list of receivers
        subject: `New Login Alert`, // Subject line
        html: otpMail(name, store), // html body
      });
    } catch (error) {
      console.log("Error sending email:", error);
      console.error("Error sending email2:", error);
    }
  })();
};
module.exports = mailTransporter;
