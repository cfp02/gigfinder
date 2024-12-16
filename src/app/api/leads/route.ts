import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Get all saved leads
export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json(leads)
  } catch (error) {
    console.error('Error getting leads:', error)
    return NextResponse.json(
      { error: 'Failed to get leads' },
      { status: 500 }
    )
  }
}

// Save a new lead
export async function POST(request: Request) {
  try {
    const lead = await request.json()
    
    // Validate required fields
    if (!lead.id || !lead.name || !lead.type || !lead.address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if lead already exists
    const existingLead = await prisma.lead.findUnique({
      where: { id: lead.id }
    })

    if (existingLead) {
      return NextResponse.json(
        { error: 'Lead already exists' },
        { status: 409 }
      )
    }

    const savedLead = await prisma.lead.create({
      data: {
        id: lead.id,
        name: lead.name,
        type: lead.type,
        address: lead.address,
        phone: lead.phone || null,
        website: lead.website || null,
        rating: lead.rating || null,
        status: 'New',
        notes: null,
        lastContact: null
      }
    })

    return NextResponse.json(savedLead)
  } catch (error) {
    console.error('Error saving lead:', error)
    return NextResponse.json(
      { error: 'Failed to save lead' },
      { status: 500 }
    )
  }
}

// Update a lead's status and notes
export async function PUT(request: Request) {
  try {
    const { id, status, notes } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
        lastContact: status === 'Contacted' ? new Date() : undefined
      }
    })

    return NextResponse.json(updatedLead)
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    )
  }
} 