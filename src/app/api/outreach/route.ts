import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface OutreachData {
  id?: string
  leadId: string
  templateId?: string
  emailContent: string
  status?: string
  response?: string
}

// Get outreach history for a lead
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    
    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      )
    }

    const history = await prisma.outreachHistory.findMany({
      where: { leadId },
      include: {
        template: true,
        lead: true
      },
      orderBy: {
        sentAt: 'desc'
      }
    })

    return NextResponse.json(history)
  } catch (error) {
    console.error('Error getting outreach history:', error)
    return NextResponse.json(
      { error: 'Failed to get outreach history' },
      { status: 500 }
    )
  }
}

// Record new outreach
export async function POST(request: Request) {
  try {
    const data = await request.json() as OutreachData
    
    // Validate required fields
    if (!data.leadId || !data.emailContent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const outreach = await prisma.outreachHistory.create({
      data: {
        leadId: data.leadId,
        templateId: data.templateId,
        emailContent: data.emailContent,
        status: 'Sent'
      }
    })

    // Update lead's lastContact and status
    await prisma.lead.update({
      where: { id: data.leadId },
      data: {
        lastContact: new Date(),
        status: 'Contacted'
      }
    })

    return NextResponse.json(outreach)
  } catch (error) {
    console.error('Error recording outreach:', error)
    return NextResponse.json(
      { error: 'Failed to record outreach' },
      { status: 500 }
    )
  }
}

// Update outreach status/response
export async function PUT(request: Request) {
  try {
    const data = await request.json() as OutreachData
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'Outreach ID is required' },
        { status: 400 }
      )
    }

    const outreach = await prisma.outreachHistory.update({
      where: { id: data.id },
      data: {
        status: data.status,
        response: data.response,
        updatedAt: new Date()
      }
    })

    // If lead responded, update their status
    if (data.status === 'Responded') {
      await prisma.lead.update({
        where: { id: outreach.leadId },
        data: {
          status: 'Interested'
        }
      })
    }

    return NextResponse.json(outreach)
  } catch (error) {
    console.error('Error updating outreach:', error)
    return NextResponse.json(
      { error: 'Failed to update outreach' },
      { status: 500 }
    )
  }
} 