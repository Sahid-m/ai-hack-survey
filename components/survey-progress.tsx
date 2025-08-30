"use client"

import { useSurvey } from "@/lib/survey-context"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"

export function SurveyProgress() {
  const { getSurveyProgress, surveyData } = useSurvey()
  const { annotationProgress, classificationProgress, overallProgress } = getSurveyProgress()

  return (
    <Card className="bg-black border-white/20 mb-4">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-white">Survey Progress</h3>
            <span className="text-xs text-gray-400">{Math.round(overallProgress)}% Complete</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300">Annotation Task</span>
              <span className="text-gray-400">{Math.round(annotationProgress)}%</span>
            </div>
            <Progress value={annotationProgress} className="h-1 bg-gray-800" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300">Classification Task</span>
              <span className="text-gray-400">{Math.round(classificationProgress)}%</span>
            </div>
            <Progress value={classificationProgress} className="h-1 bg-gray-800" />
          </div>

          <div className="text-xs text-gray-500 pt-1">Session: {surveyData.sessionId.split("_")[2]}</div>
        </div>
      </CardContent>
    </Card>
  )
}
