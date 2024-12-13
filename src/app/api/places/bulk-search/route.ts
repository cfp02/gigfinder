import { NextResponse } from 'next/server'
import { searchPlaces } from '@/lib/api/places'
import { prisma } from '@/lib/db'
import { DEFAULT_BUSINESS_TYPES } from '@/lib/constants/businessTypes'

interface ErrorWithMessage {
  message: string
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  )
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError

  try {
    return new Error(JSON.stringify(maybeError))
  } catch {
    // fallback in case there's an error stringifying the maybeError
    // like with circular references for example.
    return new Error(String(maybeError))
  }
}

function getErrorMessage(error: unknown) {
  return toErrorWithMessage(error).message
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const radiusMiles = parseInt(searchParams.get('radiusMiles') || '20')
    
    if (!location) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      )
    }

    let allBusinesses = new Map() // Use Map to deduplicate by ID
    let totalProcessed = 0
    const errors: string[] = []

    // Search each category
    for (const category of DEFAULT_BUSINESS_TYPES) {
      try {
        console.log(`Searching ${category.name}...`)
        const results = await searchPlaces({
          query: category.query,
          location,
          radiusMiles,
          maxResults: 100 // Get more results per category
        })

        // Add new businesses to map
        results.forEach(business => {
          if (!allBusinesses.has(business.id)) {
            allBusinesses.set(business.id, {
              ...business,
              type: category.name // Use our category name
            })
          }
        })

        totalProcessed += results.length
        console.log(`Found ${results.length} ${category.name} businesses`)
        
        // Add a delay between categories to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error: unknown) {
        console.error(`Error searching ${category.name}:`, error)
        errors.push(`${category.name}: ${getErrorMessage(error)}`)
      }
    }

    // Convert Map to array
    const uniqueBusinesses = Array.from(allBusinesses.values())

    // Save to database
    let savedCount = 0
    for (const business of uniqueBusinesses) {
      try {
        await prisma.lead.upsert({
          where: { id: business.id },
          update: {
            name: business.name,
            type: business.type,
            address: business.address,
            phone: business.phone || null,
            website: business.website || null,
            rating: business.rating || null
          },
          create: {
            id: business.id,
            name: business.name,
            type: business.type,
            address: business.address,
            phone: business.phone || null,
            website: business.website || null,
            rating: business.rating || null,
            status: 'New'
          }
        })
        savedCount++
      } catch (error: unknown) {
        console.error(`Error saving business ${business.id}:`, error)
        errors.push(`Save error for ${business.name}: ${getErrorMessage(error)}`)
      }
    }

    return NextResponse.json({
      success: true,
      totalFound: uniqueBusinesses.length,
      totalSaved: savedCount,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: unknown) {
    console.error('Bulk search error:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk search', details: getErrorMessage(error) },
      { status: 500 }
    )
  }
}