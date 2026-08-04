const loginMail = (name, store) => {
  return `<div style="max-width: 480px; margin: auto; background: #ffffff; padding: 20px; border-radius: 10px; font-family: Arial, sans-serif; border: 1px solid #e5e7eb;">
  <h2 style="text-align: center; color: #111827; margin-bottom: 10px;">
    New Login Alert
  </h2>

    <p style="text-align: center; color: #4b5563; font-size: 15px;">
    Dear Administrator,</p>

    <p style="text-align: center; color: #4b5563; font-size: 15px;">
    We wanted to inform you that ${name} has just logged into the POS System for ${store}. 
    </p>

  

    <p style="margin-top: 25px; text-align: center; color: #9ca3af; font-size: 12px;">
    © ${new Date().getFullYear()} POS System — All rights reserved.
  </p>


</div>`;
};
