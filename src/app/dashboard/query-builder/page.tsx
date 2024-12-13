'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { BusinessType, DEFAULT_BUSINESS_TYPES } from '@/lib/constants/businessTypes'

export default function QueryBuilderPage() {
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([])
  const [newType, setNewType] = useState<BusinessType>({ id: '', name: '', query: '' })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load business types from local storage or use defaults
  useEffect(() => {
    try {
      const stored = localStorage.getItem('businessTypes')
      if (stored) {
        const parsedTypes = JSON.parse(stored)
        // Validate that the stored data is an array and has the expected structure
        if (Array.isArray(parsedTypes) && parsedTypes.length > 0 && 
            parsedTypes.every(type => type.id && type.name && type.query)) {
          setBusinessTypes(parsedTypes)
          return
        }
      }
      // If we get here, either there was no stored data, or it was invalid
      setBusinessTypes(DEFAULT_BUSINESS_TYPES)
      localStorage.setItem('businessTypes', JSON.stringify(DEFAULT_BUSINESS_TYPES))
    } catch (error) {
      console.error('Error loading business types:', error)
      setBusinessTypes(DEFAULT_BUSINESS_TYPES)
      localStorage.setItem('businessTypes', JSON.stringify(DEFAULT_BUSINESS_TYPES))
    }
  }, [])

  // Save changes to local storage
  const saveChanges = () => {
    try {
      localStorage.setItem('businessTypes', JSON.stringify(businessTypes))
      setSuccess('Changes saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      setError('Failed to save changes')
    }
  }

  // Add new business type
  const addBusinessType = () => {
    if (!newType.name || !newType.query) {
      setError('Name and query are required')
      return
    }

    const id = newType.name.toLowerCase().replace(/[^a-z0-9]/g, '_')
    setBusinessTypes(prev => [...prev, { ...newType, id }])
    setNewType({ id: '', name: '', query: '' })
    saveChanges()
  }

  // Update existing business type
  const updateBusinessType = (index: number, field: keyof BusinessType, value: string) => {
    const updated = [...businessTypes]
    updated[index] = { ...updated[index], [field]: value }
    setBusinessTypes(updated)
  }

  // Delete business type
  const deleteBusinessType = (index: number) => {
    setBusinessTypes(prev => prev.filter((_, i) => i !== index))
    saveChanges()
  }

  // Test a query
  const testQuery = async (query: string) => {
    try {
      const response = await fetch('/api/places/search?' + new URLSearchParams({
        query,
        location: 'test location',
        maxResults: '5'
      }))
      const data = await response.json()
      return `Found ${data.length} results`
    } catch (error) {
      return 'Error testing query'
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Query Builder</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage and customize business type queries for searches and bulk imports.
          </p>
        </div>
      </div>

      {/* Add new business type */}
      <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Business Type Name</label>
          <input
            type="text"
            value={newType.name}
            onChange={(e) => setNewType(prev => ({ ...prev, name: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="e.g., Bookstores"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Search Query</label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="text"
              value={newType.query}
              onChange={(e) => setNewType(prev => ({ ...prev, query: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., bookstore book shop independent bookstore"
            />
            <button
              type="button"
              onClick={addBusinessType}
              className="ml-3 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Error/Success messages */}
      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-md bg-green-50 p-4">
          <div className="text-sm text-green-700">{success}</div>
        </div>
      )}

      {/* List of existing business types */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Business Type
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Search Query
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {businessTypes.map((type, index) => (
                    <tr key={type.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        <input
                          type="text"
                          value={type.name}
                          onChange={(e) => updateBusinessType(index, 'name', e.target.value)}
                          className="block w-full border-0 p-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <input
                          type="text"
                          value={type.query}
                          onChange={(e) => updateBusinessType(index, 'query', e.target.value)}
                          className="block w-full border-0 p-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                        />
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          type="button"
                          onClick={() => deleteBusinessType(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Save Changes Button */}
      <div className="mt-6 flex justify-end gap-4">
        <button
          type="button"
          onClick={() => {
            setBusinessTypes(DEFAULT_BUSINESS_TYPES)
            localStorage.setItem('businessTypes', JSON.stringify(DEFAULT_BUSINESS_TYPES))
            setSuccess('Reset to default business types!')
            setTimeout(() => setSuccess(null), 3000)
          }}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Reset to Defaults
        </button>
        <button
          type="button"
          onClick={saveChanges}
          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  )
} 