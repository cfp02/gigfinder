'use client'

import { useState } from 'react'
import axios from 'axios'

export default function BulkImportPage() {
  const [location, setLocation] = useState('')
  const [radius, setRadius] = useState('20')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await axios.get('/api/places/bulk-search', {
        params: {
          location,
          radiusMiles: radius
        }
      })
      setResults(response.data)
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to perform bulk import')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Bulk Import</h1>
          <p className="mt-2 text-sm text-gray-700">
            Import all businesses in your area in one go. This will search across multiple business categories
            and save them to your leads database.
          </p>
        </div>
      </div>

      <form onSubmit={handleBulkImport} className="mt-8 space-y-6">
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
          <div>
            <label htmlFor="location" className="block text-sm font-medium leading-6 text-gray-900">
              Location
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="location"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State or Address"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="radius" className="block text-sm font-medium leading-6 text-gray-900">
              Search Radius (miles)
            </label>
            <div className="mt-2">
              <select
                id="radius"
                name="radius"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="5">5 miles</option>
                <option value="10">10 miles</option>
                <option value="20">20 miles</option>
                <option value="25">25 miles</option>
                <option value="50">50 miles</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            {isLoading ? 'Importing...' : 'Start Bulk Import'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {results && (
        <div className="mt-6 rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Import Complete</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Total businesses found: {results.totalFound}</p>
                <p>Successfully saved: {results.totalSaved}</p>
                {results.errors && results.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Errors:</p>
                    <ul className="list-disc list-inside">
                      {results.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}