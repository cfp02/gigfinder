'use server'

import axios from 'axios'
import { trackAPICall } from '../utils/apiUsage'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const DEFAULT_RADIUS_MILES = 10
const METERS_PER_MILE = 1609.34

interface PlacesSearchParams {
  query: string
  location?: string
  type?: string
  maxResults?: number
  radiusMiles?: number
}

interface PlaceResult {
  id: string
  name: string
  type: string
  address: string
  phone?: string
  website?: string
  rating?: number
  photos?: string[]
  location: {
    latitude: number
    longitude: number
  }
}

export async function testPlacesAPI() {
  try {
    const response = await axios.post(
      'https://places.googleapis.com/v1/places:searchText',
      {
        textQuery: 'photography studio',
        languageCode: "en",
        maxResultCount: 1
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'places.displayName'
        }
      }
    )
    return { success: true, data: response.data }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.response?.data?.error || error.message 
    }
  }
}

export async function searchPlaces({
  query,
  location,
  type,
  maxResults = 50,
  radiusMiles = DEFAULT_RADIUS_MILES
}: PlacesSearchParams): Promise<PlaceResult[]> {
  try {
    // Track API call
    trackAPICall()

    // Convert miles to meters for the API
    const radiusMeters = Math.round(radiusMiles * METERS_PER_MILE)

    // First, geocode the location if provided
    let coordinates = { latitude: 0, longitude: 0 }
    if (location) {
      // Track geocoding API call
      trackAPICall()
      const geocodeResponse = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          location
        )}&key=${GOOGLE_MAPS_API_KEY}`
      )
      if (geocodeResponse.data.results[0]) {
        const loc = geocodeResponse.data.results[0].geometry.location
        coordinates = { latitude: loc.lat, longitude: loc.lng }
      }
    }

    let allResults: any[] = []
    let pageToken: string | undefined
    
    // Keep fetching pages until we have enough results or no more pages
    do {
      // Track each page request
      trackAPICall()
      
      const response = await axios.post(
        'https://places.googleapis.com/v1/places:searchText',
        {
          textQuery: query,
          locationBias: location ? {
            circle: {
              center: coordinates,
              radius: radiusMeters.toString()
            }
          } : undefined,
          maxResultCount: Math.min(maxResults - allResults.length, 20), // Max 20 per request
          languageCode: "en",
          pageToken
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.internationalPhoneNumber,places.websiteUri,nextPageToken'
          }
        }
      )

      const places = response.data.places || []
      allResults = [...allResults, ...places]
      pageToken = response.data.nextPageToken

      // Break if we have enough results or no more pages
      if (allResults.length >= maxResults || !pageToken) {
        break
      }

      // Wait a short time between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
    } while (true)

    return allResults.slice(0, maxResults).map((place: any) => ({
      id: place.id,
      name: place.displayName.text,
      type: place.types?.[0] || 'business',
      address: place.formattedAddress,
      phone: place.internationalPhoneNumber,
      website: place.websiteUri,
      rating: place.rating,
      location: place.location
    }))
  } catch (error: any) {
    console.error('Places API Error:', error.response?.data || error.message)
    return []
  }
}

export async function getPlaceDetails(placeId: string): Promise<PlaceResult> {
  try {
    // Track API call
    trackAPICall()
    
    const response = await axios.get(
      `https://places.googleapis.com/v1/${placeId}`,
      {
        headers: {
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,phoneNumber,websiteUri,types,photos'
        }
      }
    )

    const place = response.data
    return {
      id: placeId,
      name: place.displayName.text,
      type: place.types[0],
      address: place.formattedAddress,
      phone: place.phoneNumber,
      website: place.websiteUri,
      location: {
        latitude: place.location.latitude,
        longitude: place.location.longitude
      },
      photos: place.photos?.map((photo: any) => photo.name),
    }
  } catch (error) {
    console.error('Error getting place details:', error)
    throw error
  }
} 