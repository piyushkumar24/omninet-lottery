import { Resend } from 'resend';
import { db } from '@/lib/db';

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

export const sendTicketApplicationEmail = async (
  email: string,
  data: {
    name: string;
    ticketCount: number;
    drawDate: Date;
    confirmationCode?: string;
  }
) => {
  const firstName = data.name.split(' ')[0] || 'Friend';
  const formattedDrawDate = data.drawDate.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  // Create a direct link to view/redeem tickets
  const directLink = `${domain}/dashboard?ticket_confirmed=true&confirmation=${data.confirmationCode}`;

  try {
    const result = await resend.emails.send({
      from: 'noreply@resend.dev',
      to: email,
      subject: '🎯 Ticket Earned - Your Entry is Confirmed! - 0MNINET Lottery',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background: white; padding: 30px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
            
            <!-- Header Section -->
            <div style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #3b82f6, #10b981); padding: 25px; border-radius: 12px; margin: -30px -30px 30px -30px;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎯 Ticket Earned!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">0MNINET Weekly Lottery - Entry Confirmed</p>
            </div>
            
            <div style="text-align: center; margin-bottom: 25px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 15px 25px; border-radius: 50px; font-size: 18px; font-weight: bold; margin-bottom: 15px;">
                ✅ ${data.ticketCount} Ticket${data.ticketCount === 1 ? '' : 's'} Confirmed!
              </div>
            </div>
            
            <p style="font-size: 16px; color: #334155; margin-bottom: 20px; text-align: center;">
              Hi ${firstName},
            </p>
            
            <p style="font-size: 16px; color: #334155; margin-bottom: 25px; text-align: center; line-height: 1.6;">
              <strong>Congratulations!</strong> Your survey has been completed and verified. Your ${data.ticketCount} lottery ${data.ticketCount === 1 ? 'ticket has' : 'tickets have'} been <strong style="color: #16a34a;">instantly credited</strong> to your account and automatically entered into the upcoming draw.
            </p>
            
            <!-- Ticket Details Card -->
            <div style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); padding: 25px; border-radius: 12px; margin: 25px 0; border: 2px solid #0284c7;">
              <h3 style="color: #0c4a6e; margin-top: 0; margin-bottom: 15px; font-size: 18px;">📋 Your Ticket Details</h3>
              <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <p style="margin: 5px 0;"><strong style="color: #0c4a6e;">Tickets Earned:</strong> <span style="color: #16a34a; font-weight: bold;">${data.ticketCount}</span></p>
                <p style="margin: 5px 0;"><strong style="color: #0c4a6e;">Draw Date:</strong> ${formattedDrawDate}</p>
                ${data.confirmationCode ? `<p style="margin: 5px 0;"><strong style="color: #0c4a6e;">Confirmation:</strong> <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${data.confirmationCode}</code></p>` : ''}
                <p style="margin: 5px 0;"><strong style="color: #0c4a6e;">Status:</strong> <span style="color: #16a34a; font-weight: bold;">✅ Active & Entered</span></p>
              </div>
            </div>
            
            <!-- Instant Access Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${directLink}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #10b981); color: white; padding: 18px 35px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3); transition: all 0.3s ease;">
                🎯 View Your Dashboard & Tickets
              </a>
            </div>
            
            <!-- Quick Actions -->
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 25px 0;">
              <h4 style="color: #1e293b; margin-top: 0; margin-bottom: 15px;">🚀 What's Next?</h4>
              <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
                <div style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid #22c55e;">
                  <strong style="color: #16a34a;">✅ Your Entry is Confirmed</strong><br>
                  <span style="color: #64748b; font-size: 14px;">No further action needed - you're automatically entered!</span>
                </div>
                <div style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                  <strong style="color: #1d4ed8;">🎫 Earn More Tickets</strong><br>
                  <span style="color: #64748b; font-size: 14px;">Take more surveys to increase your winning chances</span>
                </div>
                <div style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                  <strong style="color: #d97706;">👥 Invite Friends</strong><br>
                  <span style="color: #64748b; font-size: 14px;">Share your referral link to earn bonus tickets</span>
                </div>
              </div>
            </div>
            
            <!-- Emergency Support -->
            <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px; text-align: center;">
                <strong>🆘 Can't see your ticket?</strong> Click the button above or visit your dashboard directly. 
                If you still don't see your ticket within 2 minutes, please contact support with your confirmation code.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; margin: 0;"><strong>The 0mninet Team</strong></p>
              <p style="color: #94a3b8; font-size: 12px; margin: 5px 0 0 0;">This email confirms your lottery entry. Keep it for your records.</p>
            </div>
          </div>
        </div>
      `,
    });
    
    console.log("Enhanced ticket application email sent successfully:", result.data?.id);
    return result;
  } catch (error) {
    console.error("Error sending enhanced ticket application email:", error);
    throw error;
  }
};

export const sendWinnerNotificationEmail = async (
  email: string, 
  userName: string,
  prizeAmount: number,
  couponCode: string,
  drawDate: Date
) => {
  const formattedDrawDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(drawDate);

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Congratulations! You Won the Lottery - 0MNINET</title>
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
            .prize-amount {
                font-size: 42px;
                font-weight: bold;
                color: #16a34a;
                text-align: center;
                margin: 20px 0;
            }
            .coupon-code {
                background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
                border: 2px dashed #0284c7;
                padding: 20px;
                text-align: center;
                border-radius: 12px;
                margin: 30px 0;
            }
            .code {
                font-size: 28px;
                font-weight: bold;
                color: #0284c7;
                letter-spacing: 2px;
                font-family: monospace;
            }
            .instructions {
                background: #f1f5f9;
                padding: 20px;
                border-radius: 12px;
                margin: 20px 0;
            }
            .step {
                margin: 12px 0;
                padding-left: 24px;
                position: relative;
            }
            .step:before {
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
            .emoji { font-size: 24px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">0MNINET</div>
                <h1 style="color: #1e293b; margin: 0;">🎉 Congratulations! 🎉</h1>
                <p style="color: #64748b; font-size: 18px;">You Won the 0MNINET Lottery!</p>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
                Hi <strong>${userName}</strong>,
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
                Great news! You've won the 0MNINET lottery draw that took place on <strong>${formattedDrawDate}</strong>!
            </p>
            
            <div class="prize-amount">
                <span class="emoji">💰</span> $${prizeAmount.toFixed(2)} <span class="emoji">💰</span>
            </div>
            
            <p style="font-size: 16px; text-align: center; font-weight: 500; color: #1e293b;">
                Your Amazon Gift Card Coupon Code:
            </p>
            
            <div class="coupon-code">
                <div class="code">${couponCode}</div>
                <p style="margin-top: 10px; color: #0284c7; font-size: 14px;">
                    Use this code to redeem your prize on Amazon
                </p>
            </div>
            
            <div class="instructions">
                <p style="font-weight: 600; margin-bottom: 15px; color: #1e293b;">How to Redeem Your Prize:</p>
                <div class="step">Go to <a href="https://www.amazon.com/gc/redeem" style="color: #0284c7; text-decoration: none;">amazon.com/gc/redeem</a></div>
                <div class="step">Sign in to your Amazon account (or create one)</div>
                <div class="step">Enter the coupon code exactly as shown above</div>
                <div class="step">The gift card amount will be applied to your Amazon account balance</div>
                <div class="step">Use your balance on your next Amazon purchase!</div>
            </div>
            
            <p style="font-size: 16px; margin-top: 25px; color: #1e293b;">
                Thank you for participating in the 0MNINET lottery and supporting digital inclusion worldwide!
            </p>
            
            <p style="font-size: 14px; color: #64748b; margin-top: 20px;">
                <strong>What's Next?</strong><br>
                • You can continue to participate in future draws<br>
                • Keep earning tickets through surveys and referrals<br>
                • Look out for special promotions and bonus tickets
            </p>
            
            <div class="footer">
                <p><strong>The 0mninet Team</strong></p>
                <p><a href="https://www.0mninet.com" style="color: #3b82f6; text-decoration: none;">www.0mninet.com</a></p>
                <p style="font-size: 12px; margin-top: 10px;">
                    Need help? Reply to this email or visit our support center.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;

  try {
    const result = await resend.emails.send({
      from: 'noreply@resend.dev',
      to: email,
      subject: `🏆 CONGRATULATIONS! You Won the $${prizeAmount} Lottery Prize - 0MNINET`,
      html: emailHtml,
    });
    
    console.log("Winner notification email sent successfully:", result.data?.id);
    return result;
  } catch (error) {
    console.error("Error sending winner notification email:", error);
    throw error;
  }
};

export const sendNonWinnerEmail = async (
  email: string,
  userName: string,
  drawDate: Date,
  userId: string
) => {
  const firstName = userName.split(' ')[0] || 'Friend';
  const formattedDrawDate = drawDate.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Generate unique token for non-winner bonus tracking
  const nonWinnerToken = `nw_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  
  // Store token in database for verification later
  try {
    await db.settings.create({
      data: {
        key: `non_winner_email_${nonWinnerToken}`,
        value: JSON.stringify({
          userId,
          email,
          drawDate: drawDate.toISOString(),
          createdAt: new Date().toISOString(),
          bonusTicketsAwarded: false,
        }),
        description: `Non-winner email token for user ${userId}`,
      }
    });
  } catch (error) {
    console.error("Error storing non-winner token:", error);
    // Continue sending the email even if token storage fails
  }

  // Create the bonus claim URL with token
  const bonusUrl = `${domain}/dashboard?source=non_winner_email&token=${nonWinnerToken}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Better Luck Next Time - 0MNINET Lottery</title>
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
            .bonus-section {
                background: #f0f4ff; /* Light indigo */
                border: 2px dashed #818cf8; /* Indigo */
                padding: 20px;
                border-radius: 12px;
                margin: 30px 0;
                text-align: center;
            }
            .bonus-badge {
                display: inline-block;
                background: #6366f1; /* Indigo */
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 15px;
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
                <h1 style="color: #1e293b; margin: 0;">Unfortunate News</h1>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${firstName}</strong>,</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
                We're sorry to inform you that you didn't win the 0mninet lottery draw held on ${formattedDrawDate}.
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
                Don't worry though - there's always next week's draw, and we have a special bonus for you!
            </p>
            
            <div class="bonus-section">
                <span class="bonus-badge">SPECIAL OFFER</span>
                <h2 style="color: #4338ca; margin-top: 0;">Claim 2 Bonus Tickets!</h2>
                <p style="color: #4338ca;">
                    As a thank you for participating, we're offering you <strong>2 FREE BONUS TICKETS</strong> for the next lottery draw!
                </p>
                <a href="${bonusUrl}" class="btn" style="background: linear-gradient(135deg, #4f46e5, #6366f1);">
                    <span class="emoji">🎟️</span>
                    Claim My Bonus Tickets
                </a>
                <p style="font-size: 14px; color: #6366f1; margin-top: 15px;">
                    * Limited time offer. Click the button to claim your tickets now.
                </p>
            </div>
            
            <p style="font-size: 16px; margin-top: 25px; color: #1e293b;">
                Thanks for being part of the 0mninet community. Good luck in the next draw!
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
      subject: 'Better Luck Next Time - Get 2 Bonus Tickets!',
      html: emailHtml,
    });
    
    console.log("Non-winner email sent successfully:", result.data?.id);
    return result;
  } catch (error) {
    console.error("Error sending non-winner email:", error);
    throw error;
  }
};
