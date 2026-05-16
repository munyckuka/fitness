/**
 * ПРИМЕР: Как использовать новые recovery metrics и RPE на фронтенде
 *
 * Это базовый пример - адаптируй под свой UI
 */
import {API_BASE_URL} from "./fitnessapp/services/api";
import {Modal} from "react-native";

// ============================================
// 1. ДО ТРЕНИРОВКИ: Собрать metrics восстановления
// ============================================

async function getPreWorkoutMetrics() {
  // Спросить пользователя перед стартом тренировки
  return {
    sleepHours: 7,           // Сколько часов спал?
    sleepQuality: 8,         // Как качество? (1-10, где 10 = отлично)
    stressLevel: 4,          // Уровень стресса (1-10, где 10 = максимальный)
  };
}

// ============================================
// 2. ГЕНЕРАЦИЯ ТРЕНИРОВКИ с учетом восстановления
// ============================================

async function generateWorkoutWithRecovery(dayIndex?: number) {
  const metrics = await getPreWorkoutMetrics();

  const response = await fetch(`${API_BASE_URL}/api/v1/workouts/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dayIndex,
      sleepHours: metrics.sleepHours,      // ← NEW
      sleepQuality: metrics.sleepQuality,  // ← NEW
      stressLevel: metrics.stressLevel,    // ← NEW
      preferences: {
        split: 'ppl',
        daysOfWeek: [1, 3, 5],
      }
    })
  });

  const data = await response.json();

  // ⭐ НОВОЕ: Показать hint пользователю
  if (data.recoveryHint) {
    Alert.alert('💡 Совет', data.recoveryHint);
    // или в UI: <Text>{data.recoveryHint}</Text>
  }

  return data.workout;
}

// ============================================
// 3. ВО ВРЕМЯ УПРАЖНЕНИЯ: Собрать RPE для каждого set'а
// ============================================

interface ExerciseSession {
  exerciseId: string;
  sets: Array<{
    reps: number;
    weight: number;
    rpe?: number; // ← NEW: добавил при выполнении
  }>;
  overallRPE?: number;  // ← NEW: RPE за все упражнение
  formQuality?: number; // ← NEW: оценка техники 1-5
}

// Пример: Пользователь сделал жим лежа на 3 подходах
const exampleExerciseLog: ExerciseSession = {
  exerciseId: 'bench-press-id',
  sets: [
    { reps: 10, weight: 100, rpe: 6 }, // Ле��ко, рук не отказали
    { reps: 10, weight: 100, rpe: 7 }, // Нормально
    { reps: 8, weight: 100, rpe: 9 },  // Сложно, едва выполнил
  ],
  overallRPE: 8,   // В среднем: сложновато
  formQuality: 4,  // Техника хорошая, не сломал спину
};

// ============================================
// 4. КОНЕЦ ТРЕНИРОВКИ: Отправить данные с RPE/Recovery
// ============================================

async function completeWorkoutWithRPE(
  workoutId: string,
  exercises: ExerciseSession[],
  difficulty: number
) {
  const metrics = await getPreWorkoutMetrics();

  const response = await fetch(`${API_BASE_URL}/api/v1/workouts/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workoutId,
      difficulty,
      sleepHours: metrics.sleepHours,      // ← NEW: отправляем еще раз
      sleepQuality: metrics.sleepQuality,
      stressLevel: metrics.stressLevel,
      exercises: exercises.map(ex => ({
        exercise_id: ex.exerciseId,
        rpe: ex.overallRPE,              // ← NEW
        formQuality: ex.formQuality,     // ← NEW
        sets: ex.sets.map(set => ({
          reps: set.reps,
          weight: set.weight,
          rpe: set.rpe                   // ← NEW: RPE за этот set
        }))
      }))
    })
  });

  return await response.json();
}

// ============================================
// 5. АДАПТАЦИЯ ВЕСОВ - ПРИМЕР ИНТЕГРАЦИИ
// ============================================

/**
 * ТЕОРИЯ (что делает бэк):
 *
 * Если последние 3 тренировки:
 * - Set 1: RPE 6
 * - Set 2: RPE 7
 * - Set 3: RPE 9
 *
 * То 66% sets'ов с высоким RPE (9) → вес СНИЖАЕТСЯ на 5%
 *
 * Если все были RPE 5 и ниже → вес ПОВЫШАЕТСЯ на 5%
 *
 * + Recovery adjustment:
 * - Спал 5 часов → еще -20% к весу
 * - Стресс 9 → еще -10% к весу
 *
 * Итого: базовый вес * 0.95 (RPE) * 0.8 (sleep) * 0.9 (stress) = -33%
 */

// ПРИМЕР из реальной тренировки:

// День 1: Хорошо спал, низкий стресс
// POST /workouts/generate { sleepHours: 8, stressLevel: 3 }
// → Вес: базовый * 1.05 (если последний был легко) = +5%

// День 2: Плохо спал, высокий стресс
// POST /workouts/generate { sleepHours: 4, stressLevel: 9 }
// → Вес: базовый * 0.95 (RPE) * 0.8 (sleep) * 0.9 (stress) = -33%

// Это автоматически понижает нагрузку => не получится при стрессе übertraining

// ============================================
// 6. UI КОМПОНЕНТЫ (примеры)
// ============================================

// Popup перед тренировкой
const PreWorkoutMetricsModal = ({ onSubmit }) => {
  const [sleep, setSleep] = useState(8);
  const [quality, setQuality] = useState(8);
  const [stress, setStress] = useState(5);

  return (
    <Modal>
      <Text>Как ты спал последнюю ночь?</Text>
      <Slider
        min={0}
        max={12}
        value={sleep}
        onChange={setSleep}
      />
      <Text>{sleep} часов</Text>

      <Text>Качество сна</Text>
      <Slider
        min={1}
        max={10}
        value={quality}
        onChange={setQuality}
      />

      <Text>Уровень стресса</Text>
      <Slider
        min={1}
        max={10}
        value={stress}
        onChange={setStress}
      />

      <Button
        title="Начать тренировку"
        onPress={() => onSubmit({
          sleepHours: sleep,
          sleepQuality: quality,
          stressLevel: stress
        })}
      />
    </Modal>
  );
};

// Popup во время упражнения (после каждого подхода)
const PostSetRPEPopup = ({ exerciseName, setNumber, onSubmit }) => {
  const [rpe, setRPE] = useState(5);

  return (
    <Modal>
      <Text>
        {exerciseName} - Подход {setNumber}
      </Text>
      <Text>Насколько это было сложно?</Text>

      {/* RPE Scale */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        {Array.from({ length: 10 }, (_, i) => (
          <TouchableOpacity
            key={i + 1}
            onPress={() => setRPE(i + 1)}
            style={{
              padding: 10,
              backgroundColor: rpe === i + 1 ? '#blue' : '#gray',
              borderRadius: 5
            }}
          >
            <Text>{i + 1}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={{ marginTop: 10 }}>
        {rpe <= 5 && "😎 Легко"}
        {rpe > 5 && rpe <= 7 && "💪 Нормально"}
        {rpe > 7 && rpe <= 9 && "😤 Сложно"}
        {rpe === 10 && "🔥 На максимум"}
      </Text>

      <Button
        title="Далее"
        onPress={() => onSubmit(rpe)}
      />
    </Modal>
  );
};

// Popup про качество техники
const FormQualityPopup = ({ exerciseName, onSubmit }) => {
  const [quality, setQuality] = useState(4);

  return (
    <Modal>
      <Text>{exerciseName}</Text>
      <Text>Как была техника?</Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        {[1, 2, 3, 4, 5].map(q => (
          <TouchableOpacity
            key={q}
            onPress={() => setQuality(q)}
            style={{
              padding: 10,
              backgroundColor: quality === q ? '#blue' : '#gray'
            }}
          >
            <Text>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={{ marginTop: 10 }}>
        {quality === 1 && "❌ Очень плохо - снизим вес"}
        {quality === 2 && "⚠️ Плохо - лучше снизить вес"}
        {quality === 3 && "☑️ Нормально"}
        {quality === 4 && "✅ Хорошо"}
        {quality === 5 && "🏆 Отлично - отличная форма"}
      </Text>

      <Button
        title="Готово"
        onPress={() => onSubmit(quality)}
      />
    </Modal>
  );
};

export {
  generateWorkoutWithRecovery,
  completeWorkoutWithRPE,
  PreWorkoutMetricsModal,
  PostSetRPEPopup,
  FormQualityPopup
};

