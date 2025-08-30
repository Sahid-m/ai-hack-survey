"use client"

import type React from "react"
import { createContext, useContext, useEffect, useReducer, useState } from "react"

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
  id: string
  objectType: "deer" | "rock" | "bear"
}

export interface Classification {
  rating: "good" | "bad"
  confidence?: "low" | "medium" | "high"
  timestamp: number
}

export interface AnnotationData {
  imageIndex: number
  imagePath: string
  boundingBoxes: BoundingBox[]
  completedAt?: number
}

export interface ClassificationData {
  imageIndex: number
  imagePath: string
  classification: Classification
  completedAt?: number
}

export interface SurveyData {
  sessionId: string
  startedAt: number
  annotations: Record<number, AnnotationData>
  classifications: Record<number, ClassificationData>
  currentStep: "start" | "annotation" | "classification" | "complete"
  annotationProgress: {
    currentImageIndex: number
    totalImages: number
    completedImages: number[]
  }
  classificationProgress: {
    currentImageIndex: number
    totalImages: number
    completedImages: number[]
  }
  completedAt?: number
}

type SurveyAction =
  | { type: "INITIALIZE_SURVEY" }
  | { type: "SET_STEP"; step: SurveyData["currentStep"] }
  | { type: "UPDATE_ANNOTATION"; imageIndex: number; boundingBoxes: BoundingBox[] }
  | { type: "UPDATE_CLASSIFICATION"; imageIndex: number; classification: Classification }
  | { type: "SET_ANNOTATION_IMAGE"; imageIndex: number }
  | { type: "SET_CLASSIFICATION_IMAGE"; imageIndex: number }
  | { type: "COMPLETE_SURVEY" }
  | { type: "RESET_SURVEY" }
  | { type: "LOAD_SURVEY_DATA"; data: SurveyData }
  | { type: "SET_DATABASE_SESSION_ID"; sessionId: string }

interface SurveyContextType {
  surveyData: SurveyData
  dispatch: React.Dispatch<SurveyAction>
  saveAnnotation: (imageIndex: number, boundingBoxes: BoundingBox[]) => void
  saveClassification: (imageIndex: number, classification: Classification) => void
  exportSurveyData: () => string
  getSurveyProgress: () => { annotationProgress: number; classificationProgress: number; overallProgress: number }
  createDatabaseSession: () => Promise<boolean>
  saveSurveyToDatabase: (completed?: boolean) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

const SurveyContext = createContext<SurveyContextType | undefined>(undefined)

const ANNOTATION_IMAGES = [
  "/1.png",
  "/2.png",
  "/3.png",
  "/4.png",
  "/5.png",
  "/6.png",
  "/7.png",
  "/8.png",
]

const CLASSIFICATION_IMAGES = [
  "/1.png",
  "/2.png",
  "/3.png",
  "/4.png",
  "/5.png",
  "/6.png",
  "/7.png",
  "/8.png",
]

const createInitialState = (): SurveyData => ({
  sessionId: `survey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  startedAt: Date.now(),
  annotations: {},
  classifications: {},
  currentStep: "start",
  annotationProgress: {
    currentImageIndex: 0,
    totalImages: ANNOTATION_IMAGES.length,
    completedImages: [],
  },
  classificationProgress: {
    currentImageIndex: 0,
    totalImages: CLASSIFICATION_IMAGES.length,
    completedImages: [],
  },
})

function surveyReducer(state: SurveyData, action: SurveyAction): SurveyData {
  switch (action.type) {
    case "INITIALIZE_SURVEY":
      return createInitialState()

    case "SET_STEP":
      return { ...state, currentStep: action.step }

    case "UPDATE_ANNOTATION": {
      const annotationData: AnnotationData = {
        imageIndex: action.imageIndex,
        imagePath: ANNOTATION_IMAGES[action.imageIndex],
        boundingBoxes: action.boundingBoxes,
        completedAt: Date.now(),
      }

      const completedImages =
        action.boundingBoxes.length > 0
          ? [...new Set([...state.annotationProgress.completedImages, action.imageIndex])]
          : state.annotationProgress.completedImages.filter((i) => i !== action.imageIndex)

      return {
        ...state,
        annotations: {
          ...state.annotations,
          [action.imageIndex]: annotationData,
        },
        annotationProgress: {
          ...state.annotationProgress,
          completedImages,
        },
      }
    }

    case "UPDATE_CLASSIFICATION": {
      const classificationData: ClassificationData = {
        imageIndex: action.imageIndex,
        imagePath: CLASSIFICATION_IMAGES[action.imageIndex],
        classification: action.classification,
        completedAt: Date.now(),
      }

      const completedImages = [...new Set([...state.classificationProgress.completedImages, action.imageIndex])]

      return {
        ...state,
        classifications: {
          ...state.classifications,
          [action.imageIndex]: classificationData,
        },
        classificationProgress: {
          ...state.classificationProgress,
          completedImages,
        },
      }
    }

    case "SET_ANNOTATION_IMAGE":
      return {
        ...state,
        annotationProgress: {
          ...state.annotationProgress,
          currentImageIndex: action.imageIndex,
        },
      }

    case "SET_CLASSIFICATION_IMAGE":
      return {
        ...state,
        classificationProgress: {
          ...state.classificationProgress,
          currentImageIndex: action.imageIndex,
        },
      }

    case "COMPLETE_SURVEY":
      return {
        ...state,
        currentStep: "complete",
        completedAt: Date.now(),
      }

    case "RESET_SURVEY":
      return createInitialState()

    case "LOAD_SURVEY_DATA":
      return action.data

    case "SET_DATABASE_SESSION_ID":
      return { ...state, sessionId: action.sessionId }

    default:
      return state
  }
}

export function SurveyProvider({ children }: { children: React.ReactNode }) {
  const [surveyData, dispatch] = useReducer(surveyReducer, createInitialState())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const savedData = localStorage.getItem("survey_data")
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        dispatch({ type: "LOAD_SURVEY_DATA", data: parsedData })
      } catch (error) {
        console.error("Failed to load survey data:", error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("survey_data", JSON.stringify(surveyData))
  }, [surveyData])

  const saveAnnotation = (imageIndex: number, boundingBoxes: BoundingBox[]) => {
    dispatch({ type: "UPDATE_ANNOTATION", imageIndex, boundingBoxes })
  }

  const saveClassification = (imageIndex: number, classification: Classification) => {
    dispatch({ type: "UPDATE_CLASSIFICATION", imageIndex, classification })
  }

  const exportSurveyData = () => {
    return JSON.stringify(surveyData, null, 2)
  }

  const getSurveyProgress = () => {
    const annotationProgress =
      (surveyData.annotationProgress.completedImages.length / surveyData.annotationProgress.totalImages) * 100
    const classificationProgress =
      (surveyData.classificationProgress.completedImages.length / surveyData.classificationProgress.totalImages) * 100
    const overallProgress = (annotationProgress + classificationProgress) / 2

    return { annotationProgress, classificationProgress, overallProgress }
  }

  const createDatabaseSession = async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/survey/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (result.success) {
        dispatch({ type: "SET_DATABASE_SESSION_ID", sessionId: result.sessionId })
        console.log("[v0] Created database session:", result.sessionId)
        return true
      } else {
        setError("Failed to create database session")
        return false
      }
    } catch (err) {
      console.error("[v0] Error creating database session:", err)
      setError("Network error while creating session")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const saveSurveyToDatabase = async (completed = false): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const annotations = Object.values(surveyData.annotations).map((annotation) => ({
        imageIndex: annotation.imageIndex,
        imagePath: annotation.imagePath,
        boxes: annotation.boundingBoxes.map((box) => ({
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          objectType: box.objectType,
        })),
      }))

      const classifications = Object.values(surveyData.classifications).map((classification) => ({
        imageIndex: classification.imageIndex,
        imagePath: classification.imagePath,
        rating: classification.classification.rating,
      }))

      const response = await fetch("/api/survey/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: surveyData.sessionId,
          annotations,
          classifications,
          completed,
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log("[v0] Successfully saved survey data to database")
        return true
      } else {
        setError("Failed to save survey data")
        return false
      }
    } catch (err) {
      console.error("[v0] Error saving survey data:", err)
      setError("Network error while saving data")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const contextValue: SurveyContextType = {
    surveyData,
    dispatch,
    saveAnnotation,
    saveClassification,
    exportSurveyData,
    getSurveyProgress,
    createDatabaseSession,
    saveSurveyToDatabase,
    isLoading,
    error,
  }

  return <SurveyContext.Provider value={contextValue}>{children}</SurveyContext.Provider>
}

export function useSurvey() {
  const context = useContext(SurveyContext)
  if (context === undefined) {
    throw new Error("useSurvey must be used within a SurveyProvider")
  }
  return context
}

export { ANNOTATION_IMAGES, CLASSIFICATION_IMAGES }
