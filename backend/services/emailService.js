const transporter = require('../config/email');

const sendResetPasswordEmail = async (email, resetLink) => {
  if (!process.env.EMAIL_USER || !(process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD)) {
    const error = new Error(
      'Configure EMAIL_USER and EMAIL_PASS (or EMAIL_APP_PASSWORD) in the backend environment to send reset emails.'
    );
    error.code = 'EMAIL_CONFIGURATION_MISSING';
    throw error;
  }

  await transporter.sendMail({
    from: `"Loan Interest Management" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your Password',
    html: `
      <h2>Password Reset Request</h2>

      <p>We received a request to reset your password.</p>

      <p>Click the link below to create a new password:</p>

      <a href="${resetLink}">Reset Password</a>

      <p>This link expires in 15 minutes.</p>

      <p>If you did not request this, you can ignore this email.</p>
    `,
    text: `Reset your password using this link: ${resetLink}\n\nThis link expires in 15 minutes.`
  });
};

module.exports = { sendResetPasswordEmail };