## 🎯 Новые фичи персонализации за одну ночь

### 1. 📊 RPE (Rate of Perceived Exertion) + Адаптивный вес

**Что это:** Система автоматической адаптации весов на основе того, как **сложно** было упражнение (субъективное ощущение).

#### Как работает:
- Во время финиша тренировки фронт отправляет RPE (1-10) для каждого set'а
- Бэк анализирует последние 3 тренировки
- Если RPE >= 9 (слишком сложно) → вес **снижается на 5%** в следующий раз
- Если RPE <= 5 (слишком легко) → вес **повышается на 5%** в следующий раз
- Если норм (6-8) → вес остается


#### API:
**POST /api/v1/workouts/complete**
```json
{
  "workoutId": "...",
  "difficulty": 7,
  "exercises": [
    {
      "exercise_id": "...",
      "rpe": 8,              // ← NEW: How hard was it (1-10)
      "formQuality": 4,     // ← NEW: How was your form (1-5)
      "sets": [
        {
          "reps": 10,
          "weight": 100,
          "rpe": 9           // ← NEW: RPE for this specific set
        }
      ]
    }
  ],
  "sleepHours": 7,          // ← NEW: Hours slept before workout
  "sleepQuality": 8,        // ← NEW: Sleep quality (1-10)
  "stressLevel": 5          // ← NEW: Current stress (1-10)
}
```

---

### 2. 😴 Recovery Metrics (Сон + Стресс)

**Что это:** Автоматическое снижение интенсивности тренировки если пользователь плохо спал или в стрессе.

#### Как работает:
- Перед генерацией тренировки фронт отправляет sleep/stress метрики
- Если sleep < 5 часов → вес **-20%** (серьезно!)
- Если sleep < 7 часов → вес **-10%**
- Если в стрессе (stress > 8) → вес **-10%**
- Все множители комбинируются (например: -20% × -10% = -28%)


#### API:
**POST /api/v1/workouts/generate**
```json
{
  "dayIndex": 3,
  "sleepHours": 5,          // ← NEW
  "sleepQuality": 4,        // ← NEW: только 1-3 ночных пробуждений
  "stressLevel": 9,         // ← NEW
  "preferences": {
    "split": "ppl",
    "daysOfWeek": [1, 3, 5]
  }
}
```

**Response:**
```json
{
  "workout": { ... },
  "warning": "",
  "recoveryHint": "😰 Высокий стресс. Отдохни перед тренировкой"  // ← NEW
}
```

#### Recovery Hints:
- `"⚠️ Плохой сон! Снижаем интенсивность на 20%"` — если < 5 часов
- `"😴 Недостаточно сна. Не переусложняй тренировку"` — если < 7 часов  
- `"😰 Высокий стресс. Отдохни перед тренировкой"` — если стресс > 8

---

### 3. 📈 Form Quality Tracking

**Что это:** Отслеживание качества техники, которое влияет на следующую тренировку.

#### Как работать в UI:
- После упражнения спросить: "Как была техника? 1-5"
- 1-2: очень плохо, нужно снизить вес
- 3-5: нормально

#### API:
```json
{
  "exercises": [
    {
      "exercise_id": "...",
      "formQuality": 2,  // ← LOW = reduce weight next time
      "sets": [...]
    }
  ]
}
```

---

## 🛠️ Что добавлено в коде:

### Backend
1. **`internal/utils/rpe_adaptation.go`** — Логика адап��ивного веса
   - `CalculateWeightAdjustment()` — анализ RPE паттернов
   - `AdjustWeightForRecovery()` — снижение веса при плохой восстановлении

2. **`internal/domain/log.go`** — Обновлены структуры:
   - Добавлены `RPE`, `FormQuality` в `ExerciseLog`
   - Добавлены `RPE` в `SetLog`
   - Добавлены `SleepHours`, `SleepQuality`, `StressLevel` в `WorkoutLog`
   - Новый domain: `RecoveryMetrics`

3. **`internal/service/interfaces.go`** — Обновлены опции:
   - `GenerateWorkoutOptions` теперь включает `SleepHours`, `SleepQuality`, `StressLevel`

4. **`internal/service/workout_service.go`** — Обновлена логика:
   - Применяются оба adjustement'а (RPE + Recovery) при расчете весов

5. **`internal/dto/workout.go`** — Обновлены DTO:
   - `GenerateWorkoutRequest` с recovery metrics
   - `CompleteWorkoutRequest` с RPE и recovery metrics
   - Новая колонка `RecoveryHint` в response

6. **`internal/handler/workout_handler.go`** — Обновлены handlers:
   - Передача recovery metrics в service
   - Генерация recovery hint'ов для UI

7. **`internal/utils/mapper.go`** — Обновлен mapper:
   - Отображение RPE и recovery metrics в domain

---

## 💡 Как использовать:

### Для фронтенда (UI/UX):

1. **Перед генерацией тренировки:**
   ```typescript
   const response = await apiRequest('/api/v1/workouts/generate', {
     method: 'POST',
     body: JSON.stringify({
       sleepHours: 6,
       sleepQuality: 7,
       stressLevel: 5,
       preferences: { ... }
     })
   });
   
   // Показать hint пользователю
   if (response.recoveryHint) {
     showAlert(response.recoveryHint);
   }
   ```

2. **После завершения упражнения:**
   ```typescript
   // Спросить пользователя
   const rpe = await askUserForRPE(); // 1-10
   const formQuality = await askFormQuality(); // 1-5
   
   // Отправить
   await completeWorkout({
     exercises: [{
       exercise_id: '...',
       rpe,
       formQuality,
       sets: [...]
     }],
     sleepHours: 7,
     sleepQuality: 8,
     stressLevel: 4
   });
   ```

---

## ✅ Что это даст пользователю:

✅ **Персонализация:** Веса автоматически подстраиваются под его физиологию  
✅ **Безопасность:** Не получит��я перетренироваться при плохом сне  
✅ **Адаптивность:** Система реагирует на жизненные факторы (стресс, сон)  
✅ **Реалистичность:** Если сегодня не справился → завтра легче  

---

## 🔜 Что осталось для полноты (видение):

- Nutrition plan generation (калорийность + макро)
- Injury tracking (какие упражнения избегать)
- Muscle imbalance detection (какие мышцы отстают)
- Recovery trends (график восстановления)
- Weekly summary (как прошла неделя)

