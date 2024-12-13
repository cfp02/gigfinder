import { NextResponse } from 'next/server'
import { testPlacesAPI } from '@/lib/api/places'

export async function GET() {
  const result = await testPlacesAPI()
  
  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 500 }
    )
  }

  return NextResponse.json(result.data)
} 