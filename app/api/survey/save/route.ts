import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, annotations, classifications, completed } = body

    console.log("[v0] Saving survey data for session:", sessionId)

    // Start a transaction to save all data atomically
    await prisma.$transaction(async (tx) => {
      // Clear existing data for this session (in case of re-submission)
      await tx.annotation.deleteMany({
        where: { sessionId },
      })
      await tx.classification.deleteMany({
        where: { sessionId },
      })

      // Save annotations
      if (annotations && annotations.length > 0) {
        const annotationData = annotations.flatMap((imageAnnotation: any) =>
          imageAnnotation.boxes.map((box: any) => ({
            sessionId,
            imageIndex: imageAnnotation.imageIndex,
            imagePath: imageAnnotation.imagePath,
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            objectType: box.objectType,
          })),
        )

        await tx.annotation.createMany({
          data: annotationData,
        })
      }

      // Save classifications
      if (classifications && classifications.length > 0) {
        const classificationData = classifications.map((classification: any) => ({
          sessionId,
          imageIndex: classification.imageIndex,
          imagePath: classification.imagePath,
          rating: classification.rating,
        }))

        await tx.classification.createMany({
          data: classificationData,
        })
      }

      // Update session completion status
      await tx.surveySession.update({
        where: { id: sessionId },
        data: {
          completed: completed || false,
          endTime: completed ? new Date() : null,
        },
      })
    })

    console.log("[v0] Successfully saved survey data")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error saving survey data:", error)
    return NextResponse.json({ success: false, error: "Failed to save survey data" }, { status: 500 })
  }
}
