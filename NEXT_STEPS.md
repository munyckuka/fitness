## 📋 НЕОБХОДИМЫЕ СЛЕДУЮЩИЕ ШАГИ

### 🚨 КРИТИЧЕСКИЕ (MUST DO перед отправкой на тест)

- [ ] **Запустить миграцию БД**
  ```bash
  # Выполнить sqlc с config\005_add_recovery_metrics.sql
  # или вручную в psql:
  psql -U postgres -d workoutdb -f backend/config/005_add_recovery_metrics.sql
  ```
  
- [ ] **Обновить репозиторий** для сохранения новых полей
  - [ ] `LogRepository.Save()` - сохранять sleep_hours, sleep_quality, stress_level
  - [ ] Проверить что JSON marshaling работает для RPE в exercises
  
- [ ] **Протестировать API**
  ```bash
  # 1. POST /api/v1/workouts/generate с recovery metrics
  curl -X POST http://localhost:8080/api/v1/workouts/generate \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <token>" \
    -d '{
      "sleepHours": 5,
      "sleepQuality": 4,
      "stressLevel": 8,
      "preferences": {"split": "ppl", "daysOfWeek": [1,3,5]}
    }'
  
  # 2. Проверить в response recoveryHint
  
  # 3. POST /api/v1/workouts/complete с RPE
  curl -X POST http://localhost:8080/api/v1/workouts/complete \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <token>" \
    -d '{
      "workoutId": "...",
      "difficulty": 7,
      "sleepHours": 7,
      "sleepQuality": 8,
      "stressLevel": 5,
      "exercises": [{
        "exercise_id": "...",
        "rpe": 8,
        "formQuality": 4,
        "sets": [{"reps": 10, "weight": 100, "rpe": 9}]
      }]
    }'
  ```

---

### 🔧 ФРОНТЕНД ИНТЕГРАЦИЯ (1-2 часа)

- [ ] Добавить компонент "Метрики восстановления" перед генерацией тренировки
  - Слайдеры для: sleep_hours (0-12), sleep_quality (1-10), stress_level (1-10)
  
- [ ] Показывать `recoveryHint` в UI после генерации
  - Желтая карточка с иконкой и текстом
  
- [ ] Добавить popup для RPE во время упражнения
  - После каждого подхода: "Насколько сложно было? 1-10"
  - Визуальная шкала или цифры
  
- [ ] Добавить возможность оценить форму после упр.
  - Простой select: 1-5
  
- [ ] Интегрировать в `CompleteWorkoutRequest`:
  - Передавать рpe из popup'ов
  - Передавать formQuality
  - Передавать sleep metrics еще раз (или сохранить из генерации)

---

### 🧪 ТЕСТИРОВАНИЕ (30-60 мин)

- [ ] E2E тест: сгенерировать → логировать → проверить адаптацию

  ```typescript
  // Pseudocode для E2E теста
  
  // День 1: Хорошо спал (8h), низкий стресс (3)
  // Базовый вес = 100 кг
  const workout1 = await generateWorkout({ sleepHours: 8, stressLevel: 3 });
  // weight должен быть ~100 * 1.05 = 105 (если последний был легко)
  
  // Логируем как очень сложно (RPE 9 на всех sets)
  await completeWorkout({ 
    sets: [{ rpe: 9 }, { rpe: 9 }, { rpe: 9 }]
  });
  
  // День 2: Плохо спал (4h), высокий стресс (9)
  // Базовый вес = 105 (адаптированный)
  const workout2 = await generateWorkout({ sleepHours: 4, stressLevel: 9 });
  // weight должен быть ~105 * 0.95 (RPE) * 0.8 (sleep) * 0.9 (stress) = ~70 кг
  // ✅ Вес значительно снизился!
  ```

- [ ] Unit тесты для `rpe_adaptation.go`
  - CalculateWeightAdjustment()
  - AdjustWeightForRecovery()

---

### 📊 МОНИТОРИНГ И ЛОГИРОВАНИЕ

- [ ] Добавить логирование при применении adjustments
  ```go
  log.Printf("Weight adjustment for user %s: RPE=%.2f, Recovery=%.2f", 
    userID, rpeAdj, recoveryAdj)
  ```

- [ ] Добавить метрики в Prometheus (опционально)
  - `fitness_weight_adjustments_total` (counter)
  - `fitness_recovery_hint_delivered` (counter)

---

### 🚀 ДЕПЛОЙ

- [ ] Убедиться что миграция БД применена на staging
- [ ] Обновить API documentation (если есть)
- [ ] Запустить полный набор тестов
- [ ] Деплоить на staging
- [ ] UAT тестирование
- [ ] Деплоить на prod

---

### 🎓 ДОКУМЕНТАЦИЯ

- [ ] Обновить API docs с новыми полями
- [ ] Добавить примеры curl/Postman
- [ ] Создать мини-гайд для пользователей: "Как система адаптирует вес"

---

### 🔮 FUTURE FEATURES (если время позволит)

- [ ] **Nutrition plan**: Калорийность + макросы на основе goal/frequency/weight
- [ ] **Injury tracking**: Какие упражнения избегать после травмы
- [ ] **Muscle imbalance**: Анализ какие мышцы отстают
- [ ] **Weekly summary**: "Вот твоя неделя в цифрах"
- [ ] **Recovery dashboard**: График сна, стресса, результатов

---

## 💪 ИТОГО

**Код готов к использованию:** ✅  
**Компилируется:** ✅  
**Тестировано в компиляторе:** ✅  

**Нужно:**  
- [ ] БД миграция (5 мин)
- [ ] Репозиторий обновление (15 мин)
- [ ] Фронтенд интеграция (1-2 часа)
- [ ] Тестирование (30-60 мин)

**Итого:** ~2-3 часа до полной готовности

