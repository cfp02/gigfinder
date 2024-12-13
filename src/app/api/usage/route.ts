import { NextResponse } from 'next/server'
import { getAPIUsageStats } from '@/lib/utils/apiUsageStore'

export async function GET() {
  try {
    const stats = await getAPIUsageStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error getting API usage stats:', error)
    return NextResponse.json(
      { error: 'Failed to get API usage stats' },
      { status: 500 }
    )
  }
} 