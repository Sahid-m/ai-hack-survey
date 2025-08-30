import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const sessionId = params.sessionId

    // Get survey session with all related data
    const session = await prisma.surveySession.findUnique({
      where: { id: sessionId },
      include: {
        annotations: {
          orderBy: { imageIndex: "asc" },
        },
        classifications: {
          orderBy: { imageIndex: "asc" },
        },
      },
    })

    if (!session) {
      return NextResponse.json({ success: false, error: "Survey session not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      session,
    })
  } catch (error) {
    console.error("[v0] Error fetching survey data:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch survey data" }, { status: 500 })
  }
}
