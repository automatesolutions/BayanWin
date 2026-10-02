import { DRAW_HOUR_MANILA } from './constants';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Current weekday (0–6) and hour in Asia/Manila, independent of the viewer's timezone. */
const manilaNow = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now);
  const weekday = DAY_NAMES.indexOf(parts.find((p) => p.type === 'weekday').value);
  const hour = Number(parts.find((p) => p.type === 'hour').value);
  return { weekday, hour };
};

/** Human label for the next draw, e.g. "Tonight, 9 PM", "Tomorrow, 9 PM", "Sat, 9 PM". */
export const nextDrawLabel = (drawDays = [], now = new Date()) => {
  if (!drawDays.length) return null;
  const { weekday, hour } = manilaNow(now);
  for (let offset = 0; offset < 7; offset += 1) {
    const day = (weekday + offset) % 7;
    if (!drawDays.includes(day)) continue;
    if (offset === 0 && hour >= DRAW_HOUR_MANILA) continue;
    if (offset === 0) return 'Tonight, 9 PM';
    if (offset === 1) return 'Tomorrow, 9 PM';
    return `${DAY_NAMES[day]}, 9 PM`;
  }
  return null;
};

export const drawDaysLabel = (drawDays = []) =>
  [...drawDays].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => DAY_NAMES[d]).join(' · ');
