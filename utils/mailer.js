const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendConfirmationEmail(name, email) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'CompanyRadar <onboarding@resend.dev>',
      to: email,
      subject: 'Welcome to CompanyRadar!',
      html: `
        <h2>Hi ${name}, welcome to CompanyRadar!</h2>
        <p>Your account has been successfully created.</p>
        <p>Start analyzing companies at <a href="https://companyradar.onrender.com">companyradar.onrender.com</a></p>
      `
    });
    if (error) console.error('Resend error:', error);
    else console.log('Email sent:', data.id);
  } catch (err) {
    console.error('Email failed:', err.message);
  }
}

module.exports = { sendConfirmationEmail };