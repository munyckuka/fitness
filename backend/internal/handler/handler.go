package handler

import "github.com/gin-gonic/gin"

func SetupRoutes(r *gin.Engine, userHandler *UserHandler, workoutHandler *WorkoutHandler, progressHandler *ProgressHandler) {

	api := r.Group("/api/v1")

	{
		users := api.Group("/users")
		{
			users.POST("/", userHandler.CreateUser)
			users.GET("/:id", userHandler.GetUser)
			users.PUT("/:id", userHandler.UpdateUser)
		}

		workouts := api.Group("/workouts")
		{
			workouts.POST("/generate", workoutHandler.GenerateWorkout)
			workouts.POST("/complete", workoutHandler.CompleteWorkout)
			workouts.GET("/user/:id", workoutHandler.GetUserWorkouts)
		}

		progress := api.Group("/progress")
		{
			progress.GET("/:id", progressHandler.GetProgress)
		}
	}
}
