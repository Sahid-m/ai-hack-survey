"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSurvey } from "@/lib/survey-context"
import { DataExport } from "@/components/data-export"
import { CheckCircle, Loader2, AlertCircle, Database } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CompletePage() {
  const { surveyData, dispatch, saveSurveyToDatabase, isLoading, error } = useSurvey()
  const [saveStatus, setSaveStatus] = useState<"pending" | "saving" | "success" | "error">("pending")

  useEffect(() => {
    dispatch({ type: "SET_STEP", step: "complete" })
    dispatch({ type: "COMPLETE_SURVEY" })
  }, [dispatch])

  useEffect(() => {
    const saveToDatabase = async () => {
      setSaveStatus("saving")
      const success = await saveSurveyToDatabase(true)
      setSaveStatus(success ? "success" : "error")
    }

    // Only save once when the page loads
    if (saveStatus === "pending") {
      saveToDatabase()
    }
  }, [saveSurveyToDatabase, saveStatus])

  const annotationCount = Object.keys(surveyData.annotations).length
  const classificationCount = Object.keys(surveyData.classifications).length
  const totalBoundingBoxes = Object.values(surveyData.annotations).reduce(
    (total, annotation) => total + annotation.boundingBoxes.length,
    0,
  )

  const goodRatings = Object.values(surveyData.classifications).filter((c) => c.classification.rating === "good").length
  const badRatings = Object.values(surveyData.classifications).filter((c) => c.classification.rating === "bad").length

  const surveyDuration = surveyData.completedAt
    ? Math.round((surveyData.completedAt - surveyData.startedAt) / 1000 / 60)
    : 0

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="bg-black border-white/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Survey Complete!</CardTitle>
            <Link href="https://app.prolific.com/submissions/complete?cc=C17FILW9"><Button>Click to go back</Button></Link>
            <p className="text-gray-300">Thank you for your valuable contribution to our AI research.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-blue-400" />
                <div className="flex-1">
                  <div className="font-medium text-white">Database Status</div>
                  <div className="text-sm text-gray-400">
                    {saveStatus === "saving" && (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving your data...
                      </div>
                    )}
                    {saveStatus === "success" && (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        Data saved successfully
                      </div>
                    )}
                    {saveStatus === "error" && (
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        Failed to save to database (data preserved locally)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-white">{annotationCount}</div>
                <div className="text-sm text-gray-400">Images Annotated</div>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-white">{totalBoundingBoxes}</div>
                <div className="text-sm text-gray-400">Bounding Boxes</div>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-white">{classificationCount}</div>
                <div className="text-sm text-gray-400">Images Classified</div>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-white">{surveyDuration}m</div>
                <div className="text-sm text-gray-400">Time Spent</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-white">Classification Results</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-300">Good: {goodRatings}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-300">Bad: {badRatings}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <DataExport />
            </div>

            <div className="text-xs text-gray-500 text-center">Session ID: {surveyData.sessionId}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
