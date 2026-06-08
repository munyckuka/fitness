package handler

import "github.com/gin-gonic/gin"

func SetupRoutes(r *gin.Engine, authMiddleware gin.HandlerFunc, authHandler *AuthHandler, userHandler *UserHandler, workoutHandler *WorkoutHandler, progressHandler *ProgressHandler, chatHandler *ChatHandler) {

	api := r.Group("/api/v1")

	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
			auth.POST("/logout", authHandler.Logout)
		}

		users := api.Group("/users")
		{
			users.GET("/me", authMiddleware, userHandler.GetMe)
			users.PUT("/me", authMiddleware, userHandler.UpdateMe)
			users.GET("/search", authMiddleware, userHandler.SearchByLogin)
			users.POST("/", userHandler.CreateUser)
			users.GET("/:id", userHandler.GetUser)
			users.PUT("/:id", userHandler.UpdateUser)
		}

		workouts := api.Group("/workouts")
		{
			workouts.POST("/generate", authMiddleware, workoutHandler.GenerateWorkout)
			workouts.POST("/generate-week", authMiddleware, workoutHandler.GenerateWeekWorkouts)
			workouts.POST("/import-shared", authMiddleware, workoutHandler.ImportSharedWorkout)
			workouts.POST("/complete", authMiddleware, workoutHandler.CompleteWorkout)
			workouts.GET("/user/:id", workoutHandler.GetUserWorkouts)
			workouts.PATCH("/:workoutId/exercises/:exerciseId", authMiddleware, workoutHandler.ReplaceExercise)
			workouts.DELETE("/:workoutId", authMiddleware, workoutHandler.DeleteWorkout)
		}

		exercises := api.Group("/exercises")
		{
			exercises.GET("/", workoutHandler.ListExercises)
		}

		progress := api.Group("/progress")
		{
			progress.GET("/:id", progressHandler.GetProgress)
		}

		chats := api.Group("/chats")
		{
			chats.GET("/dialogs", authMiddleware, chatHandler.ListDialogs)
			chats.POST("/dialogs", authMiddleware, chatHandler.EnsureDialog)
			chats.GET("/dialogs/:conversationId/messages", authMiddleware, chatHandler.ListMessages)
			chats.POST("/dialogs/:conversationId/messages", authMiddleware, chatHandler.SendMessage)
			chats.POST("/dialogs/:conversationId/read", authMiddleware, chatHandler.MarkRead)
			chats.GET("/events", authMiddleware, chatHandler.StreamEvents)
		}
	}
}
