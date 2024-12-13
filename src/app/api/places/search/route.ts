import { NextResponse } from 'next/server'
import { searchPlaces } from '@/lib/api/places'
import { incrementAPIUsage } from '@/lib/utils/apiUsageStore'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const location = searchParams.get('location')
  const type = searchParams.get('type')
  const maxResults = searchParams.get('maxResults')
  const radiusMiles = searchParams.get('radiusMiles')

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    )
  }

  try {
    // Track API usage server-side
    incrementAPIUsage()

    const results = await searchPlaces({
      query,
      location: location || undefined,
      type: type || undefined,
      maxResults: maxResults ? parseInt(maxResults) : undefined,
      radiusMiles: radiusMiles ? parseInt(radiusMiles) : undefined,
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error in places search:', error)
    return NextResponse.json(
      { error: 'Failed to search places' },
      { status: 500 }
    )
  }
} 