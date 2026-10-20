import crypto from 'crypto';

export interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface TelegramValidationResult {
  isValid: boolean;
  user?: TelegramUserData;
  authDate?: number;
  rawParams?: Record<string, string>;
  isSimulated?: boolean;
}

/**
 * Validates Telegram Mini App initData against TELEGRAM_BOT_TOKEN
 * adhering to Telegram's official HMAC-SHA256 authentication specification.
 */
export function validateTelegramInitData(initData: string, botToken?: string): TelegramValidationResult {
  if (!initData || typeof initData !== 'string') {
    return { isValid: false };
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    const userJson = params.get('user');
    const authDateStr = params.get('auth_date');

    if (!userJson) {
      return { isValid: false };
    }

    let user: TelegramUserData;
    try {
      user = JSON.parse(userJson);
    } catch {
      return { isValid: false };
    }

    const authDate = authDateStr ? parseInt(authDateStr, 10) : undefined;

    // If bot token is provided, perform strict cryptographic HMAC validation
    if (botToken && botToken.trim() !== '') {
      if (!hash) {
        return { isValid: false };
      }

      // 1. Sort all parameters in alphabetical order except 'hash'
      const entries: string[] = [];
      params.forEach((val, key) => {
        if (key !== 'hash') {
          entries.push(`${key}=${val}`);
        }
      });
      entries.sort();
      const dataCheckString = entries.join('\n');

      // 2. Compute secret key = HMAC-SHA256("WebAppData", botToken)
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();

      // 3. Compute expected hash = HMAC-SHA256(secretKey, dataCheckString)
      const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(calculatedHash, 'utf-8'),
        Buffer.from(hash, 'utf-8')
      );

      return {
        isValid,
        user,
        authDate,
        isSimulated: false,
      };
    }

    // In development or when bot token is not yet configured, allow safe fallback
    return {
      isValid: true,
      user,
      authDate,
      isSimulated: true,
    };
  } catch (err) {
    console.error('Error validating Telegram initData:', err);
    return { isValid: false };
  }
}
