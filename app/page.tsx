"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SurveyProgress } from "@/components/survey-progress"
import { DataExport } from "@/components/data-export"
import { useSurvey } from "@/lib/survey-context"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { surveyData, dispatch, getSurveyProgress, createDatabaseSession, isLoading, error } = useSurvey()
  const { overallProgress } = getSurveyProgress()
  const [isStarting, setIsStarting] = useState(false)

  useEffect(() => {
    dispatch({ type: "SET_STEP", step: "start" })
  }, [dispatch])

  const handleStartSurvey = async () => {
    setIsStarting(true)

    if (overallProgress === 0) {
      dispatch({ type: "INITIALIZE_SURVEY" })

      // Create database session for new survey
      const sessionCreated = await createDatabaseSession()
      if (!sessionCreated) {
        console.error("[v0] Failed to create database session, continuing with local storage only")
      }
    }

    dispatch({ type: "SET_STEP", step: "annotation" })
    setIsStarting(false)
  }

  const canContinue = overallProgress > 0 && overallProgress < 100

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {overallProgress > 0 && <SurveyProgress />}

        <Card className="bg-black border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">Data Annotation Survey</CardTitle>
            <CardDescription className="text-gray-300">
              Help us improve our AI models by annotating images and providing feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 text-sm text-gray-300">
              <div className="space-y-2">
                <h3 className="font-semibold text-white">Task 1: Image Annotation</h3>
                <p>Draw bounding boxes around objects in images</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-white">Task 2: Image Classification</h3>
                <p>Rate the quality of generated images</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
                <p className="text-gray-400 text-xs mt-1">Survey will continue with local storage only.</p>
              </div>
            )}

            <div className="space-y-3">
              <Link href="/annotation" className="block">
                <Button
                  onClick={handleStartSurvey}
                  className="w-full bg-white text-black hover:bg-gray-200"
                  disabled={isStarting || isLoading}
                >
                  {isStarting || isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {overallProgress === 0 ? "Starting Survey..." : "Loading..."}
                    </>
                  ) : (
                    <>{overallProgress === 0 ? "Start Survey" : canContinue ? "Continue Survey" : "Review Results"}</>
                  )}
                </Button>
              </Link>

              {overallProgress > 0 && (
                <div className="flex justify-center">
                  <DataExport />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
