import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface TemplateData {
  id?: string
  name: string
  subject: string
  body: string
}

// Get all templates
export async function GET() {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: {
        updatedAt: 'desc'
      }
    })
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error getting templates:', error)
    return NextResponse.json(
      { error: 'Failed to get templates' },
      { status: 500 }
    )
  }
}

// Create new template
export async function POST(request: Request) {
  try {
    const data = await request.json() as TemplateData
    
    // Validate required fields
    if (!data.name || !data.subject || !data.body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name: data.name,
        subject: data.subject,
        body: data.body
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}

// Update template
export async function PUT(request: Request) {
  try {
    const data = await request.json() as TemplateData
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const template = await prisma.emailTemplate.update({
      where: { id: data.id },
      data: {
        name: data.name,
        subject: data.subject,
        body: data.body,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

// Delete template
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    await prisma.emailTemplate.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
} 