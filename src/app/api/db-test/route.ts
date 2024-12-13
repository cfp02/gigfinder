import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Create a test API usage record
    const usage = await prisma.aPIUsage.create({
      data: {
        count: 1
      }
    })

    return NextResponse.json({ success: true, usage })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    )
  }
} 