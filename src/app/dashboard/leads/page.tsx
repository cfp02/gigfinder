'use client'

import { useState, useEffect, useMemo } from 'react'
import { MagnifyingGlassIcon, MapPinIcon, StarIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import { estimateCosts } from '@/lib/utils/apiUsage'
import { getCachedResults, cacheResults, getCacheStats, clearCache } from '@/lib/utils/searchCache'

const businessTypes = [
  { 
    id: 'all',
    name: 'All Businesses',
    query: 'business establishment'
  },
  { 
    id: 'restaurants',
    name: 'Restaurants & Cafes',
    query: 'restaurant cafe bistro dining'
  },
  { 
    id: 'retail',
    name: 'Retail & Boutiques',
    query: 'retail store shop boutique'
  },
  { 
    id: 'real_estate',
    name: 'Real Estate',
    query: 'real estate property homes'
  },
  { 
    id: 'hospitality',
    name: 'Hotels & Venues',
    query: 'hotel venue event space wedding'
  },
  { 
    id: 'food_beverage',
    name: 'Food & Beverage',
    query: 'brewery winery bar lounge'
  },
  { 
    id: 'wellness',
    name: 'Health & Wellness',
    query: 'spa wellness fitness gym'
  },
  { 
    id: 'professional',
    name: 'Professional Services',
    query: 'business office firm agency'
  }
]

interface Lead {
  id: string
  name: string
  type: string
  address: string
  phone?: string
  website?: string
  rating?: number
  status: 'New' | 'Contacted' | 'Interested' | 'Not Interested' | 'Client'
  notes?: string
  lastContact?: string | null
}

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('')
  const [radiusMiles, setRadiusMiles] = useState(10)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['all'])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedLeads, setSavedLeads] = useState<Lead[]>([])
  const [viewMode, setViewMode] = useState<'search' | 'saved'>('saved')
  const [apiUsage, setApiUsage] = useState({ daily: { date: '', count: 0 }, total: 0 })
  const [costs, setCosts] = useState({ dailyCost: 0, totalCost: 0, remainingCredit: 200, isWithinFreeQuota: true })
  const [cacheStats, setCacheStats] = useState({ totalEntries: 0, savedAPICalls: 0 })
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [debouncedSearch] = useState(() => {
    let timeoutId: NodeJS.Timeout
    return (callback: () => void) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(callback, 500)
    }
  })

  // Filter and sort leads
  const filteredAndSortedLeads = useMemo(() => {
    let filtered = [...savedLeads]
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(lead => lead.type === filterType)
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(lead => lead.status === filterStatus)
    }
    
    // Apply search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(lead => 
        lead.name.toLowerCase().includes(search) ||
        lead.address.toLowerCase().includes(search) ||
        (lead.phone && lead.phone.toLowerCase().includes(search)) ||
        (lead.website && lead.website.toLowerCase().includes(search))
      )
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        case 'rating':
          comparison = (b.rating || 0) - (a.rating || 0)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'lastContact':
          const dateA = a.lastContact ? new Date(a.lastContact).getTime() : 0
          const dateB = b.lastContact ? new Date(b.lastContact).getTime() : 0
          comparison = dateB - dateA
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return filtered
  }, [savedLeads, filterType, filterStatus, searchTerm, sortBy, sortOrder])

  // Get unique types for filter
  const uniqueTypes = useMemo(() => {
    const types = new Set(savedLeads.map(lead => lead.type))
    return ['all', ...Array.from(types)]
  }, [savedLeads])

  // Update API usage and stats
  useEffect(() => {
    const updateStats = async () => {
      try {
        const response = await axios.get('/api/usage')
        const usage = response.data
        setApiUsage(usage)
        setCosts(estimateCosts(usage))
        setCacheStats(getCacheStats())
      } catch (error) {
        console.error('Error fetching API usage:', error)
      }
    }

    updateStats()
    const interval = setInterval(updateStats, 5000)
    return () => clearInterval(interval)
  }, [])

  // Load saved leads on mount
  useEffect(() => {
    const loadSavedLeads = async () => {
      try {
        const response = await axios.get('/api/leads')
        setSavedLeads(response.data)
      } catch (error) {
        console.error('Error loading saved leads:', error)
      }
    }

    if (viewMode === 'saved') {
      loadSavedLeads()
    }
  }, [viewMode])

  // Handle business type selection
  const handleTypeSelection = (typeId: string) => {
    setSelectedTypes(prev => {
      if (typeId === 'all') {
        return ['all']
      }
      const newTypes = prev.filter(t => t !== 'all')
      if (prev.includes(typeId)) {
        return newTypes.filter(t => t !== typeId).length ? newTypes.filter(t => t !== typeId) : ['all']
      }
      return [...newTypes, typeId]
    })
  }

  // Perform search when location or selected types change
  useEffect(() => {
    if (location || selectedTypes.length > 0) {
      debouncedSearch(() => searchBusinesses())
    }
  }, [location, selectedTypes])

  const searchBusinesses = async () => {
    if (!location) return

    setLoading(true)
    setError(null)

    try {
      let queries: string[]
      if (selectedTypes.includes('all')) {
        // If 'all' is selected, just do one broad search
        queries = ['business establishment']
      } else {
        // Otherwise, search for each selected type
        queries = selectedTypes.map(typeId => {
          const businessType = businessTypes.find(t => t.id === typeId)
          return businessType?.query || ''
        })
      }

      const allResults = await Promise.all(
        queries.map(async (query) => {
          const searchQuery = `${query} ${searchTerm}`.trim()
          
          // Check cache first
          const cachedResults = getCachedResults(searchQuery, location)
          if (cachedResults) {
            return cachedResults
          }

          // If not in cache, make API call
          const response = await axios.get('/api/places/search', {
            params: {
              query: searchQuery,
              location,
              maxResults: 50,
              radiusMiles
            },
          })

          // Cache the results
          cacheResults(searchQuery, response.data, location)
          return response.data
        })
      )

      // Combine and deduplicate results
      const combinedLeads = allResults
        .flat()
        .reduce((unique: Lead[], lead: Lead) => {
          return unique.find(l => l.id === lead.id)
            ? unique
            : [...unique, { ...lead, status: 'New' }]
        }, [])

      setLeads(combinedLeads)
    } catch (err) {
      setError('Failed to search businesses. Please try again.')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveLead = async (lead: Lead) => {
    try {
      // Validate required fields
      if (!lead.id || !lead.name || !lead.type || !lead.address) {
        console.error('Missing required fields:', { id: lead.id, name: lead.name, type: lead.type, address: lead.address })
        return
      }

      // Transform the data to match the schema
      const leadData = {
        id: lead.id,
        name: lead.name,
        type: lead.type,
        address: lead.address,
        phone: lead.phone || null,
        website: lead.website || null,
        rating: typeof lead.rating === 'number' ? lead.rating : null,
        status: 'New',
        notes: null,
        lastContact: null
      }

      console.log('Attempting to save lead with data:', leadData)
      // Use absolute URL path
      const response = await axios.post('/api/leads', leadData, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      console.log('Lead saved successfully:', response.data)
      
      setSavedLeads(prev => {
        if (prev.find(l => l.id === lead.id)) return prev
        return [response.data, ...prev]
      })
    } catch (error: any) {
      console.error('Network Error Details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        config: error.config
      })
      setError('Failed to save lead. Please check your connection and try again.')
    }
  }

  const updateLeadStatus = async (leadId: string, status: Lead['status']) => {
    try {
      const response = await axios.put('/api/leads', {
        id: leadId,
        status,
      })
      setSavedLeads(prev =>
        prev.map(lead =>
          lead.id === leadId ? response.data : lead
        )
      )
    } catch (error) {
      console.error('Error updating lead status:', error)
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Lead Discovery</h1>
          <p className="mt-2 text-sm text-gray-700">
            Find and manage potential photography clients in your area.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <div className="flex flex-col items-end gap-2">
            <div className="text-sm text-gray-500">
              <div className="mb-1">
                API Calls Today: <span className="font-medium">{apiUsage.daily.count}</span>
                <span className="ml-2 text-xs">
                  (Est. ${costs.dailyCost.toFixed(2)})
                </span>
              </div>
              <div className="mb-1">
                Total API Calls: <span className="font-medium">{apiUsage.total}</span>
                <span className="ml-2 text-xs">
                  (Est. ${costs.totalCost.toFixed(2)})
                </span>
              </div>
              <div className={`text-xs ${costs.isWithinFreeQuota ? 'text-green-600' : 'text-yellow-600'}`}>
                Remaining Free Credit: ${costs.remainingCredit.toFixed(2)}
              </div>
              <div className="mt-1 text-xs text-indigo-600">
                Cache Saved: {cacheStats.savedAPICalls} API calls
                <button
                  onClick={() => {
                    clearCache()
                    setCacheStats(getCacheStats())
                  }}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  Clear Cache
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setViewMode('search')}
                className={`px-3 py-2 text-sm font-semibold rounded-md ${
                  viewMode === 'search'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300'
                }`}
              >
                Search New Leads
              </button>
              <button
                onClick={() => setViewMode('saved')}
                className={`px-3 py-2 text-sm font-semibold rounded-md ${
                  viewMode === 'saved'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300'
                }`}
              >
                Saved Leads ({savedLeads.length})
              </button>
              <a
                href="/dashboard/bulk-import"
                className="px-3 py-2 text-sm font-semibold rounded-md bg-green-600 text-white hover:bg-green-500"
              >
                Bulk Import
              </a>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'search' && (
        <>
          {/* Search and Filters */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-grow">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Search businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="pointer-events-none absolute pl-3">
                <MapPinIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="radius" className="text-sm text-gray-700">
                Radius:
              </label>
              <select
                id="radius"
                className="block rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                value={radiusMiles}
                onChange={(e) => setRadiusMiles(parseInt(e.target.value))}
              >
                <option value="5">5 miles</option>
                <option value="10">10 miles</option>
                <option value="25">25 miles</option>
                <option value="50">50 miles</option>
                <option value="100">100 miles</option>
              </select>
            </div>
          </div>

          {/* Business Type Filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {businessTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeSelection(type.id)}
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  selectedTypes.includes(type.id)
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>

          {/* Loading and Error States */}
          {loading && (
            <div className="mt-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-600">Searching for businesses...</p>
            </div>
          )}

          {error && (
            <div className="mt-8 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {viewMode === 'saved' && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search leads..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Business Type
            </label>
            <select
              id="type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {uniqueTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Interested">Interested</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Client">Client</option>
            </select>
          </div>

          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700">
              Sort By
            </label>
            <div className="mt-1 flex gap-2">
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="name">Name</option>
                <option value="type">Type</option>
                <option value="rating">Rating</option>
                <option value="status">Status</option>
                <option value="lastContact">Last Contact</option>
              </select>
              <button
                onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      {viewMode === 'saved' && (
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredAndSortedLeads.length} of {savedLeads.length} leads
        </div>
      )}

      {/* Results Table */}
      {!loading && (viewMode === 'search' ? leads : filteredAndSortedLeads).length > 0 && (
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Business
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Type
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Contact
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {(viewMode === 'search' ? leads : filteredAndSortedLeads).map((lead) => (
                      <tr key={lead.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <div>{lead.name}</div>
                          <div className="text-gray-500">{lead.address}</div>
                          {lead.rating && (
                            <div className="flex items-center text-gray-500">
                              <StarIcon className="h-4 w-4 text-yellow-400" />
                              <span className="ml-1">{lead.rating}</span>
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{lead.type}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {lead.phone && <div>{lead.phone}</div>}
                          {lead.website && (
                            <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                              Website
                            </a>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {viewMode === 'saved' ? (
                            <select
                              value={lead.status}
                              onChange={(e) => updateLeadStatus(lead.id, e.target.value as Lead['status'])}
                              className="rounded-md border-gray-300 text-sm"
                            >
                              <option value="New">New</option>
                              <option value="Contacted">Contacted</option>
                              <option value="Interested">Interested</option>
                              <option value="Not Interested">Not Interested</option>
                              <option value="Client">Client</option>
                            </select>
                          ) : (
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              lead.status === 'New' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {lead.status}
                            </span>
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {viewMode === 'search' ? (
                            <button
                              onClick={() => saveLead(lead)}
                              className="text-indigo-600 hover:text-indigo-900"
                              disabled={savedLeads.some(l => l.id === lead.id)}
                            >
                              {savedLeads.some(l => l.id === lead.id) ? 'Saved' : 'Save Lead'}
                            </button>
                          ) : (
                            <button className="text-indigo-600 hover:text-indigo-900">
                              Add Notes
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (viewMode === 'search' ? leads : filteredAndSortedLeads).length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            {viewMode === 'search' 
              ? 'No leads found. Try adjusting your search criteria.'
              : 'No saved leads yet. Start by searching and saving some leads!'}
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 