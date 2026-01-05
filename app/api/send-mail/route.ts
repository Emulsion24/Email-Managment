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
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Rezillion Solar</title>
<style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; display: block; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; }
    
    /* Force email to be same width on all devices */
    .email-container { width: 600px !important; max-width: 600px !important; min-width: 600px !important; }
    
    /* Prevent mobile scaling */
    @media only screen and (max-width: 640px) {
        .email-container { width: 600px !important; max-width: 600px !important; min-width: 600px !important; }
        * { -webkit-text-size-adjust: none !important; text-size-adjust: none !important; }
    }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                
                <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="background-color: #ffffff; width: 600px; margin: 0 auto; max-width: 600px; min-width: 600px;">
                    
                    <!-- Header Section -->
                    <tr>
                        <td bgcolor="#5b8cff" style="padding: 40px 30px; background-color: #5b8cff;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="color: #ffffff; font-size: 28px; font-weight: bold; line-height: 1.3; font-family: Arial, sans-serif;">
                                        Get More Solar Projects<br>
                                        Focus on Installation<br>
                                        Reduce Sales Effort
                                    </td>
                                </tr>
                                <tr>
                                    <td style="color: #e3f0ff; font-size: 13px; line-height: 1.6; padding-top: 15px; padding-bottom: 30px;">
                                        No more wasting time on leads or spending lakhs on channel partners.<br>
                                        Rezillion brings real customers to you so you can focus on installation and profits.
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td width="40%" valign="bottom" style="padding-bottom: 10px;">
                                                    <table border="0" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td align="center" bgcolor="#1a1a2e" style="border-radius: 4px;">
                                                                <a href="https://rezillion.energy/installer-network" style="font-size: 14px; font-weight: bold; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 12px 28px; display: inline-block; border-radius: 4px; background-color: #1a1a2e;">Register Now</a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                <td width="60%" valign="bottom" style="text-align: right;">
                                                    <div style="color: #ffffff; font-size: 16px; font-weight: bold; margin-bottom: 8px; line-height: 1.3;">
                                                        Empowering Local Solar<br>Installers Across India
                                                    </div>
                                                    <div style="font-size: 11px; line-height: 1.5; color: #e3f0ff;">
                                                        We believe our installer network provides immense value to communities by creating local jobs, reducing emissions, and lowering energy costs.
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- What Do You Get Section -->
                    <tr>
                        <td bgcolor="#ffffff" style="padding: 45px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="color: #000000; font-size: 28px; font-weight: bold; font-family: Arial, sans-serif; padding-bottom: 5px;">
                                        What do you get?
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-bottom: 40px;">
                                        <div style="height: 3px; width: 120px; background-color: #cccccc; margin: 0 auto;"></div>
                                    </td>
                                </tr>
                            </table>

                            <!-- Icons Circle Layout -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td width="33%" valign="middle" align="center">
                                        <table width="100%">
                                            <tr>
                                                <td align="center" style="padding-bottom: 35px;">
                                                    <div style="width: 60px; height: 60px; background-color: #1a2744; border-radius: 50%; display: inline-block; line-height: 60px; text-align: center; color: #ffd700; font-size: 28px;">☀</div>
                                                    <div style="font-size: 12px; font-weight: bold; color: #000; margin-top: 12px; line-height: 1.3;">Steady Project<br>Demand</div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center">
                                                    <div style="width: 60px; height: 60px; background-color: #1a2744; border-radius: 50%; display: inline-block; line-height: 60px; text-align: center; color: #ffd700; font-size: 28px;">⏱</div>
                                                    <div style="font-size: 12px; font-weight: bold; color: #000; margin-top: 12px; line-height: 1.3;">Real-Time<br>Progress Monitoring</div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>

                                    <td width="34%" valign="middle" align="center">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center">
                                                    <img src="https://res.cloudinary.com/dzjqhyusq/image/upload/v1766997110/cb2251db-559f-4336-96fc-237928bd6bc0_cwejpw.jpg" width="100" height="100" alt="Target" style="display: block; margin: 0 auto; border: 0;">
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center" style="padding-top: 15px;">
                                                    <div style="font-size: 14px; font-weight: bold; color: #000;">Zero Lead Chasing</div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>

                                    <td width="33%" valign="middle" align="center">
                                        <table width="100%">
                                            <tr>
                                                <td align="center" style="padding-bottom: 35px;">
                                                    <div style="width: 60px; height: 60px; background-color: #1a2744; border-radius: 50%; display: inline-block; line-height: 60px; text-align: center; color: #ffd700; font-size: 28px;">₹</div>
                                                    <div style="font-size: 12px; font-weight: bold; color: #000; margin-top: 12px; line-height: 1.3;">Save Lakhs On<br>Channel Partner Fees</div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center">
                                                    <div style="width: 60px; height: 60px; background-color: #1a2744; border-radius: 50%; display: inline-block; line-height: 60px; text-align: center; color: #ffd700; font-size: 28px;">📄</div>
                                                    <div style="font-size: 12px; font-weight: bold; color: #000; margin-top: 12px; line-height: 1.3;">Centralized<br>Document Workspace</div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Why Join Rezillion Section -->
                    <tr>
                        <td bgcolor="#5b8cff" style="padding: 50px 25px; background-color: #5b8cff;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="color: #ffffff; font-size: 28px; font-weight: bold; padding-bottom: 35px; font-family: Arial, sans-serif;">
                                        Why Join Rezillion
                                    </td>
                                </tr>
                            </table>

                            <!-- Cards Row -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <!-- Card 1 -->
                                    <td width="23%" valign="top">
                                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(255,255,255,0.35); border-radius: 16px; height: 240px;">
                                            <tr>
                                                <td align="center" valign="top" style="padding: 20px 12px;">
                                                    <div style="color: #0d1b2a; font-weight: bold; font-size: 14px; line-height: 1.3; margin-bottom: 12px;">
                                                        ZERO<br>Joining Fees
                                                    </div>
                                                    <div style="color: #ffffff; font-size: 11px; line-height: 1.5;">
                                                        Join for free and start receiving genuine solar project opportunities without paying any upfront channel partner costs.
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td width="2%"></td>

                                    <!-- Card 2 -->
                                    <td width="23%" valign="top">
                                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(255,255,255,0.35); border-radius: 16px; height: 240px;">
                                            <tr>
                                                <td align="center" valign="top" style="padding: 20px 12px;">
                                                    <div style="color: #0d1b2a; font-weight: bold; font-size: 14px; line-height: 1.3; margin-bottom: 12px;">
                                                        Continuous Work Opportunities
                                                    </div>
                                                    <div style="color: #ffffff; font-size: 11px; line-height: 1.5;">
                                                        Get a steady flow of verified Green Energy projects from homeowners and businesses, keeping revenue stable.
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td width="2%"></td>

                                    <!-- Card 3 -->
                                    <td width="23%" valign="top">
                                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(255,255,255,0.35); border-radius: 16px; height: 240px;">
                                            <tr>
                                                <td align="center" valign="top" style="padding: 20px 12px;">
                                                    <div style="color: #0d1b2a; font-weight: bold; font-size: 14px; line-height: 1.3; margin-bottom: 12px;">
                                                        Verified Network Recognition
                                                    </div>
                                                    <div style="color: #ffffff; font-size: 11px; line-height: 1.5;">
                                                        Be part of a trusted installer network and build credibility while standing out in your region.
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td width="2%"></td>

                                    <!-- Card 4 -->
                                    <td width="23%" valign="top">
                                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(255,255,255,0.35); border-radius: 16px; height: 240px;">
                                            <tr>
                                                <td align="center" valign="top" style="padding: 20px 12px;">
                                                    <div style="color: #0d1b2a; font-weight: bold; font-size: 14px; line-height: 1.3; margin-bottom: 12px;">
                                                        Earn More Through Service Jobs
                                                    </div>
                                                    <div style="color: #ffffff; font-size: 11px; line-height: 1.5;">
                                                        Unlock powerful new revenue streams through maintenance, repairs, and ongoing service work from solar owners.
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer Section -->
                    <tr>
    <td bgcolor="#08387f" style="padding: 15px 20px; background-color: #08387f;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td align="center" style="color: #ffffff; font-size: 13px; line-height: 1.4; font-family: Arial, sans-serif; padding-bottom: 10px;">
                    Reach us on Phone or email at<br>
                    <a href="mailto:hello@rezilliontech.com" style="color: #ffffff; text-decoration: none; font-weight: bold;">hello@rezilliontech.com  </a> <a>|</a> <a href="tel:+917031207574" style="color: #ffffff; text-decoration: none; font-weight: bold;"> +91 7031207574</a>
                </td>
            </tr>
            <tr>
                <td align="center">
                    <a href="https://rezillion.energy/installer-network" style="text-decoration: none;">
                        <img src="https://res.cloudinary.com/dzjqhyusq/image/upload/v1767000960/logo2_1_dsviqt.png" width="200" alt="Rezillion" style="display: block; border: 0; margin: 0 auto; filter: brightness(0) invert(1);">
                    </a>
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
    } else {
      // Default to User Welcome
      subject = `Welcome to Rezillion, ${name || 'User'}!`;
      emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Rezillion Solar</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,600;0,700;0,800;1,700&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    
    <style type="text/css">
        /* --- RESET & BASICS --- */
        /* CHANGED: Background to #ffffff (White) for desktop/default */
        body { margin: 0; padding: 0; background-color: #ffffff; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table { border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { border: 0; display: block; line-height: 100%; outline: none; text-decoration: none; }
        a { text-decoration: none; color: inherit; }
        
        /* --- TYPOGRAPHY --- */
        .font-header { font-family: 'Montserrat', Arial, sans-serif; }
        .font-body { font-family: 'Open Sans', Arial, sans-serif; }
        
        /* --- UTILS --- */
        /* CHANGED: Wrapper background to #ffffff (White) */
        .wrapper { width: 100%; table-layout: fixed; background-color: #ffffff; padding-bottom: 40px; }
        .main-container { background-color: #ffffff; margin: 0 auto; width: 600px; max-width: 600px; }
        
        /* --- HERO BACKGROUND CONTROL --- */
        .hero-cell {
            padding-top: 0;
            padding-right: 25px;
            padding-left: 25px;
        }

        .hero-bg-dynamic {
            background-image: url('https://res.cloudinary.com/dzjqhyusq/image/upload/v1766826335/industrial-renewable-energy-of-green-power-factor-2025-08-10-16-08-38-utc_1_xciotk.jpg');
            background-size: cover;
            background-position: center center;
            background-color: #4a68c5;
            height: 550px;
            padding: 40px 60px;
            border-bottom-left-radius: 50px;
            border-bottom-right-radius: 200px;
            width: 100%;
            box-sizing: border-box; 
        }

        /* --- OTHER STYLES --- */
        .blue-section { background-color: #4a68c5; color: #ffffff; }
        
        .pill-box {
            border: 2px solid #ffffff;
            border-radius: 50px;
            padding: 8px 25px; 
            background-color: rgba(255, 255, 255, 0.15); 
            backdrop-filter: blur(5px);
            color: #ffffff;
            font-weight: 900;
            font-size: 14px; 
            line-height: 1.5; 
            display: inline-block;
            margin-bottom: 25px;
            margin-left: -30px; 
            white-space: normal; 
        }
        .hero-btn-box {
            background-color: #151e32;
            color: #ffffff;
            padding: 12px 30px;
            font-size: 20px;
            font-weight: 600;
            border-radius: 8px;
            margin-bottom: 40px;
            display: inline-block;
            margin-right: 30px;
            margin-left: 90px;
            text-decoration: none;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }

        .savings-container {
            border: 1px solid rgba(220, 216, 216, 0.4);
            border-radius: 20px;
            padding: 30px;
            background-color: rgba(172, 158, 158, 0.05);
            margin: 0 20px;
        }
        .savings-item {
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 10px;
            background-color: rgba(255,255,255,0.1);
            margin-bottom: 15px;
            padding: 15px;
        }
        
        .feature-card {
            border: 3px solid #000000;
            border-radius: 15px;
            padding: 20px;
            height: 140px;
        }

        .footer-cell {
            background-color: #4a68c5;
            color: #ffffff;
            border-top-left-radius: 50% 40px;
            border-top-right-radius: 50% 40px;
            padding: 50px 40px;
        }

        .btn-dark {
            background-color: #1b263b;
            color: #ffffff;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: 600;
            display: inline-block;
            font-size: 16px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }

        /* --- MOBILE MEDIA QUERY --- */
        @media screen and (max-width: 600px) {
            .main-container { width: 100% !important; }
            
            /* ADDED: Turn background Blue specifically on mobile */
            body { background-color: #4a68c5 !important; }
            .wrapper { background-color: #4a68c5 !important; }

            /* HERO FIXES */
            .hero-cell { 
                padding-left: 15px !important; 
                padding-right: 15px !important; 
                height: auto !important;
            }
            
            .hero-bg-dynamic {
                height: 380px !important; 
                padding: 40px 25px !important; 
                background-position: 72% center !important;
                border-bottom-right-radius: 100px !important; 
                border-bottom-left-radius: 30px !important;
            }

            .h1-hero { 
                font-size: 44px !important; 
                line-height: 1.1 !important;
                margin-left: 50px !important;
            }
            
            .pill-box { 
                font-size: 11px !important; 
                padding: 6px 15px !important; 
                margin-left: -5px !important; 
                white-space: normal !important; 
                line-height: 1.5 !important;
                margin-bottom: 15px !important;
                width: auto !important; 
                display: inline-block !important;
                max-width: 90% !important;
            }
            
            .hero-btn-box { 
                margin-left: 20px !important; 
                width: auto !important; 
                padding: 12px 25px !important;
                font-size: 16px !important;
                display: inline-block !important;
            }

            /* Stack sections vertically on mobile */
            .mobile-stack { display: block !important; width: 100% !important; padding-right: 0 !important; padding-left: 0 !important; margin-bottom: 20px !important; text-align: center !important; }
            .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
            
            .feature-card { 
                height: 170px !important; 
                margin-bottom: 15px !important; 
                box-sizing: border-box !important;
            }
        }
    </style>
</head>
<body>

<center class="wrapper">
    <table class="main-container" width="600" cellpadding="0" cellspacing="0">
        
        <tr style="background-color: #4a68c5;">
            <td class="hero-cell" valign="top">
                <table
                    class="hero-bg-dynamic"
                    cellpadding="0"
                    cellspacing="0"
                    background="https://res.cloudinary.com/dzjqhyusq/image/upload/v1766826335/industrial-renewable-energy-of-green-power-factor-2025-08-10-16-08-38-utc_1_xciotk.jpg"
                >

                    <tr>
                        <td style="padding-left:10px; text-align:left;">
                            <a href="https://rezillion.energy">
                                <img src="https://res.cloudinary.com/dzjqhyusq/image/upload/v1766825616/logo2_3_qntqtc.png" 
                                     alt="Rezillion" 
                                     width="160" 
                                     style="display: block; margin-left: 0px; padding-left:0px;font-family: Arial, sans-serif; color: #0400f4; font-size: 20px;" 
                                     border="0">
                            </a>
                        </td>

                        <td align="right" valign="top" style="padding-top:6px; padding-right:10px;">
                            <a href="https://www.facebook.com/rezillion.energy/" style="margin-left:10px;">
                                <img src="https://img.icons8.com/ios-filled/50/ffffff/facebook-f.png" width="16" alt="Facebook">
                            </a>
                            <a href="https://www.instagram.com/rezillion.energy/" style="margin-left:10px;">
                                <img src="https://img.icons8.com/ios-filled/50/ffffff/instagram-new.png" width="16" alt="Instagram">
                            </a>
                            <a href="https://x.com/Rezillionenergy" style="margin-left:10px;">
                                <img src="https://img.icons8.com/ios-filled/50/ffffff/twitter.png" width="16" alt="Twitter">
                            </a>
                            <a href="https://www.youtube.com/@rezillion.energy" style="margin-left:10px;">
                                <img src="https://img.icons8.com/ios-filled/50/ffffff/youtube-play.png" width="16" alt="YouTube">
                            </a>
                        </td>
                    </tr>

                    <tr>
                        <td colspan="2" align="left" style="padding-left:10px; text-align:left;">
                            <p class="font-header h1-hero" style="
                              color:#3976e1;
                              font-size:20px;
                              font-weight:600;
                              margin:0 0 6px 0;
                              line-height:1.3;
                              text-align:left;
                            ">
                              We are
                            </p>

                            <h1 class="font-header h1-hero" style="
                              color:#ffffff;
                              font-size:70px;
                              font-weight:800;
                              margin:0;
                              line-height:1.05;
                              text-align:left;
                            ">
                              Rezillion
                            </h1>

                            <div class="pill-box font-body" style="
                              margin-top:14px;
                              text-align:left;
                              color:#ffffff;
                            ">
                              Compare Solar Installers, Get the Best Quote,<br>and Go Solar With Confidence.
                            </div>

                            <a href="https://rezillion.energy" class="hero-btn-box font-body" style="
                              display:block;
                              margin-top:22px;
                              text-align:center;
                              color:#ffffff;
                              text-decoration:none;
                              width:320px;
                              padding:22px 0;
                            ">
                              Excited to Greenergize?
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        <tr>
            <td class="blue-section" style="padding: 40px 40px 20px 40px;" class="mobile-padding">
                <p class="font-body" style="font-size: 16px; line-height: 1.6; text-align: center; margin: 0 0 30px 0;">
                    Our Solar Project Builder combines site readiness, energy calculation, and project submission into one seamless experience — helping homeowners, businesses, and industries go solar with total clarity and confidence.
                </p>
                <center>
                    <a href="https://rezillion.energy" class="btn-dark " style="text-decoration-color: #dbeafe;font-family: 'Open Sans', Arial, sans-serif;">Build Your Solar Project Now</a>
                </center>
            </td>
        </tr>

        <tr>
            <td class="blue-section" style="padding: 40px 0 60px 0;">
                <div class="savings-container">
                    
                    <div class="font-header" style="text-align: center; color: #ffffff; font-size: 48px; font-weight: 400; margin-bottom: 30px; line-height:1.2;">
                        <span style="white-space: nowrap;">Save < <span style="font-weight: 700;">₹ 30,000</span></span><br>on every project
                    </div>

                    <div class="savings-item">
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td width="70%" valign="top">
                                    <div class="font-body" style="color:white; font-weight:700; font-size:15px; margin-bottom:5px;">Hassle-Free Quote Collection</div>
                                    <div class="font-body" style="color:#dbeafe; font-size:11px;">Rezillion enables you to receive quotes from multiple verified installers through a single platform.</div>
                                </td>
                                <td width="30%" align="right" valign="top" class="savings-price">
                                    <div class="font-body" style="text-decoration: line-through; color: #ff4d4d; font-weight:bold; font-size:12px;">₹5000</div>
                                    <div class="font-body" style="color: #39ff14; font-weight:800; font-size:18px; text-transform:uppercase;">Free</div>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div class="savings-item">
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td width="65%" valign="top">
                                    <div class="font-body" style="color:white; font-weight:700; font-size:15px; margin-bottom:5px;">Competitive Bidding</div>
                                    <div class="font-body" style="color:#dbeafe; font-size:11px;">Installers compete for your project on Rezillion, helping you get better pricing.</div>
                                </td>
                                <td width="35%" align="right" valign="top" class="savings-price">
                                    <div class="font-body" style="text-decoration: line-through; color: #ff4d4d; font-weight:bold; font-size:12px;">₹10,000 - 50,000</div>
                                    <div class="font-body" style="color: #39ff14; font-weight:800; font-size:18px; text-transform:uppercase;">Free</div>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div class="savings-item">
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td width="70%" valign="top">
                                    <div class="font-body" style="color:white; font-weight:700; font-size:15px; margin-bottom:5px;">All Project Documents in One Place</div>
                                    <div class="font-body" style="color:#dbeafe; font-size:11px;">Store all your solar project documents, images, drawings safely in one place.</div>
                                </td>
                                <td width="30%" align="right" valign="top" class="savings-price">
                                    <div class="font-body" style="text-decoration: line-through; color: #ff4d4d; font-weight:bold; font-size:12px;">₹5000</div>
                                    <div class="font-body" style="color: #39ff14; font-weight:800; font-size:18px; text-transform:uppercase;">Free</div>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <div class="savings-item">
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td width="70%" valign="top">
                                    <div class="font-body" style="color:white; font-weight:700; font-size:15px; margin-bottom:5px;">Smart System Design Guidance</div>
                                    <div class="font-body" style="color:#dbeafe; font-size:11px;">Get clarity on the right system size based on your current and future electricity needs so you make the right investment.</div>
                                </td>
                                <td width="30%" align="right" valign="top" class="savings-price">
                                    <div class="font-body" style="text-decoration: line-through; color: #ff4d4d; font-weight:bold; font-size:12px;">₹5000</div>
                                    <div class="font-body" style="color: #39ff14; font-weight:800; font-size:18px; text-transform:uppercase;">Free</div>
                                </td>
                            </tr>
                        </table>
                    </div> 

                    <div class="savings-item" style="margin-bottom: 0;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td width="70%" valign="top">
                                    <div class="font-body" style="color:white; font-weight:700; font-size:15px; margin-bottom:5px;">Quality Checks</div>
                                    <div class="font-body" style="color:#dbeafe; font-size:11px;">Structured pre-installation and post-installation checklists to ensure safety.</div>
                                </td>
                                <td width="30%" align="right" valign="top" class="savings-price">
                                    <div class="font-body" style="text-decoration: line-through; color: #ff4d4d; font-weight:bold; font-size:12px;">₹5000</div>
                                    <div class="font-body" style="color: #39ff14; font-weight:800; font-size:18px; text-transform:uppercase;">Free</div>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </td>
        </tr>

        <tr>
            <td bgcolor="#ffffff" style="padding: 50px 30px;" class="mobile-padding">
                <div class="font-header" style="font-size: 38px; font-weight: 800; margin-bottom: 40px; text-align: center; color: #000;">Why Rezillion?</div>

                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td width="48%" class="mobile-stack" valign="top" style="padding-bottom: 20px; padding-right: 10px;">
                            <div class="feature-card">
                                <img src="https://img.icons8.com/ios-filled/50/000000/checklist.png" width="30" style="margin-bottom:15px;" alt="Checklist">
                                <div class="font-body" style="font-weight:700; font-size:14px; margin-bottom:5px;">Pre-installation Checklist</div>
                                <div class="font-body" style="font-size:12px; color:#444; line-height: 1.3;">Make your site fully ready before installation begins.</div>
                            </div>
                        </td>
                        <td width="4%"></td>
                        <td width="48%" class="mobile-stack" valign="top" style="padding-bottom: 20px; padding-left: 10px;">
                            <div class="feature-card">
                                <img src="https://img.icons8.com/ios-filled/50/000000/solar-panel.png" width="30" style="margin-bottom:15px;" alt="Solar">
                                <div class="font-body" style="font-weight:700; font-size:14px; margin-bottom:5px;">Solar Energy Calculator</div>
                                <div class="font-body" style="font-size:12px; color:#444; line-height: 1.3;">Estimate output, system size, and savings instantly.</div>
                            </div>
                        </td>
                    </tr>
                    
                    <tr>
                        <td width="48%" class="mobile-stack" valign="top" style="padding-bottom: 20px; padding-right: 10px;">
                            <div class="feature-card">
                                <img src="https://img.icons8.com/ios-filled/50/000000/auction.png" width="30" style="margin-bottom:15px;" alt="Bidding">
                                <div class="font-body" style="font-weight:700; font-size:14px; margin-bottom:5px;">Competitive Bidding</div>
                                <div class="font-body" style="font-size:12px; color:#444; line-height: 1.3;">Get the best price through transparent installer competition.</div>
                            </div>
                        </td>
                        <td width="4%"></td>
                        <td width="48%" class="mobile-stack" valign="top" style="padding-bottom: 20px; padding-left: 10px;">
                            <div class="feature-card">
                                <img src="https://img.icons8.com/ios-filled/50/000000/handshake.png" width="30" style="margin-bottom:15px;" alt="Management">
                                <div class="font-body" style="font-weight:700; font-size:14px; margin-bottom:5px;">End to End Management</div>
                                <div class="font-body" style="font-size:12px; color:#444; line-height: 1.3;">From requirement to commissioning — everything handled here.</div>
                            </div>
                        </td>
                    </tr>
                    
                    <tr>
                        <td width="48%" class="mobile-stack" valign="top" style="padding-bottom: 20px; padding-right: 10px;">
                            <div class="feature-card">
                                <img src="https://img.icons8.com/ios-filled/50/000000/blueprint.png" width="30" style="margin-bottom:15px;" alt="Drawings">
                                <div class="font-body" style="font-weight:700; font-size:14px; margin-bottom:5px;">Engineering Drawing Hub</div>
                                <div class="font-body" style="font-size:12px; color:#444; line-height: 1.3;">Store, manage, and access all project drawings easily.</div>
                            </div>
                        </td>
                        <td width="4%"></td>
                        <td width="48%" class="mobile-stack" valign="top" style="padding-bottom: 20px; padding-left: 10px;">
                            <div class="feature-card">
                                <img src="https://img.icons8.com/ios-filled/50/000000/star.png" width="30" style="margin-bottom:15px;" alt="Scoring">
                                <div class="font-body" style="font-weight:700; font-size:14px; margin-bottom:5px;">Powerful Installer Scoring</div>
                                <div class="font-body" style="font-size:12px; color:#444; line-height: 1.3;">Choose confidently with performance-based ratings.</div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td width="48%" class="mobile-stack" valign="top" style="padding-bottom: 20px; padding-right: 10px;">
                            <div class="feature-card">
                                <img src="https://img.icons8.com/ios-filled/50/000000/track-order.png" width="30" style="margin-bottom:15px;" alt="Tracking">
                                <div class="font-body" style="font-weight:700; font-size:14px; margin-bottom:5px;">Real-Time Project Tracking </div>
                                <div class="font-body" style="font-size:12px; color:#444; line-height: 1.3;">
                                    Monitor progress live and stay updated at every stage.
                                </div>
                            </div>
                        </td>
                        <td width="4%"></td>
                        <td width="48%" class="mobile-stack" valign="top" style="padding-bottom: 20px; padding-left: 10px;">
                            <div class="feature-card">
                                <img src="https://img.icons8.com/ios-filled/50/000000/contract.png" width="30" style="margin-bottom:15px;" alt="Contract">
                                <div class="font-body" style="font-weight:700; font-size:14px; margin-bottom:5px;">Digital Agreements formats</div>
                                <div class="font-body" style="font-size:12px; color:#444; line-height: 1.3;">Secure, transparent agreements with your installer for complete peace of mind.</div>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        <tr>
            <td class="footer-cell">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding-bottom: 50px;">
                            <p class="font-header" style="color: white; font-size: 20px; font-weight: 600; line-height: 1.5; margin: 0;">
                                Reach us on our social media profiles or email at <br>
                                <a href="mailto:hello@rezilliontech.com" style="text-decoration: underline; text-decoration-color: #3b82f6; text-underline-offset: 4px;">hello@rezilliontech.com</a>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td valign="bottom" style="padding-top:20px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="left" valign="bottom">
                                <a href="https://rezillion.energy" style="text-decoration:none;">
                                  <img
                                    src="https://res.cloudinary.com/dzjqhyusq/image/upload/v1766825616/logo2_3_qntqtc.png"
                                    alt="Rezillion"
                                    width="210"
                                    border="0"
                                    style="display:block; font-family:Arial,sans-serif; color:#0400f4; font-size:20px; margin-bottom: -50px;"
                                  />
                                </a>
                              </td>

                              <td align="right" valign="bottom">
                                <table cellpadding="0" cellspacing="0" align="right">
                                  <tr>
                                    <td valign="middle">
                                      <a href="https://rezillion.energy" style="text-decoration:none;">
                                        <img
                                          src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/512px-Google_Play_Store_badge_EN.svg.png"
                                          alt="Google Play"
                                          width="135"
                                          height="40"
                                          border="0"
                                          style="display:block;"
                                        />
                                      </a>
                                    </td>

                                    <td width="10">&nbsp;</td>

                                    <td valign="middle">
                                      <a href="https://rezillion.energy" style="text-decoration:none;">
                                        <img
                                          src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Download_on_the_App_Store_Badge.svg/512px-Download_on_the_App_Store_Badge.svg.png"
                                          alt="App Store"
                                          width="120"
                                          height="40"
                                          border="0"
                                          style="display:block;"
                                        />
                                      </a>
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
</center>

</body>
</html>`;
    }

    // --- 5. DISPATCH EMAIL ---
    await transporter.sendMail({
      from: `"Rezillion " <${process.env.EMAIL_USER}>`,
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

  } catch (error: Error | unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error("Email API Error:", message);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}