export function initTelegram() {
  const tg = (window as any).Telegram?.WebApp;
  if (!tg) {
    console.warn('Telegram WebApp not available — running in browser mode');
    return null;
  }

  tg.ready();
  tg.expand();
  tg.setHeaderColor('#1a3a1a');
  tg.setBackgroundColor('#1a3a1a');

  try {
    tg.requestFullscreen?.();
  } catch {}

  try {
    tg.disableVerticalSwipes?.();
  } catch {}

  return tg;
}

export function getTelegramUser() {
  const tg = (window as any).Telegram?.WebApp;
  return tg?.initDataUnsafe?.user ?? null;
}

export function haptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') {
  const tg = (window as any).Telegram?.WebApp;
  if (!tg?.HapticFeedback) return;
  if (type === 'success' || type === 'error') {
    tg.HapticFeedback.notificationOccurred(type);
  } else {
    tg.HapticFeedback.impactOccurred(type);
  }
}

export function showAlert(message: string) {
  const tg = (window as any).Telegram?.WebApp;
  if (tg?.showAlert) {
    tg.showAlert(message);
  } else {
    alert(message);
  }
}
