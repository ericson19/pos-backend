const nodemailer = require("nodemailer");
const otpMail = require("../mails/mailTemplate");
const Settings = require("../models/settingModel");

const mailTransporter = async (to, subject, content) => {
  const settings = await Settings.findOne({});
  if (
    !settings ||
    !settings.emailHost ||
    !settings.emailPort ||
    !settings.emailUsername ||
    !settings.emailPassword
  ) {
    console.error("Email settings are not properly configured.");
    return;
  }
  const mailConfig = nodemailer.createTransport({
    host: settings.emailHost,
    port: settings.emailPort,
    secure: true, // true for 465, false for other ports
    auth: {
      user: settings.emailUsername,
      pass: settings.emailPassword,
    },
    // logger: true,
    // debug: true,
  });
  (async () => {
    try {
      const info = await mailConfig.sendMail({
        from: `${settings.siteName} <${settings.emailUsername}>`, // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        html: content, // html body
      });
    } catch (error) {
      console.log("Error sending email:", error);
      console.error("Error sending email2:", error);
    }
  })();
};
module.exports = mailTransporter;
