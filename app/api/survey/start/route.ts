import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    // Create a new survey session
    const session = await prisma.surveySession.create({
      data: {
        startTime: new Date(),
        completed: false,
      },
    })

    return NextResponse.json({
      success: true,
      sessionId: session.id,
    })
  } catch (error) {
    console.error("[v0] Error creating survey session:", error)
    return NextResponse.json({ success: false, error: "Failed to create survey session" }, { status: 500 })
  }
}
