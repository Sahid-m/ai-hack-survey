"use client"

import { useSurvey } from "@/lib/survey-context"
import { Button } from "@/components/ui/button"
import { Download, RotateCcw } from "lucide-react"

export function DataExport() {
  const { exportSurveyData, dispatch, surveyData } = useSurvey()

  const handleExport = () => {
    const data = exportSurveyData()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `survey_data_${surveyData.sessionId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all survey data? This action cannot be undone.")) {
      dispatch({ type: "RESET_SURVEY" })
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleExport}
        variant="outline"
        size="sm"
        className="border-white/20 text-white hover:bg-white/10 bg-transparent"
      >
        <Download className="w-4 h-4 mr-1" />
        Export Data
      </Button>
      <Button
        onClick={handleReset}
        variant="outline"
        size="sm"
        className="border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
      >
        <RotateCcw className="w-4 h-4 mr-1" />
        Reset Survey
      </Button>
    </div>
  )
}
