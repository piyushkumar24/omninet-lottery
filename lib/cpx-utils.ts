import * as crypto from 'crypto';

// Get base URL from environment or use fallback
const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // In server-side context, use environment variable or default
  return process.env.NEXT_PUBLIC_APP_URL || 'https://7c8d-2406-7400-81-8352-8c1b-f1a9-16a5-f8c3.ngrok-free.app';
};

const CPX_CONFIG = {
  APP_ID: '27172',
  SECURE_HASH_KEY: 'mZ6JNyV7SeZh9CMPwU9mKe24A0IyfAxC',
  BASE_URL: 'https://offers.cpx-research.com/index.php',
  POSTBACK_BASE_URL: 'https://7c8d-2406-7400-81-8352-8c1b-f1a9-16a5-f8c3.ngrok-free.app',
  REDIRECT_URL: 'https://7c8d-2406-7400-81-8352-8c1b-f1a9-16a5-f8c3.ngrok-free.app/dashboard?survey=completed',
  // 0mninet brand colors
  BRAND_BLUE: '#3b82f6',
  BRAND_DARK_BLUE: '#1d4ed8',
  TEXT_COLOR: '#ffffff',
};

/**
 * Generate secure hash for CPX Research API
 * Format: md5(ext_user_id + "-" + secure_hash_key)
 */
export function generateCPXSecureHash(userId: string): string {
  const hashString = `${userId}-${CPX_CONFIG.SECURE_HASH_KEY}`;
  return crypto.createHash('md5').update(hashString).digest('hex');
}

/**
 * Generate CPX Research survey URL with all required parameters and 0mninet branding
 */
export function generateCPXSurveyURL(user: {
  id: string;
  name?: string | null;
  email?: string | null;
}): string {
  const secureHash = generateCPXSecureHash(user.id);
  const baseUrl = getBaseUrl();
  
  const params = new URLSearchParams({
    app_id: CPX_CONFIG.APP_ID,
    ext_user_id: user.id,
    secure_hash: secureHash,
    username: user.name || '',
    email: user.email || '',
    subid_1: '',
    subid_2: '',
    redirect: `${baseUrl}/dashboard?survey=completed`,
    // Custom branding parameters
    header_color: CPX_CONFIG.BRAND_BLUE, // 0mninet blue
    text_color: CPX_CONFIG.TEXT_COLOR, // White text on blue background
    logo_url: `${baseUrl}/main-logo.png`, // 0mninet logo
    company_name: '0mninet',
    // Modify survey values
    survey_value: '1', // Ensure surveys show as 1 ticket instead of dollar amount
    unit_name: 'ticket', // Use "ticket" as unit name
    custom_css: encodeURIComponent(`
      .cpx-header { 
        background: linear-gradient(135deg, ${CPX_CONFIG.BRAND_BLUE} 0%, ${CPX_CONFIG.BRAND_DARK_BLUE} 100%) !important; 
        color: white !important;
      }
      .cpx-banner { 
        background: linear-gradient(135deg, ${CPX_CONFIG.BRAND_BLUE} 0%, ${CPX_CONFIG.BRAND_DARK_BLUE} 100%) !important;
        color: white !important;
      }
      .cpx-title {
        color: white !important;
        font-weight: bold !important;
      }
      .survey-unit {
        display: none !important;
      }
      .survey-value::after {
        content: " ticket" !important;
      }
    `),
  });

  return `${CPX_CONFIG.BASE_URL}?${params.toString()}`;
}

/**
 * Validate CPX Research postback hash
 */
export function validateCPXPostbackHash(userId: string, receivedHash: string): boolean {
  const expectedHash = generateCPXSecureHash(userId);
  return expectedHash === receivedHash;
}

/**
 * CPX Research configuration for script integration with 0mninet branding
 */
export function getCPXScriptConfig(user: {
  id: string;
  name?: string | null;
  email?: string | null;
}) {
  const baseUrl = getBaseUrl();
  
  return {
    general_config: {
      app_id: parseInt(CPX_CONFIG.APP_ID),
      ext_user_id: user.id,
      email: user.email || '',
      username: user.name || '',
      subid_1: '',
      subid_2: '',
      redirect_url: `${baseUrl}/dashboard?survey=completed`,
    },
    style_config: {
      text_color: CPX_CONFIG.TEXT_COLOR, // White text
      background_color: CPX_CONFIG.BRAND_BLUE, // 0mninet blue background
      survey_box: {
        topbar_background_color: CPX_CONFIG.BRAND_BLUE, // 0mninet blue
        topbar_text_color: CPX_CONFIG.TEXT_COLOR, // White text
        box_background_color: '#ffffff', // White background
        box_text_color: '#1f2937', // Dark gray text
        rounded_borders: true,
        stars_filled: CPX_CONFIG.BRAND_BLUE, // Blue stars
        stars_empty: '#e5e7eb', // Light gray empty stars
        custom_banner_url: `${baseUrl}/main-logo.png`, // 0mninet logo
        banner_background_color: CPX_CONFIG.BRAND_BLUE, // Blue banner background
        banner_text_color: CPX_CONFIG.TEXT_COLOR, // White banner text
        company_name: '0mninet Lottery',
        header_text: 'Complete surveys to earn lottery tickets',
      },
      custom_css: `
        .cpx-research-widget {
          border-radius: 12px !important;
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.15) !important;
          overflow: hidden !important;
        }
        .cpx-header {
          background: linear-gradient(135deg, ${CPX_CONFIG.BRAND_BLUE} 0%, ${CPX_CONFIG.BRAND_DARK_BLUE} 100%) !important;
          color: white !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          padding: 16px !important;
        }
        .cpx-banner {
          background: linear-gradient(135deg, ${CPX_CONFIG.BRAND_BLUE} 0%, ${CPX_CONFIG.BRAND_DARK_BLUE} 100%) !important;
          color: white !important;
          text-align: center !important;
          padding: 12px !important;
          font-weight: 600 !important;
        }
        .cpx-banner::before {
          content: "🎫 " !important;
        }
        .cpx-banner::after {
          content: " - 0mninet" !important;
          font-size: 0.9em !important;
          opacity: 0.9 !important;
        }
        .cpx-title {
          color: white !important;
          font-weight: 700 !important;
          font-size: 1.1em !important;
          margin: 0 !important;
        }
        .cpx-logo {
          max-height: 40px !important;
          width: auto !important;
          margin-right: 12px !important;
        }
        .cpx-content {
          padding: 20px !important;
          background: white !important;
        }
        .cpx-button {
          background: linear-gradient(135deg, ${CPX_CONFIG.BRAND_BLUE} 0%, ${CPX_CONFIG.BRAND_DARK_BLUE} 100%) !important;
          color: white !important;
          border: none !important;
          border-radius: 8px !important;
          padding: 12px 24px !important;
          font-weight: 600 !important;
          transition: all 0.2s ease !important;
        }
        .cpx-button:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4) !important;
        }
        .survey-unit {
          display: none !important;
        }
        .survey-value::after {
          content: " ticket" !important;
        }
      `,
    },
    script_config: [
      {
        div_id: "notification",
        theme_style: 4,
        position: 5, // 5 = bottom right
        text: "",
        link: `${baseUrl}/dashboard`, 
        newtab: true
      }
    ],
    debug: false,
  };
}

/**
 * Generate CPX notification script for client-side inclusion
 */
export function generateCPXNotificationScript(user: {
  id: string;
  name?: string | null;
  email?: string | null;
}): string {
  const CPX_APP_ID = 27172;
  const OMNINET_BLUE = "#3b82f6";
  const username = (user.name || '').replace(/"/g, '&quot;');
  const email = (user.email || '').replace(/"/g, '&quot;');
  const uniqueScriptId = user.id.substring(0, 8); // Use first 8 chars of user ID instead of random
  
  return `
// Use a unique variable name with user ID to prevent conflicts
const cpxNotificationConfig_${uniqueScriptId} = {
    div_id: "notification",
    theme_style: 4,
    position: 5, // 5 = bottom right
    text: "",
    link: "https://offers.cpx-research.com/index.php?app_id=${CPX_APP_ID}&ext_user_id=${user.id}&username=${username}&email=${email}",
    newtab: true
};

// Use unique config variable
const config = {
    general_config: {
        app_id: ${CPX_APP_ID},
        ext_user_id: "${user.id}",
        email: "${email}",
        username: "${username}",
        subid_1: "",
        subid_2: "",
    },
    style_config: {
        text_color: "#ffffff",
        background_color: "${OMNINET_BLUE}",
        survey_box: {
            topbar_background_color: "${OMNINET_BLUE}",
            topbar_text_color: "#ffffff",
            box_background_color: "white",
            box_text_color: "#1f2937",
            rounded_borders: true,
            stars_filled: "${OMNINET_BLUE}",
            stars_empty: "#e5e7eb",
            custom_banner_url: "/main-logo.png",
            banner_background_color: "${OMNINET_BLUE}",
            banner_text_color: "#ffffff",
            company_name: "0MNINET",
        },
        custom_css: \`
            .survey-unit {
                display: none !important;
            }
            .survey-value::after {
                content: " ticket" !important;
            }
            .survey-value::before {
                content: "1" !important;
                display: inline !important;
            }
            .survey-value {
                font-size: 0 !important;
            }
        \`,
    },
    script_config: [cpxNotificationConfig_${uniqueScriptId}],
    debug: false,
};

// Define window config only if not already defined
if (!window.config) {
  window.config = config;
}
`;
}

export { CPX_CONFIG }; 