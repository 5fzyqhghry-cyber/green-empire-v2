import { haptic, showAlert } from './webapp';

export async function buyWithStars(
  title: string,
  description: string,
  payload: string,
  starsAmount: number
): Promise<boolean> {
  const tg = (window as any).Telegram?.WebApp;
  if (!tg) {
    const ok = confirm(`[DEV] Купить «${title}» за ${starsAmount} Stars?`);
    return ok;
  }

  try {
    showAlert(`Покупка «${title}» за ${starsAmount} ⭐\n(Требуется бэкенд для инвойса)`);
    haptic('success');
    return true;
  } catch (e) {
    haptic('error');
    return false;
  }
}

export const PRODUCTS = {
  speed_boost: { title: 'Ускорение x2 (1ч)', stars: 50, description: 'Рост растений в 2 раза быстрее на 1 час' },
  money_pack_s: { title: 'Пачка монет', stars: 100, description: '+5000 монет' },
  money_pack_m: { title: 'Мешок монет', stars: 250, description: '+15000 монет' },
  premium: { title: 'Премиум (7 дней)', stars: 300, description: 'Бонусы + оффлайн до 24ч' },
  skill_reset: { title: 'Сброс навыков', stars: 75, description: 'Вернуть очки навыков' },
};
