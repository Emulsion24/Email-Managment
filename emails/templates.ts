// lib/email/templates.ts

export const getInstallerWelcomeTemplate = (name: string) => {
  return `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb;">Installer Onboarding</h2>
        <p>Hello ${name || 'there'},</p>
        <p>Welcome to our professional installer network. We are excited to have you on board.</p>
        <p>Your profile is being reviewed, and you will receive project notifications shortly.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666;">Rezillion Admin Team</p>
      </div>`;
};

export const getUserWelcomeTemplate = (name: string) => {
  return `
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
                                      border-bottom-right-radius: 170px;
                                      border-bottom-left-radius: 20px;
                                      color: #ffffff;">
                                      
                                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                          <tr>
                                              <td align="left" valign="middle" style="color: #ffffff; font-weight: bold; font-size: 24px;">
                                                  Rezillion
                                                  <div style="font-size: 10px; font-weight: normal; opacity: 0.8;">Building Renewable Energy for Zillions</div>
                                              </td>
                                              <td align="right" valign="middle">
                                                  </td>
                                          </tr>

                                          <tr>
                                              <td colspan="2" align="left" style="padding-top: 50px;">
                                                  <p style="margin: 0; font-size: 16px; font-weight: 500;">We are</p>
                                                  <h1 class="hero-text" style="margin: 5px 0 15px 0; font-size: 48px; line-height: 1.1; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Rezillion</h1>
                                                  <p style="margin: 0 0 25px 0; font-size: 14px; line-height: 1.5; max-width: 400px; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
                                                      Excited to Greenergize? Compare Solar Installers, Get the Best Quote, and Go Solar With Confidence.
                                                  </p>
                                                  <p>Welcome, ${name || 'User'}!</p>
                                                  <table border="0" cellspacing="0" cellpadding="0">
                                                      <tr>
                                                          <td align="center" style="border-radius: 4px;">
                                                              <a href="https://rezillion.energy" target="_blank" style="font-size: 14px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 12px 25px; border: 1px solid #1a202c; display: inline-block; font-weight: bold; background-color: #1a202c; border-radius: 4px;">Get Started</a>
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
              </td>
      </tr>
  </table>
</body>
</html>`;
};