export type TipScreen = "index" | "workouts" | "training" | "training-exercise" | "progress";

export type TipPlacement = "goals-card" | "rest-timer" | "footer";

export type Tip = {
  id: string;
  text: string;
  screen: TipScreen;
  placement: TipPlacement;
  priority: number;
  tags?: string[];
  locale: "ru";
  active: boolean;
};

export const TIPS: Tip[] = [
  {
    id: "index-goal-1",
    text: "Определите, чего хотите достичь (похудеть, набрать массу, выносливость).",
    screen: "index",
    placement: "goals-card",
    priority: 1,
    tags: ["goals", "motivation"],
    locale: "ru",
    active: true,
  },
  {
    id: "index-goal-2",
    text: "Ставьте измеримые цели: например, 3 тренировки в неделю в течение месяца.",
    screen: "index",
    placement: "goals-card",
    priority: 2,
    tags: ["goals", "planning"],
    locale: "ru",
    active: true,
  },
  {
    id: "index-goal-3",
    text: "Разбейте большую цель на маленькие шаги и отмечайте прогресс каждую неделю.",
    screen: "index",
    placement: "goals-card",
    priority: 3,
    tags: ["goals", "consistency"],
    locale: "ru",
    active: true,
  },
  {
    id: "rest-timer-1",
    text: "Важно отдыхать. Восстановите дыхание между подходами.",
    screen: "training-exercise",
    placement: "rest-timer",
    priority: 1,
    tags: ["recovery", "breathing"],
    locale: "ru",
    active: true,
  },
  {
    id: "rest-timer-2",
    text: "Сохраняйте ровный ритм дыхания: вдох носом, выдох ртом.",
    screen: "training-exercise",
    placement: "rest-timer",
    priority: 2,
    tags: ["recovery", "technique"],
    locale: "ru",
    active: true,
  },
  {
    id: "rest-timer-3",
    text: "Не сокращайте отдых слишком сильно, чтобы не терять качество подхода.",
    screen: "training-exercise",
    placement: "rest-timer",
    priority: 3,
    tags: ["recovery", "strength"],
    locale: "ru",
    active: true,
  },
];
