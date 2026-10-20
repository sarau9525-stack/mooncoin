/**
 * Telegram Mini App integration wrapper.
 * Interacts with window.Telegram?.WebApp safely in both Telegram and standalone web browsers.
 */

export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramWebAppUser;
    start_param?: string;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  expand: () => void;
  close: () => void;
  ready: () => void;
  openLink: (url: string) => void;
  openTelegramLink: (url: string) => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export class TelegramBridge {
  private webApp: TelegramWebApp | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      this.webApp = window.Telegram.WebApp;
      try {
        this.webApp.ready();
        this.webApp.expand();
        // Configure cosmic dark theme colors for Telegram header
        if (this.webApp.setHeaderColor) {
          this.webApp.setHeaderColor('#070b19');
        }
        if (this.webApp.setBackgroundColor) {
          this.webApp.setBackgroundColor('#050814');
        }
      } catch (e) {
        console.warn('Telegram WebApp setup error:', e);
      }
    }
  }

  public isTelegramMiniApp(): boolean {
    return Boolean(this.webApp && this.webApp.initData && this.webApp.initData.length > 0);
  }

  public getInitData(): string {
    return this.webApp?.initData || '';
  }

  public getTelegramUser(): TelegramWebAppUser | undefined {
    return this.webApp?.initDataUnsafe?.user;
  }

  public getStartParam(): string | undefined {
    return this.webApp?.initDataUnsafe?.start_param;
  }

  // Tactile haptic feedback on mobile tap
  public hapticTap(style: 'light' | 'medium' | 'heavy' = 'light') {
    if (this.webApp?.HapticFeedback) {
      try {
        this.webApp.HapticFeedback.impactOccurred(style);
      } catch {}
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      // Browser fallback vibration
      try {
        navigator.vibrate(style === 'heavy' ? 25 : 12);
      } catch {}
    }
  }

  public hapticNotification(type: 'success' | 'warning' | 'error') {
    if (this.webApp?.HapticFeedback) {
      try {
        this.webApp.HapticFeedback.notificationOccurred(type);
      } catch {}
    }
  }

  // Share referral to Telegram chat or copy link
  public shareReferral(referralCode: string, botUsername: string = 'PocketPlanetBot') {
    const text = encodeURIComponent(
      `🪐 Join my civilization in Pocket Planet! Tap to earn Cosmic Energy, hatch alien companions, and rule the galaxy with me!`
    );
    const tgUrl = `https://t.me/share/url?url=https://t.me/${botUsername}/app?startapp=${referralCode}&text=${text}`;

    if (this.webApp?.openTelegramLink) {
      this.webApp.openTelegramLink(tgUrl);
    } else {
      window.open(tgUrl, '_blank');
    }
  }
}

export const telegramBridge = new TelegramBridge();
