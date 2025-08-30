"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TextCursor as Cursor, Square, Trash2 } from "lucide-react"
import Link from "next/link"
import { useSurvey, ANNOTATION_IMAGES } from "@/lib/survey-context"
import type { BoundingBox } from "@/lib/survey-context"
import { SurveyProgress } from "@/components/survey-progress"

const OBJECT_TYPES = {
  deer: { label: "Deer", color: "red", borderColor: "border-red-500", bgColor: "bg-red-500/30" },
  rock: { label: "Rock", color: "blue", borderColor: "border-blue-500", bgColor: "bg-blue-500/30" },
  bear: { label: "Bear", color: "green", borderColor: "border-green-500", bgColor: "bg-green-500/30" },
} as const

export default function AnnotationPage() {
  const { surveyData, dispatch, saveAnnotation } = useSurvey()
  const [currentImageIndex, setCurrentImageIndex] = useState(surveyData.annotationProgress.currentImageIndex)
  const [tool, setTool] = useState<"cursor" | "draw">("cursor")
  const [selectedObjectType, setSelectedObjectType] = useState<"deer" | "rock" | "bear">("deer")
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>(
    surveyData.annotations[currentImageIndex]?.boundingBoxes || [],
  )
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [currentBox, setCurrentBox] = useState<BoundingBox | null>(null)

  useEffect(() => {
    dispatch({ type: "SET_STEP", step: "annotation" })
  }, [dispatch])

  useEffect(() => {
    // Load bounding boxes for current image
    setBoundingBoxes(surveyData.annotations[currentImageIndex]?.boundingBoxes || [])
    setSelectedBoxId(null)
    setCurrentBox(null)
  }, [currentImageIndex, surveyData.annotations])

  useEffect(() => {
    // Save current image index to survey data
    dispatch({ type: "SET_ANNOTATION_IMAGE", imageIndex: currentImageIndex })
  }, [currentImageIndex, dispatch])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedBoxId) {
          handleDeleteBox(selectedBoxId)
        }
      }
      if (e.key === "Escape") {
        setSelectedBoxId(null)
        setTool("cursor")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedBoxId])

  const handleNextImage = () => {
    // Save current annotations
    saveAnnotation(currentImageIndex, boundingBoxes)

    if (currentImageIndex < ANNOTATION_IMAGES.length - 1) {
      setCurrentImageIndex((prev) => prev + 1)
    }
  }

  const handlePreviousImage = () => {
    // Save current annotations
    saveAnnotation(currentImageIndex, boundingBoxes)

    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1)
    }
  }

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      if (tool === "cursor") {
        const clickedBox = boundingBoxes.find(
          (box) => x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height,
        )

        if (clickedBox) {
          setSelectedBoxId(clickedBox.id)
        } else {
          setSelectedBoxId(null)
        }
      } else if (tool === "draw") {
        setStartPoint({ x, y })
        setIsDrawing(true)
        setSelectedBoxId(null)
      }
    },
    [tool, boundingBoxes],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDrawing || !startPoint || tool !== "draw") return

      const rect = e.currentTarget.getBoundingClientRect()
      const currentX = e.clientX - rect.left
      const currentY = e.clientY - rect.top

      const previewBox: BoundingBox = {
        x: Math.min(startPoint.x, currentX),
        y: Math.min(startPoint.y, currentY),
        width: Math.abs(currentX - startPoint.x),
        height: Math.abs(currentY - startPoint.y),
        id: "preview",
      }

      setCurrentBox(previewBox)
    },
    [isDrawing, startPoint, tool],
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDrawing || !startPoint || tool !== "draw") return

      const rect = e.currentTarget.getBoundingClientRect()
      const endX = e.clientX - rect.left
      const endY = e.clientY - rect.top

      const newBox: BoundingBox = {
        x: Math.min(startPoint.x, endX),
        y: Math.min(startPoint.y, endY),
        width: Math.abs(endX - startPoint.x),
        height: Math.abs(endY - startPoint.y),
        id: Date.now().toString(),
        objectType: selectedObjectType,
      }

      if (newBox.width > 20 && newBox.height > 20) {
        const updatedBoxes = [...boundingBoxes, newBox]
        setBoundingBoxes(updatedBoxes)
        saveAnnotation(currentImageIndex, updatedBoxes)
      }

      setIsDrawing(false)
      setStartPoint(null)
      setCurrentBox(null)
    },
    [isDrawing, startPoint, tool, boundingBoxes, currentImageIndex, saveAnnotation, selectedObjectType],
  )

  const handleDeleteBox = (boxId: string) => {
    const updatedBoxes = boundingBoxes.filter((box) => box.id !== boxId)
    setBoundingBoxes(updatedBoxes)
    saveAnnotation(currentImageIndex, updatedBoxes)
    setSelectedBoxId(null)
  }

  const handleClearAll = () => {
    setBoundingBoxes([])
    saveAnnotation(currentImageIndex, [])
    setSelectedBoxId(null)
  }

  const isLastImage = currentImageIndex === ANNOTATION_IMAGES.length - 1
  const allAnnotationsComplete = surveyData.annotationProgress.completedImages.length === ANNOTATION_IMAGES.length

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <SurveyProgress />

        <Card className="bg-black border-white/20 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold text-white">
              Image {currentImageIndex + 1} of {ANNOTATION_IMAGES.length}
            </h1>
            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Object:</span>
                <Select
                  value={selectedObjectType}
                  onValueChange={(value: "deer" | "rock" | "bear") => setSelectedObjectType(value)}
                >
                  <SelectTrigger className="w-24 bg-black border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/20">
                    {Object.entries(OBJECT_TYPES).map(([key, config]) => (
                      <SelectItem key={key} value={key} className="text-white hover:bg-white/10">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 border-2 ${config.borderColor} ${config.bgColor} rounded`} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant={tool === "cursor" ? "default" : "outline"}
                size="sm"
                onClick={() => setTool("cursor")}
                className={tool === "cursor" ? "bg-white text-black" : "border-white/20 text-white hover:bg-white/10"}
              >
                <Cursor className="w-4 h-4 mr-1" />
                Cursor
              </Button>
              <Button
                variant={tool === "draw" ? "default" : "outline"}
                size="sm"
                onClick={() => setTool("draw")}
                className={tool === "draw" ? "bg-white text-black" : "border-white/20 text-white hover:bg-white/10"}
              >
                <Square className="w-4 h-4 mr-1" />
                Draw
              </Button>
              {boundingBoxes.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          <div className="relative mb-6">
            <div
              className={`relative border border-white/20 rounded-lg overflow-hidden bg-gray-900 ${
                tool === "draw" ? "cursor-crosshair" : "cursor-pointer"
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ aspectRatio: "3/2", minHeight: "400px" }}
            >
              <img
                src={ANNOTATION_IMAGES[currentImageIndex] || "/placeholder.svg"}
                alt={`Annotation image ${currentImageIndex + 1}`}
                className="w-full h-full object-contain"
                draggable={false}
                onLoad={() => console.log("[v0] Image loaded:", ANNOTATION_IMAGES[currentImageIndex])}
                onError={(e) => {
                  console.log("[v0] Image failed to load:", ANNOTATION_IMAGES[currentImageIndex])
                  e.currentTarget.src = `/placeholder.svg?height=400&width=600&query=annotation image ${currentImageIndex + 1}`
                }}
              />

              {boundingBoxes.map((box) => {
                const objectConfig = OBJECT_TYPES[box.objectType]
                return (
                  <div
                    key={box.id}
                    className={`absolute border-2 pointer-events-none ${
                      selectedBoxId === box.id
                        ? "border-yellow-400 bg-yellow-400/40"
                        : `${objectConfig.borderColor} ${objectConfig.bgColor}`
                    } transition-colors`}
                    style={{
                      left: `${box.x}px`,
                      top: `${box.y}px`,
                      width: `${box.width}px`,
                      height: `${box.height}px`,
                      zIndex: 5,
                    }}
                  >
                    <div
                      className={`absolute -top-6 left-0 text-xs px-2 py-1 rounded ${objectConfig.bgColor} ${objectConfig.borderColor} border text-white bg-black/80`}
                    >
                      {objectConfig.label}
                    </div>
                    {selectedBoxId === box.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteBox(box.id)
                        }}
                        className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700 transition-colors border-2 border-white pointer-events-auto"
                        style={{ zIndex: 10 }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                )
              })}

              {currentBox && isDrawing && (
                <div
                  className={`absolute border-2 pointer-events-none ${OBJECT_TYPES[selectedObjectType].borderColor} ${OBJECT_TYPES[selectedObjectType].bgColor}`}
                  style={{
                    left: `${currentBox.x}px`,
                    top: `${currentBox.y}px`,
                    width: `${currentBox.width}px`,
                    height: `${currentBox.height}px`,
                    zIndex: 5,
                  }}
                />
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <div className="text-sm text-gray-400">
                {boundingBoxes.length} bounding box{boundingBoxes.length !== 1 ? "es" : ""} drawn
              </div>
              {boundingBoxes.length > 0 && (
                <div className="text-xs text-gray-500 flex gap-4">
                  {Object.entries(OBJECT_TYPES).map(([key, config]) => {
                    const count = boundingBoxes.filter((box) => box.objectType === key).length
                    if (count === 0) return null
                    return (
                      <span key={key} className="flex items-center gap-1">
                        <div className={`w-2 h-2 ${config.borderColor} ${config.bgColor} border rounded`} />
                        {count} {config.label}
                      </span>
                    )
                  })}
                </div>
              )}
              {selectedBoxId && (
                <div className="text-xs text-yellow-400">Press Delete or click × to remove selected box</div>
              )}
              {tool === "draw" && (
                <div className="text-xs text-blue-400">
                  Drawing {OBJECT_TYPES[selectedObjectType].label} boxes - Click and drag to draw
                </div>
              )}
            </div>

            <div className="flex gap-4">
              {currentImageIndex > 0 && (
                <Button
                  onClick={handlePreviousImage}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  Previous
                </Button>
              )}

              {!isLastImage ? (
                <Button onClick={handleNextImage} className="bg-white text-black hover:bg-gray-200">
                  Next Image
                </Button>
              ) : (
                <Link href="/classification">
                  <Button
                    className="bg-white text-black hover:bg-gray-200"
                    onClick={() => {
                      saveAnnotation(currentImageIndex, boundingBoxes)
                      dispatch({ type: "SET_STEP", step: "classification" })
                    }}
                  >
                    Continue to Classification
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
