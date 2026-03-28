package utils

import "time"

func CalculateFatigue(volume float64, lastWorkout int64) float64 {

	// recovery factor (time-based)
	hoursSince := float64(time.Now().Unix()-lastWorkout) / 3600

	recovery := hoursSince / 48.0 // full recovery ~48h

	if recovery > 1 {
		recovery = 1
	}

	fatigue := volume * (1 - recovery)

	return fatigue
}

func AdjustForFatigue(weight float64, fatigue float64) float64 {

	if fatigue > 10000 {
		return weight * 0.8
	}

	if fatigue > 5000 {
		return weight * 0.9
	}

	return weight
}
