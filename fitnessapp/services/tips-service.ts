import { TIPS, Tip, TipPlacement, TipScreen } from "@/data/tips";

type TipQuery = {
  screen: TipScreen;
  placement: TipPlacement;
};

function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

export function getTips({ screen, placement }: TipQuery): Tip[] {
  return TIPS
    .filter((tip) => tip.active && tip.locale === "ru" && tip.screen === screen && tip.placement === placement)
    .sort((a, b) => a.priority - b.priority);
}

export function getTipOfTheDay(query: TipQuery, date: Date = new Date()): Tip | null {
  const tips = getTips(query);

  if (tips.length === 0) {
    return null;
  }

  const dayOfYear = getDayOfYear(date);
  const index = dayOfYear % tips.length;

  return tips[index];
}
