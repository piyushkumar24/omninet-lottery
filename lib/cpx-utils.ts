import * as crypto from 'crypto';

const CPX_CONFIG = {
  APP_ID: '27172',
  SECURE_HASH_KEY: 'mZ6JNyV7SeZh9CMPwU9mKe24A0IyfAxC',
  BASE_URL: 'https://offers.cpx-research.com/index.php',
  POSTBACK_BASE_URL: 'https://8bad-2406-7400-81-835f-cc49-26c4-69fc-3b65.ngrok-free.app',
  REDIRECT_URL: 'https://8bad-2406-7400-81-835f-cc49-26c4-69fc-3b65.ngrok-free.app/dashboard?survey=completed',
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
 * Generate CPX Research survey URL with all required parameters
 */
export function generateCPXSurveyURL(user: {
  id: string;
  name?: string | null;
  email?: string | null;
}): string {
  const secureHash = generateCPXSecureHash(user.id);
  
  const params = new URLSearchParams({
    app_id: CPX_CONFIG.APP_ID,
    ext_user_id: user.id,
    secure_hash: secureHash,
    username: user.name || '',
    email: user.email || '',
    subid_1: '',
    subid_2: '',
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
 * CPX Research configuration for script integration
 */
export function getCPXScriptConfig(user: {
  id: string;
  name?: string | null;
  email?: string | null;
}) {
  return {
    general_config: {
      app_id: parseInt(CPX_CONFIG.APP_ID),
      ext_user_id: user.id,
      email: user.email || '',
      username: user.name || '',
      subid_1: '',
      subid_2: '',
    },
    style_config: {
      text_color: '#2b2b2b',
      survey_box: {
        topbar_background_color: '#45c4c6',
        box_background_color: 'white',
        rounded_borders: false,
        stars_filled: '#2b2b2b',
      },
    },
    debug: false,
  };
}

export { CPX_CONFIG }; 