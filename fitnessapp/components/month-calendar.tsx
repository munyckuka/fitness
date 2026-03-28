import { Text, View } from "react-native";
import { colors } from "../app/theme";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

type CalendarDay = {
  key: string;
  dayNumber: number;
  label: string;
  isCurrentMonth: boolean;
};

function getCalendarMatrix(year: number, month: number, showAdjacentDays: boolean, fixedWeekRows: boolean) {
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  if (!showAdjacentDays) {
    const weeks: CalendarDay[][] = [];
    let day = 1;

    while (day <= daysInMonth) {
      const week: CalendarDay[] = Array.from({ length: 7 }, (_, weekday) => ({
        key: `empty-${weeks.length}-${weekday}`,
        dayNumber: 0,
        label: "",
        isCurrentMonth: false,
      }));

      for (let weekday = 0; weekday < 7 && day <= daysInMonth; weekday++) {
        if (weeks.length === 0 && weekday < firstWeekday) continue;

        week[weekday] = {
          key: `day-${day}`,
          dayNumber: day,
          label: String(day),
          isCurrentMonth: true,
        };
        day += 1;
      }

      weeks.push(week);
    }

    return weeks;
  }

  const daysInPreviousMonth = new Date(year, month, 0).getDate();
  const rowCount = fixedWeekRows ? 6 : Math.ceil((firstWeekday + daysInMonth) / 7);
  const totalCells = rowCount * 7;

  const cells: CalendarDay[] = Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - firstWeekday + 1;

    if (dayNumber < 1) {
      const previousDay = daysInPreviousMonth + dayNumber;
      return {
        key: `prev-${previousDay}`,
        dayNumber: previousDay,
        label: String(previousDay),
        isCurrentMonth: false,
      };
    }

    if (dayNumber > daysInMonth) {
      const nextDay = dayNumber - daysInMonth;
      return {
        key: `next-${nextDay}`,
        dayNumber: nextDay,
        label: String(nextDay),
        isCurrentMonth: false,
      };
    }

    return {
      key: `day-${dayNumber}`,
      dayNumber,
      label: String(dayNumber),
      isCurrentMonth: true,
    };
  });

  const weeks: CalendarDay[][] = [];

  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

type MonthCalendarProps = {
  date: Date;
  selectedDay?: number;
  workoutDays?: number[];
  variant?: "selected-day" | "weekends" | "workout-days";
  showAdjacentDays?: boolean;
  fixedWeekRows?: boolean;
};

export function MonthCalendar({
  date,
  selectedDay,
  workoutDays = [],
  variant = "selected-day",
  showAdjacentDays = false,
  fixedWeekRows = false,
}: MonthCalendarProps) {
  const monthIndex = date.getMonth();
  const monthLabel = MONTH_NAMES[monthIndex];
  const calendar = getCalendarMatrix(date.getFullYear(), monthIndex, showAdjacentDays, fixedWeekRows);
  const highlightedDay = selectedDay ?? date.getDate();
  const isWeekendsVariant = variant === "weekends";
  const isWorkoutDaysVariant = variant === "workout-days";

  return (
    <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 18 }}>
      <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 16 }}>
        {monthLabel}
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={{ color: isWeekendsVariant ? colors.textPrimary : colors.textSecondary, fontSize: 13, width: 30, textAlign: "center" }}>
            {day}
          </Text>
        ))}
      </View>

      {calendar.map((week, rowIndex) => (
        <View key={`week-${rowIndex}`} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
          {week.map((day, columnIndex) => {
            const isWeekend = columnIndex >= 5;
            const isSelected = variant === "selected-day" && day.isCurrentMonth && day.dayNumber === highlightedDay;
            const isWorkoutDay = isWorkoutDaysVariant && day.isCurrentMonth && workoutDays.includes(day.dayNumber);
            const isToday = day.isCurrentMonth && day.dayNumber === highlightedDay;

            let dayColor = isWeekendsVariant ? colors.textPrimary : colors.textSecondary;

            if (!day.isCurrentMonth) {
              dayColor = "#2E3338";
            } else if (isWeekendsVariant && isWeekend) {
              dayColor = colors.accent;
            } else if (isWorkoutDay) {
              dayColor = colors.accent;
            }

            return (
              <View
                key={day.key}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 12,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: isSelected || isToday ? colors.accent : "transparent",
                }}
              >
                <Text
                  style={{
                    color: isSelected || isToday ? colors.textPrimary : dayColor,
                    fontSize: 13,
                    fontWeight: isSelected || isToday ? "700" : "500",
                  }}
                >
                  {day.label}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
