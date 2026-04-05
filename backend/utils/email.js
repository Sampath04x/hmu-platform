import nodemailer from "nodemailer";

/**
 * Configure your SMTP settings in .env
 * EMAIL_HOST=smtp.gmail.com
 * EMAIL_PORT=587
 * EMAIL_USER=intrst2026@gmail.com
 * EMAIL_PASS=your-app-password
 */

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Intrst Platform" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your Verification Code for Intrst`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px; background-color: #0d0d0d; border-radius: 20px; color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #c2692a; margin: 0; font-size: 32px; letter-spacing: -1px;">Intrst</h1>
          <p style="color: #666; font-size: 14px; margin-top: 5px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Campus Connection Redefined</p>
        </div>
        
        <div style="background-color: #1a1a1a; padding: 30px; border-radius: 15px; border: 1px solid #333;">
          <p style="font-size: 16px; line-height: 1.6; color: #ccc;">Hello there,</p>
          <p style="font-size: 16px; line-height: 1.6; color: #ccc;">Welcome to the inner circle of your campus. Use the code below to verify your institutional identity and start connecting with your fellow Gitamites.</p>
          
          <div style="text-align: center; margin: 40px 0;">
            <div style="display: inline-block; padding: 20px 40px; background: linear-gradient(135deg, #c2692a 0%, #7d411a 100%); border-radius: 12px; font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
              ${otp}
            </div>
            <p style="font-size: 12px; color: #666; margin-top: 15px;">Valid for 10 minutes</p>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #333; margin: 30px 0;">
          
          <p style="font-size: 14px; color: #888;">If you didn't request this code, you can safely ignore this email. Someone might have entered your email by mistake.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
          <p>© 2026 Intrst Platform. For the students, by the students.</p>
          <p>Contact: <a href="mailto:intrst2026@gmail.com" style="color: #c2692a; text-decoration: none;">intrst2026@gmail.com</a></p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
};
