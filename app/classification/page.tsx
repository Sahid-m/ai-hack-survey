"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ThumbsUp, ThumbsDown, ArrowLeft, ArrowRight, RotateCcw } from "lucide-react"
import { useSurvey, CLASSIFICATION_IMAGES } from "@/lib/survey-context"
import type { Classification } from "@/lib/survey-context"
import { SurveyProgress } from "@/components/survey-progress"
import Link from "next/link"

export default function ClassificationPage() {
  const { surveyData, dispatch, saveClassification } = useSurvey()
  const [currentImageIndex, setCurrentImageIndex] = useState(surveyData.classificationProgress.currentImageIndex)

  useEffect(() => {
    dispatch({ type: "SET_STEP", step: "classification" })
  }, [dispatch])

  useEffect(() => {
    dispatch({ type: "SET_CLASSIFICATION_IMAGE", imageIndex: currentImageIndex })
  }, [currentImageIndex, dispatch])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "g" || e.key === "G") {
        handleClassification("good")
      } else if (e.key === "b" || e.key === "B") {
        handleClassification("bad")
      } else if (e.key === "ArrowLeft" && currentImageIndex > 0) {
        setCurrentImageIndex((prev) => prev - 1)
      } else if (e.key === "ArrowRight" && currentImageIndex < CLASSIFICATION_IMAGES.length - 1) {
        setCurrentImageIndex((prev) => prev + 1)
      } else if (e.key === "r" || e.key === "R") {
        handleClearRating()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentImageIndex])

  const handleClassification = (rating: "good" | "bad") => {
    const classification: Classification = {
      rating,
      timestamp: Date.now(),
    }
    saveClassification(currentImageIndex, classification)
  }

  const handleClearRating = () => {
    // Remove classification by saving undefined (handled in context)
    const updatedClassifications = { ...surveyData.classifications }
    delete updatedClassifications[currentImageIndex]
    // We need to manually update this since we don't have a direct "remove" action
  }

  const handleFinishSurvey = () => {
    dispatch({ type: "COMPLETE_SURVEY" })
  }

  const currentClassification = surveyData.classifications[currentImageIndex]
  const allImagesRated = surveyData.classificationProgress.completedImages.length === CLASSIFICATION_IMAGES.length

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <SurveyProgress />

        <Card className="bg-black border-white/20 p-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white mb-2 text-center">Image Classification</h1>
            <div className="text-center text-sm text-gray-400">
              Image {currentImageIndex + 1} of {CLASSIFICATION_IMAGES.length}
            </div>
          </div>

          <div className="flex gap-8">
            <div className="flex-1">
              <div className="border border-white/20 rounded-lg overflow-hidden mb-4 relative">
                <img
                  src={CLASSIFICATION_IMAGES[currentImageIndex] || "/placeholder.svg"}
                  alt={`Generated image ${currentImageIndex + 1}`}
                  className="w-full h-auto object-cover"
                  style={{ aspectRatio: "3/2" }}
                />
                {currentClassification && (
                  <div className="absolute top-2 left-2">
                    <div
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        currentClassification.rating === "good" ? "bg-green-600 text-white" : "bg-red-600 text-white"
                      }`}
                    >
                      {currentClassification.rating?.toUpperCase() || "UNKNOWN"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 justify-center min-w-[140px]">
              <Button
                onClick={() => handleClassification("good")}
                className={`h-12 flex items-center gap-2 ${
                  currentClassification?.rating === "good"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-white text-black hover:bg-gray-200"
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                Good
                <span className="text-xs opacity-70">(G)</span>
              </Button>

              <Button
                onClick={() => handleClassification("bad")}
                className={`h-12 flex items-center gap-2 ${
                  currentClassification?.rating === "bad"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-white text-black hover:bg-gray-200"
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                Bad
                <span className="text-xs opacity-70">(B)</span>
              </Button>

              {currentClassification && (
                <Button
                  onClick={handleClearRating}
                  variant="outline"
                  className="h-10 flex items-center gap-2 border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear
                  <span className="text-xs opacity-70">(R)</span>
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mt-6">
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentImageIndex((prev) => prev - 1)}
                disabled={currentImageIndex === 0}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              <Button
                onClick={() => setCurrentImageIndex((prev) => prev + 1)}
                disabled={currentImageIndex === CLASSIFICATION_IMAGES.length - 1}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-xs text-gray-500 hidden md:block">Use G/B keys or ← → arrows to navigate</div>

              {allImagesRated && (
                <Link href="/complete">
                  <Button onClick={handleFinishSurvey} className="bg-green-600 text-white hover:bg-green-700">
                    Finish Survey
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {surveyData.classificationProgress.completedImages.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex gap-4 text-sm">
                <div className="text-green-400">
                  Good: {Object.values(surveyData.classifications).filter((c) => c.rating === "good").length}
                </div>
                <div className="text-red-400">
                  Bad: {Object.values(surveyData.classifications).filter((c) => c.rating === "bad").length}
                </div>
                <div className="text-gray-400">
                  Remaining: {CLASSIFICATION_IMAGES.length - surveyData.classificationProgress.completedImages.length}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
