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

  try {
    const result = await resend.emails.send({
      from: 'noreply@resend.dev',
      to: email,
      subject: '🎯 Ticket Earned - 0MNINET Lottery',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e293b; margin: 0;">Ticket Earned! 🎯</h1>
              <p style="color: #64748b;">0MNINET Weekly Lottery</p>
            </div>
            
            <p style="font-size: 16px; color: #334155; margin-bottom: 20px;">
              Hi ${firstName},
            </p>
            
            <p style="font-size: 16px; color: #334155; margin-bottom: 20px;">
              Great job! You've earned ${data.ticketCount} new lottery ${data.ticketCount === 1 ? 'ticket' : 'tickets'} for completing a survey.
            </p>
            
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e293b; margin-top: 0;">Ticket Details:</h3>
              <p style="margin-bottom: 8px;"><strong>Number of Tickets:</strong> ${data.ticketCount}</p>
              <p style="margin-bottom: 0;"><strong>Draw Date:</strong> ${formattedDrawDate}</p>
            </div>
            
            <p style="font-size: 16px; color: #334155; margin-bottom: 20px;">
              Your ticket has been automatically applied to the upcoming lottery draw.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${domain}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #10b981); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">
                View Your Dashboard
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px;"><strong>The 0mninet Team</strong></p>
            </div>
          </div>
        </div>
      `,
    });
    
    console.log("Ticket application email sent successfully:", result.data?.id);
    return result;
  } catch (error) {
    console.error("Error sending ticket application email:", error);
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
  const formattedDrawDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(drawDate);

  // Create a unique tracking token for this non-winner email
  const trackingToken = `nw_${userId}_${Date.now()}`;
  const dashboardLink = `${domain}/dashboard?source=non_winner_email&token=${trackingToken}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Lottery Results + Bonus Opportunity - 0MNINET</title>
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
            .bonus-offer {
                background: linear-gradient(135deg, #f0f9ff, #e0f7fa);
                border: 2px solid #0ea5e9;
                padding: 25px;
                text-align: center;
                border-radius: 16px;
                margin: 25px 0;
            }
            .tickets-highlight {
                font-size: 32px;
                font-weight: bold;
                color: #0ea5e9;
                margin: 15px 0;
            }
            .cta-button { 
                display: inline-block; 
                background: linear-gradient(135deg, #0ea5e9, #10b981);
                color: white; 
                padding: 18px 36px; 
                text-decoration: none; 
                border-radius: 12px; 
                font-weight: 600;
                font-size: 18px;
                margin: 20px 0;
                box-shadow: 0 6px 20px rgba(14, 165, 233, 0.3);
                transition: all 0.3s ease;
            }
            .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(14, 165, 233, 0.4);
            }
            .how-it-works {
                background: #f8fafc;
                padding: 20px;
                border-radius: 12px;
                margin: 20px 0;
            }
            .step {
                margin: 12px 0;
                padding-left: 30px;
                position: relative;
                font-size: 16px;
            }
            .step:before {
                content: counter(step-counter);
                counter-increment: step-counter;
                position: absolute;
                left: 0;
                top: 0;
                background: #0ea5e9;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 12px;
            }
            .steps-container {
                counter-reset: step-counter;
            }
            .footer { 
                text-align: center; 
                margin-top: 30px; 
                padding-top: 20px; 
                border-top: 1px solid #e2e8f0;
                color: #64748b;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">0MNINET</div>
                <h1 style="color: #1e293b; margin: 0; font-size: 24px;">This week's lottery draw has just closed</h1>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 25px; color: #475569;">
                This week's lottery draw has just closed — and unfortunately, you weren't one of the winners.
            </p>
            
            <p style="font-size: 16px; margin-bottom: 25px; color: #1e293b; font-weight: 500;">
                But at 0mninet, even when you don't win... you don't leave empty-handed.
            </p>
            
            <div class="bonus-offer">
                <div style="font-size: 24px; margin-bottom: 15px;">🎁</div>
                <h2 style="color: #0ea5e9; margin: 0 0 15px 0; font-size: 22px;">
                    We've got a special reward just for you:
                </h2>
                <p style="color: #1e293b; font-size: 18px; font-weight: 500; margin-bottom: 10px;">
                    Complete just 1 survey and get
                </p>
                <div class="tickets-highlight">+2 BONUS tickets</div>
                <p style="color: #1e293b; font-size: 16px; margin-top: 10px;">
                    for next week's draw.
                </p>
                <p style="color: #0ea5e9; font-size: 16px; font-weight: 500; margin-top: 15px;">
                    That's twice the chances to win — just for staying in the game.
                </p>
            </div>
            
            <div class="how-it-works">
                <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 20px; font-size: 18px;">
                    Here's how it works:
                </h3>
                <div class="steps-container">
                    <div class="step">Click the button below</div>
                    <div class="step">Complete a short survey</div>
                    <div class="step">🎟 Your 2 bonus tickets will be added instantly to your account</div>
                </div>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="${dashboardLink}" class="cta-button">
                    Claim Your Bonus Tickets
                </a>
            </div>
            
            <p style="font-size: 16px; color: #1e293b; margin: 30px 0 15px 0;">
                Your time matters. And at 0mninet, every interaction brings you closer to your next opportunity.
            </p>
            
            <p style="font-size: 16px; color: #1e293b; font-weight: 600; margin: 25px 0;">
                Free internet is coming.<br>
                0mninet
            </p>
            
            <div class="footer">
                <p><strong>The 0mninet Team</strong></p>
                <p><a href="https://www.0mninet.com" style="color: #3b82f6; text-decoration: none;">www.0mninet.com</a></p>
                <p style="font-size: 12px; margin-top: 10px;">
                    If you have any questions, reply to this email or visit our support center.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;

  try {
    // Store the tracking token in settings for later verification
    await db.settings.upsert({
      where: { 
        key: `non_winner_email_${trackingToken}` 
      },
      update: {
        value: JSON.stringify({
          userId,
          email,
          userName,
          drawDate: drawDate.toISOString(),
          sentAt: new Date().toISOString(),
          bonusTicketsAwarded: false
        }),
        updatedAt: new Date(),
      },
      create: {
        key: `non_winner_email_${trackingToken}`,
        value: JSON.stringify({
          userId,
          email,
          userName,
          drawDate: drawDate.toISOString(),
          sentAt: new Date().toISOString(),
          bonusTicketsAwarded: false
        }),
        description: "Non-winner email tracking for bonus tickets"
      }
    });

    const result = await resend.emails.send({
      from: 'noreply@resend.dev',
      to: email,
      subject: `Your Lottery Results + Earn 2 BONUS Tickets - 0MNINET`,
      html: emailHtml,
    });
    
    console.log("Non-winner email sent successfully:", result.data?.id, "Tracking token:", trackingToken);
    return { success: true, trackingToken, result };
  } catch (error) {
    console.error("Error sending non-winner email:", error);
    throw error;
  }
};
