package domain

import "github.com/google/uuid"

type SplitType string

const (
	SplitFullBody   SplitType = "fullbody"
	SplitPPL        SplitType = "ppl"
	SplitUpperLower SplitType = "upper_lower"
)

type TrainingPreferences struct {
	UserID     uuid.UUID
	DaysOfWeek []int // 0=Sunday ... 6=Saturday
	Split      SplitType
	Remember   bool
}
