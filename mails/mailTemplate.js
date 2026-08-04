exports.otpMail = (otp, name) => {
  return `<div style="max-width: 480px; margin: auto; background: #ffffff; padding: 20px; border-radius: 10px; font-family: Arial, sans-serif; border: 1px solid #e5e7eb;">
  
  <h2 style="text-align: center; color: #111827; margin-bottom: 10px;">
    Your OTP Code
  </h2>

  <p style="text-align: center; color: #4b5563; font-size: 15px;">
    Dear ${name}, Use the code below to verify your email. This code is valid for 10 minutes.
  </p>

  <div style="background: #f3f4f6; padding: 15px 0; margin: 20px 0; border-radius: 8px; text-align: center;">
    <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #2563eb;">
      ${otp}
    </span>
  </div>

  <p style="color: #6b7280; font-size: 14px;">
    If you didn't request this, you can safely ignore this email.
  </p>

  <p style="margin-top: 25px; text-align: center; color: #9ca3af; font-size: 12px;">
    © ${new Date().getFullYear()} POS System — All rights reserved.
  </p>

</div>`;
};

exports.userMail = (subject, message, user) => {
  return `<div style="max-width: 480px; margin: auto; background: #ffffff; padding: 20px; border-radius: 10px; font-family: Arial, sans-serif; border: 1px solid #e5e7eb;">
  <h2 style="text-align: center; color: #111827; margin-bottom: 10px;">
    ${subject}
  </h2>

  <p style="text-align: center; color: #4b5563; font-size: 15px;">
    Dear ${user},
  </p>

  <p style="text-align: center; color: #4b5563; font-size: 15px;">
    ${message}
  </p>

  <p style="margin-top: 25px; text-align: center; color: #9ca3af; font-size: 12px;">
    © ${new Date().getFullYear()} POS System — All rights reserved.
  </p>

</div>`;
};
// module.exports = otp;
