package utils

import "backend/internal/domain"

// CalculateWeightAdjustment determines if weight should be increased, decreased, or stay same
// based on recent RPE patterns and performed sets.
// Returns multiplier: 1.05 (up), 1.0 (same), 0.95 (down)
func CalculateWeightAdjustment(logs []domain.WorkoutLog, exerciseID string, recentCount int) float64 {
	if len(logs) == 0 || recentCount <= 0 {
		return 1.0
	}

	if recentCount > len(logs) {
		recentCount = len(logs)
	}

	// Count successful sets with good RPE in recent workouts
	var totalSets int
	var highRPESets int // RPE >= 9 (too hard)
	var lowRPESets int  // RPE <= 5 (too easy)

	// Only look at last `recentCount` workouts
	for i := len(logs) - recentCount; i < len(logs); i++ {
		for _, ex := range logs[i].Exercises {
			for _, set := range ex.Sets {
				totalSets++
				if set.RPE == 0 {
					continue // Not tracked
				}
				if set.RPE >= 9 {
					highRPESets++
				} else if set.RPE <= 5 {
					lowRPESets++
				}
			}
		}
	}

	if totalSets == 0 {
		return 1.0 // No RPE data tracked
	}

	highRPEPercent := float64(highRPESets) / float64(totalSets)
	lowRPEPercent := float64(lowRPESets) / float64(totalSets)

	// If too easy: increase weight
	if lowRPEPercent > 0.6 {
		return 1.05
	}

	// If too hard: decrease weight
	if highRPEPercent > 0.5 {
		return 0.95
	}

	// If mixed or ideal: keep same
	return 1.0
}

// AdjustWeightForRecovery lowers weight if user is not recovered well
// sleepHours: actual hours slept
// sleepQuality: 1-10 scale
// stressLevel: 1-10 scale
// Returns multiplier: 0.85 (poor recovery), 0.9 (okay), 1.0 (good)
func AdjustWeightForRecovery(sleepHours int, sleepQuality int, stressLevel int) float64 {
	if sleepHours == 0 || sleepQuality == 0 || stressLevel == 0 {
		return 1.0 // No data, assume good
	}

	multiplier := 1.0

	// Poor sleep
	if sleepHours < 5 {
		multiplier *= 0.85
	} else if sleepHours < 7 {
		multiplier *= 0.9
	}

	// Poor sleep quality
	if sleepQuality < 4 {
		multiplier *= 0.9
	}

	// High stress
	if stressLevel > 8 {
		multiplier *= 0.9
	} else if stressLevel > 6 {
		multiplier *= 0.95
	}

	// Floor at 0.8 (never go below -20%)
	if multiplier < 0.8 {
		multiplier = 0.8
	}

	return multiplier
}

// EvaluateFormQuality suggests weight reduction if form is poor
// Returns true if weight should be reduced
func ShouldReduceWeightForForm(formQuality int) bool {
	// 1-5 scale: if less than 3, reduce weight next time
	return formQuality < 3
}
