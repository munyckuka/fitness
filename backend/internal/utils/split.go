package utils

type SplitType int

const (
	FullBody SplitType = iota
	Push
	Pull
	Legs
)

func GetSplit(freq int, cycle int) SplitType {
	if freq == 2 {
		return FullBody
	}

	switch cycle % 3 {
	case 0:
		return Push
	case 1:
		return Pull
	default:
		return Legs
	}
}

func MatchSplit(split SplitType, muscle string) bool {
	switch split {
	case FullBody:
		return true

	case Push:
		return muscle == "chest" || muscle == "shoulders" || muscle == "triceps"

	case Pull:
		return muscle == "back" || muscle == "biceps"

	case Legs:
		return muscle == "legs"

	default:
		return false
	}
}
