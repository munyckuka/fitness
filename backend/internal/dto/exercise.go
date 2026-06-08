package dto

type ExerciseDTO struct {
    ID                string `json:"id"`
    Name              string `json:"name"`
    MuscleGroup       string `json:"muscleGroup"`
    RequiredEquipment string `json:"requiredEquipment,omitempty"`
    DifficultyLevel   string `json:"difficultyLevel,omitempty"`
    Description       string `json:"description,omitempty"`
    PhotoPath         string `json:"photoPath,omitempty"`
    // Display labels
    MuscleGroupLabel       string `json:"muscleGroupLabel,omitempty"`
    RequiredEquipmentLabel string `json:"requiredEquipmentLabel,omitempty"`
    DifficultyLabel        string `json:"difficultyLabel,omitempty"`
}


