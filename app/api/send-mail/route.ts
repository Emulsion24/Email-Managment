import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req: Request) {
  try {
    // --- 1. ADMIN AUTHORIZATION CHECK ---
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    let adminId: string;
    try {
      const { payload } = await jwtVerify(token, secret);
      if (payload.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
      }
      adminId = payload.id as string;
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    // --- 2. DATA PARSING ---
    const { email, name, templateName, role: frontendRole, isBulk } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
    }

    // Determine Role for logging
    const userLookup = await query(
      'SELECT role FROM public.users WHERE email = $1 LIMIT 1',
      [email]
    );
    const role = userLookup.rows[0]?.role || frontendRole || 'user';

    // --- 3. TRANSPORTER SETUP ---
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: true, 
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      },
    });

    let emailHtml = '';
    let subject = '';

    // --- 4. TEMPLATE LOGIC ---
    if (templateName === 'Installer Welcome Email') {
      subject = `Welcome to the Rezillion Installer Network, ${name || 'Partner'}!`;
      emailHtml = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">Installer Onboarding</h2>
          <p>Hello ${name || 'there'},</p>
          <p>Welcome to our professional installer network. We are excited to have you on board.</p>
          <p>Your profile is being reviewed, and you will receive project notifications shortly.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">Rezillion Admin Team</p>
        </div>`;
    } else {
      // Default to User Welcome
      subject = `Welcome to Rezillion, ${name || 'User'}!`;
      emailHtml = `
       <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rezillion Solar Newsletter</title>
    <style>
        /* RESET STYLES */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: 'Arial', sans-serif; }
        
        /* CLIENT-SPECIFIC STYLES */
        a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
        
        /* MOBILE STYLES */
        @media screen and (max-width: 600px) {
            .w-100 { width: 100% !important; max-width: 100% !important; }
            .mobile-stack { display: block !important; width: 100% !important; }
            .p-20 { padding: 20px !important; }
            .img-full { width: 100% !important; height: auto !important; }
            .hero-text { font-size: 36px !important; }
            /* Adjust radius for mobile */
            .hero-cell { border-bottom-right-radius: 100px !important; }
        }
    </style>
</head>
<body style="background-color: #f4f4f4; margin: 0; padding: 0;">

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
        <tr>
            <td align="center" style="background-color: #f4f4f4;">
                
                <table border="0" cellpadding="0" cellspacing="0" width="600" class="w-100" style="background-color: #ffffff; max-width: 600px; border-collapse: collapse;">
                    
                    <tr>
                        <td bgcolor="#aeeaff" style="padding-bottom: 40px;  border-bottom-left-radius: 100px; border-bottom-right-radius: 100px;">
                            
                            <table border="0" cellpadding="0" cellspacing="0" width="85%" align="center">
                                <tr>
                                    <td class="hero-cell" align="center" bgcolor="#4285f4" style="
                                        padding: 30px 40px 100px 40px; 
                                        background-color: #4285f4; 
                                        background-image: url('https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'); 
                                        background-size: cover; 
                                        background-position: center bottom;
                                        background-blend-mode: overlay;
                                        /* The Big Sweep Curve */
                                        border-bottom-right-radius: 170px;
                                        /* Top corners rounded to match the 'inset' look */
                                     border-bottom-left-radius: 20px;
                                        color: #ffffff;">
                                        
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td align="left" valign="middle" style="color: #ffffff; font-weight: bold; font-size: 24px;">
                                                    Rezillion
                                                    <div style="font-size: 10px; font-weight: normal; opacity: 0.8;">Building Renewable Energy for Zillions</div>
                                                </td>
                                                <td align="right" valign="middle">
                                                    <a href="#" target="_blank" style="text-decoration: none; margin-left: 10px;">
                                                        <img src="https://img.icons8.com/ios-filled/50/ffffff/facebook--v1.png" alt="Facebook" width="20" height="20" style="display: inline-block; border: 0; vertical-align: middle;">
                                                    </a>
                                                    <a href="#" target="_blank" style="text-decoration: none; margin-left: 10px;">
                                                        <img src="https://img.icons8.com/ios-filled/50/ffffff/instagram-new.png" alt="Instagram" width="20" height="20" style="display: inline-block; border: 0; vertical-align: middle;">
                                                    </a>
                                                    <a href="#" target="_blank" style="text-decoration: none; margin-left: 10px;">
                                                        <img src="https://img.icons8.com/ios-filled/50/ffffff/tiktok.png" alt="TikTok" width="20" height="20" style="display: inline-block; border: 0; vertical-align: middle;">
                                                    </a>
                                                </td>
                                            </tr>

                                            <tr>
                                                <td colspan="2" align="left" style="padding-top: 50px;">
                                                    <p style="margin: 0; font-size: 16px; font-weight: 500;">We are</p>
                                                    <h1 class="hero-text" style="margin: 5px 0 15px 0; font-size: 48px; line-height: 1.1; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Rezillion</h1>
                                                    <p style="margin: 0 0 25px 0; font-size: 14px; line-height: 1.5; max-width: 400px; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
                                                        Excited to Greenergize? Compare Solar Installers, Get the Best Quote, and Go Solar With Confidence.
                                                    </p>
                                                    
                                                    <table border="0" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td align="center" bgcolor="#1a202c" style="border-radius: 4px;">
                                                                <a href="#" target="_blank" style="font-size: 14px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 12px 25px; border: 1px solid #1a202c; display: inline-block; font-weight: bold;">Get Started</a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding: 40px 30px 10px 30px;">
                                        <p style="font-size: 14px; color: #333333; line-height: 1.6; text-align: center; margin: 0 0 25px 0;">
                                            Our Solar Project Builder combines site readiness, energy calculation, and project submission into one seamless experience — helping homeowners, businesses, and industries go solar with total clarity and confidence.
                                        </p>
                                         <table border="0" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td align="center" bgcolor="#1a202c" style="border-radius: 4px;">
                                                    <a href="#" target="_blank" style="font-size: 14px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 12px 25px; border: 1px solid #1a202c; display: inline-block; font-weight: bold;">Build Your Solar Project Now</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            </td>
                    </tr>
                    <tr>
                        <td bgcolor="#ffffff" style="padding: 40px 20px;">
                            <h2 style="text-align: center; font-size: 28px; color: #000000; margin-bottom: 30px;">Why Rezillion?</h2>
                            
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: separate;">
                                <tr>
                                    <td valign="top" width="50%" class="mobile-stack" style="padding: 10px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: separate !important; border-spacing: 0; border: 1px solid #000000; border-radius: 15px; overflow: hidden; height: 100px;">
                                            <tr>
                                                <td style="padding: 20px; background-color: #ffffff;">
                                                    <img src="https://img.icons8.com/ios-filled/50/000000/checklist.png" width="30" alt="icon" style="display:block; margin-bottom: 10px;">
                                                    <span style="font-family: Arial, sans-serif; font-weight: bold; font-size: 16px; color: #000000;">Pre-installation Checklist</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td valign="top" width="50%" class="mobile-stack" style="padding: 10px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: separate !important; border-spacing: 0; border: 1px solid #000000; border-radius: 15px; overflow: hidden; height: 100px;">
                                            <tr>
                                                <td style="padding: 20px; background-color: #ffffff;">
                                                    <img src="https://img.icons8.com/ios-filled/50/000000/solar-panel.png" width="30" alt="icon" style="display:block; margin-bottom: 10px;">
                                                    <span style="font-family: Arial, sans-serif; font-weight: bold; font-size: 16px; color: #000000;">Solar Energy Calculator</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <tr>
                                    <td valign="top" width="50%" class="mobile-stack" style="padding: 10px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: separate !important; border-spacing: 0; border: 1px solid #000000; border-radius: 15px; overflow: hidden; height: 100px;">
                                            <tr>
                                                <td style="padding: 20px; background-color: #ffffff;">
                                                    <img src="https://img.icons8.com/ios-filled/50/000000/auction.png" width="30" alt="icon" style="display:block; margin-bottom: 10px;">
                                                    <span style="font-family: Arial, sans-serif; font-weight: bold; font-size: 16px; color: #000000;">Competitive Bidding</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td valign="top" width="50%" class="mobile-stack" style="padding: 10px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: separate !important; border-spacing: 0; border: 1px solid #000000; border-radius: 15px; overflow: hidden; height: 100px;">
                                            <tr>
                                                <td style="padding: 20px; background-color: #ffffff;">
                                                    <img src="https://img.icons8.com/ios-filled/50/000000/handshake.png" width="30" alt="icon" style="display:block; margin-bottom: 10px;">
                                                    <span style="font-family: Arial, sans-serif; font-weight: bold; font-size: 16px; color: #000000;">End to End Management</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                 <tr>
                                    <td valign="top" width="50%" class="mobile-stack" style="padding: 10px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: separate !important; border-spacing: 0; border: 1px solid #000000; border-radius: 15px; overflow: hidden; height: 100px;">
                                            <tr>
                                                <td style="padding: 20px; background-color: #ffffff;">
                                                    <img src="https://img.icons8.com/ios-filled/50/000000/blueprint.png" width="30" alt="icon" style="display:block; margin-bottom: 10px;">
                                                    <span style="font-family: Arial, sans-serif; font-weight: bold; font-size: 16px; color: #000000;">Engineering Drawing Hub</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td valign="top" width="50%" class="mobile-stack" style="padding: 10px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: separate !important; border-spacing: 0; border: 1px solid #000000; border-radius: 15px; overflow: hidden; height: 100px;">
                                            <tr>
                                                <td style="padding: 20px; background-color: #ffffff;">
                                                    <img src="https://img.icons8.com/ios-filled/50/000000/star.png" width="30" alt="icon" style="display:block; margin-bottom: 10px;">
                                                    <span style="font-family: Arial, sans-serif; font-weight: bold; font-size: 16px; color: #000000;">Powerful Installer Scoring</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <tr>
                                    <td valign="top" width="50%" class="mobile-stack" style="padding: 10px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: separate !important; border-spacing: 0; border: 1px solid #000000; border-radius: 15px; overflow: hidden; height: 100px;">
                                            <tr>
                                                <td style="padding: 20px; background-color: #ffffff;">
                                                    <img src="https://img.icons8.com/ios-filled/50/000000/clock.png" width="30" alt="icon" style="display:block; margin-bottom: 10px;">
                                                    <span style="font-family: Arial, sans-serif; font-weight: bold; font-size: 16px; color: #000000;">Real-Time Project Tracking</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td valign="top" width="50%" class="mobile-stack" style="padding: 10px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: separate !important; border-spacing: 0; border: 1px solid #000000; border-radius: 15px; overflow: hidden; height: 100px;">
                                            <tr>
                                                <td style="padding: 20px; background-color: #ffffff;">
                                                    <img src="https://img.icons8.com/ios-filled/50/000000/document.png" width="30" alt="icon" style="display:block; margin-bottom: 10px;">
                                                    <span style="font-family: Arial, sans-serif; font-weight: bold; font-size: 16px; color: #000000;">Verified Digital Contracts</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 20px;">
                                <tr>
                                    <td style="border-bottom: 1px solid #eeeeee;"></td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <tr>
                        <td bgcolor="#ffffff" align="center" style="padding: 0 30px 40px 30px;">
                            <img src="https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Solar Engineers" width="540" style="display: block; width: 100%; max-width: 540px; border-radius: 20px;">
                        </td>
                    </tr>

                    <tr>
                        <td bgcolor="#15448c" style="padding: 40px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="left" style="color: #ffffff; font-size: 12px; line-height: 1.5; padding-bottom: 20px;">
                                        You are receiving this email because you signed up with Rezillion Tech Private Limited.<br><br>
                                        Want to stop receiving messages from Rezillion Tech? <a href="#" style="color: #ffffff; text-decoration: underline;">Unsubscribe</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td valign="bottom">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td align="left" valign="middle" width="50%">
                                                    <h2 style="color: #ffffff; margin: 0; font-size: 24px;">Rezillion</h2>
                                                </td>
                                                <td align="right" valign="middle" width="50%">
                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" width="100" style="vertical-align: middle;">
                                                    <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on App Store" width="100" style="vertical-align: middle;">
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
                </td>
        </tr>
    </table>

</body>
</html>`;
    }

    // --- 5. DISPATCH EMAIL ---
    await transporter.sendMail({
      from: `"Rezillion Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: emailHtml, 
    });

    // --- 6. LOG HISTORY (With Admin ID for accountability) ---
    await query(
      `INSERT INTO email_history 
       (recipient_email, recipient_name, template_name, status, role, is_bulk, sent_at, admin_id) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)`,
      [email, name || 'Recipient', templateName, 'success', role, isBulk || false, adminId]
    );

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Email API Error:", error.message);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}