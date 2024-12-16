'use client'

import { useState, useEffect, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { PlusIcon, ClipboardIcon, CheckIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import axios from 'axios'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  createdAt: string
  updatedAt: string
}

interface TemplateFormData {
  id?: string
  name: string
  subject: string
  body: string
}

interface PreviewData {
  business_name: string
  contact_name: string
  business_type: string
  location: string
  your_name: string
  [key: string]: string
}

export default function OutreachPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    subject: '',
    body: ''
  })
  const [previewData, setPreviewData] = useState<PreviewData>({
    business_name: 'Acme Photography',
    contact_name: 'John Smith',
    business_type: 'event',
    location: 'San Francisco',
    your_name: 'Your Name'
  })
  const [showCopied, setShowCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await axios.get('/api/templates')
      setTemplates(response.data)
    } catch (error) {
      console.error('Error loading templates:', error)
      setError('Failed to load templates')
    }
  }

  const fillTemplate = (template: string) => {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return previewData[key] || match
    })
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleEditTemplate = (template?: EmailTemplate) => {
    if (template) {
      setFormData({
        id: template.id,
        name: template.name,
        subject: template.subject,
        body: template.body
      })
    } else {
      setFormData({
        name: '',
        subject: '',
        body: ''
      })
    }
    setIsEditModalOpen(true)
  }

  const handleSaveTemplate = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      if (!formData.name || !formData.subject || !formData.body) {
        setError('All fields are required')
        return
      }

      const response = await axios({
        method: formData.id ? 'put' : 'post',
        url: '/api/templates',
        data: formData
      })

      if (formData.id) {
        setTemplates(prev => prev.map(t => t.id === formData.id ? response.data : t))
        if (selectedTemplate?.id === formData.id) {
          setSelectedTemplate(response.data)
        }
      } else {
        setTemplates(prev => [...prev, response.data])
      }

      setIsEditModalOpen(false)
      setError(null)
    } catch (error) {
      console.error('Error saving template:', error)
      setError('Failed to save template')
    }
  }

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      await axios.delete(`/api/templates?id=${id}`)
      setTemplates(prev => prev.filter(t => t.id !== id))
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null)
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      setError('Failed to delete template')
    }
  }

  const handleEditClick = (e: React.MouseEvent, template: EmailTemplate) => {
    e.stopPropagation()
    handleEditTemplate(template)
  }

  const recordOutreach = async (leadId: string, templateId: string, emailContent: string) => {
    try {
      await axios.post('/api/outreach', {
        leadId,
        templateId,
        emailContent
      })
      // You could add some UI feedback here
    } catch (error) {
      console.error('Error recording outreach:', error)
      setError('Failed to record outreach')
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Email Outreach</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create and manage your email templates and track your outreach efforts.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => handleEditTemplate()}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="inline-block h-5 w-5 mr-2" />
            New Template
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Template List */}
        <div className="lg:col-span-1">
          <div className="overflow-hidden bg-white shadow sm:rounded-md">
            <ul role="list" className="divide-y divide-gray-200">
              {templates.map((template) => (
                <li key={template.id}>
                  <div className="flex items-center px-4 py-4 sm:px-6">
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => setSelectedTemplate(template)}
                        className="block w-full text-left"
                      >
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-medium text-indigo-600">
                            {template.name}
                          </p>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 truncate">
                            {template.subject}
                          </p>
                        </div>
                      </button>
                    </div>
                    <div className="ml-4 flex flex-shrink-0 gap-2">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-400 hover:text-red-500"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Template Preview/Editor */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <div className="overflow-hidden bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {selectedTemplate.name}
                  </h3>
                  <button
                    onClick={() => copyToClipboard(fillTemplate(selectedTemplate.body))}
                    className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    {showCopied ? (
                      <>
                        <CheckIcon className="h-5 w-5 mr-2 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <ClipboardIcon className="h-5 w-5 mr-2" />
                        Copy to Clipboard
                      </>
                    )}
                  </button>
                </div>

                {/* Preview Data Fields */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {Object.entries(previewData).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setPreviewData(prev => ({
                          ...prev,
                          [key]: e.target.value
                        }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  ))}
                </div>

                {/* Subject Preview */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Subject Preview
                  </label>
                  <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-700 sm:text-sm">
                    {fillTemplate(selectedTemplate.subject)}
                  </div>
                </div>

                {/* Body Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email Body Preview
                  </label>
                  <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-700 sm:text-sm whitespace-pre-wrap">
                    {fillTemplate(selectedTemplate.body)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="mt-1 text-sm text-gray-500">
                Select a template to preview or edit
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Template Modal */}
      <Transition.Root show={isEditModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setIsEditModalOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => setIsEditModalOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                        {formData.id ? 'Edit Template' : 'New Template'}
                      </Dialog.Title>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Template Name
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Subject Line
                          </label>
                          <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Email Body
                          </label>
                          <textarea
                            rows={8}
                            value={formData.body}
                            onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                          <p className="mt-2 text-sm text-gray-500">
                            Use {'{{'} variable_name {'}}'}  for dynamic content. Available variables: business_name, contact_name, business_type, location, your_name
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                      onClick={handleSaveTemplate}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={() => setIsEditModalOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  )
} 