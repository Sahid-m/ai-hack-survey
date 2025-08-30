import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Get overall survey statistics
    const totalSessions = await prisma.surveySession.count()
    const completedSessions = await prisma.surveySession.count({
      where: { completed: true },
    })
    const totalAnnotations = await prisma.annotation.count()
    const totalClassifications = await prisma.classification.count()

    // Get object type distribution
    const objectTypeStats = await prisma.annotation.groupBy({
      by: ["objectType"],
      _count: {
        objectType: true,
      },
    })

    // Get rating distribution
    const ratingStats = await prisma.classification.groupBy({
      by: ["rating"],
      _count: {
        rating: true,
      },
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalSessions,
        completedSessions,
        totalAnnotations,
        totalClassifications,
        objectTypeDistribution: objectTypeStats,
        ratingDistribution: ratingStats,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching survey stats:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch survey stats" }, { status: 500 })
  }
}
