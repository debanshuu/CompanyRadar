const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function sendConfirmationEmail(name, email) {
  console.log('Sending email to:', email);
  
  const info = await transporter.sendMail({
    from: `"CompanyRadar" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to CompanyRadar!',
    html: `
      <h2>Hi ${name}, welcome to CompanyRadar!</h2>
      <p>Your account has been successfully created.</p>
      <p>Start analyzing companies at <a href="https://companyradar.onrender.com">companyradar.onrender.com</a></p>
    `
  });

  console.log('Email sent:', info.messageId);
}

module.exports = { sendConfirmationEmail };
