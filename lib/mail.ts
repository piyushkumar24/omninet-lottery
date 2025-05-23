import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const domain = process.env.NEXT_PUBLIC_APP_URL;

export const sendTwoFactorTokenEmail = async (email: string, token: string) => {
  try {
    const result = await resend.emails.send({
      from: 'noreply@resend.dev',
      to: email,
      subject: '2FA Code - 0MNINET',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <h1 style="color: #1e293b; text-align: center; margin-bottom: 20px;">Two-Factor Authentication</h1>
            <p style="font-size: 16px; color: #334155; margin-bottom: 20px;">Your 2FA verification code:</p>
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 24px; font-weight: bold; color: #1e293b; letter-spacing: 4px;">${token}</span>
            </div>
            <p style="font-size: 14px; color: #64748b; text-align: center;">This code will expire in 5 minutes.</p>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px;"><strong>The 0mninet Team</strong></p>
            </div>
          </div>
        </div>
      `,
    });
    
    console.log("2FA email sent successfully:", result.data?.id);
    return result;
  } catch (error) {
    console.error("Error sending 2FA email:", error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${domain}/auth/new-password?token=${token}`;

  try {
    const result = await resend.emails.send({
      from: 'noreply@resend.dev',
      to: email,
      subject: 'Reset Your Password - 0MNINET',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e293b; margin: 0;">Reset Your Password</h1>
              <p style="color: #64748b;">0MNINET Account Recovery</p>
            </div>
            
            <p style="font-size: 16px; color: #334155; margin-bottom: 20px;">
              We received a request to reset your password. Click the button below to choose a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #10b981); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
              If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px;"><strong>The 0mninet Team</strong></p>
            </div>
          </div>
        </div>
      `,
    });
    
    console.log("Password reset email sent successfully:", result.data?.id);
    return result;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

export const sendVerificationEmail = async (email: string, token: string, userName?: string) => {
  const confirmLink = `${domain}/auth/new-verification?token=${token}`;
  
  // Use provided name or extract first name from email as fallback
  let firstName = 'Friend';
  if (userName) {
    firstName = userName.split(' ')[0];
  } else {
    // Extract first name from email (before @ symbol) as fallback
    firstName = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm Your Email - 0MNINET</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px;
                background-color: #f8fafc;
            }
            .container { 
                background: white; 
                padding: 40px; 
                border-radius: 16px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                border: 1px solid #e2e8f0;
            }
            .header { 
                text-align: center; 
                margin-bottom: 30px; 
            }
            .logo { 
                font-size: 28px; 
                font-weight: bold; 
                background: linear-gradient(135deg, #3b82f6, #10b981);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 10px;
            }
            .btn { 
                display: inline-block; 
                background: linear-gradient(135deg, #3b82f6, #10b981);
                color: white; 
                padding: 16px 32px; 
                text-decoration: none; 
                border-radius: 12px; 
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
                transition: all 0.3s ease;
            }
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
            }
            .features {
                background: #f1f5f9;
                padding: 20px;
                border-radius: 12px;
                margin: 20px 0;
            }
            .feature-item {
                margin: 8px 0;
                padding-left: 24px;
                position: relative;
            }
            .feature-item:before {
                content: '●';
                color: #10b981;
                font-weight: bold;
                position: absolute;
                left: 0;
            }
            .footer { 
                text-align: center; 
                margin-top: 30px; 
                padding-top: 20px; 
                border-top: 1px solid #e2e8f0;
                color: #64748b;
                font-size: 14px;
            }
            .emoji { font-size: 20px; margin-right: 8px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">0MNINET</div>
                <h1 style="color: #1e293b; margin: 0;">Welcome to the Community!</h1>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${firstName}</strong>,</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
                Thank you for becoming part of the 0mninet community!<br>
                You're just one step away from entering our weekly lottery.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmLink}" class="btn">
                    <span class="emoji">👉</span>
                    Confirm My Email
                </a>
            </div>
            
            <div class="features">
                <p style="font-weight: 600; margin-bottom: 15px; color: #1e293b;">Once confirmed, you'll be able to:</p>
                <div class="feature-item"><span class="emoji">🎯</span>Complete surveys</div>
                <div class="feature-item"><span class="emoji">🎟</span>Earn tickets</div>
                <div class="feature-item"><span class="emoji">🏆</span>Win a $50 Amazon Gift Card every week</div>
            </div>
            
            <p style="font-size: 16px; margin-top: 25px; color: #1e293b;">
                Good luck — and welcome to the Free Internet Revolution! <span class="emoji">🌍</span>
            </p>
            
            <div class="footer">
                <p><strong>The 0mninet Team</strong></p>
                <p><a href="https://www.0mninet.com" style="color: #3b82f6; text-decoration: none;">www.0mninet.com</a></p>
            </div>
        </div>
    </body>
    </html>
  `;

  try {
    const result = await resend.emails.send({
      from: 'noreply@resend.dev',
      to: email,
      subject: 'Confirmation Link – 0MNINET Lottery',
      html: emailHtml,
    });
    
    console.log("Verification email sent successfully:", result.data?.id);
    return result;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};
