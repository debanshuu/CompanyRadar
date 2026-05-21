const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendConfirmationEmail(name, email) {
  await transporter.sendMail({
    from: `"CompanyRadar" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to CompanyRadar!',
    html: `
      <h2>Hi ${name}, welcome to CompanyRadar!</h2>
      <p>Your account has been successfully created.</p>
      <p>Start analyzing companies at <a href="https://companyradar.onrender.com">companyradar.onrender.com</a></p>
    `
  });
}

module.exports = { sendConfirmationEmail };