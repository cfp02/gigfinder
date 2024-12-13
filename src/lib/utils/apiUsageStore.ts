import { prisma } from '../db'

export async function incrementAPIUsage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    // Get or create today's usage record
    const usage = await prisma.aPIUsage.upsert({
      where: {
        date: today,
      },
      update: {
        count: {
          increment: 1
        }
      },
      create: {
        date: today,
        count: 1
      }
    })

    // Get total usage
    const total = await prisma.aPIUsage.aggregate({
      _sum: {
        count: true
      }
    })

    return {
      daily: {
        date: today.toISOString().split('T')[0],
        count: usage.count
      },
      total: total._sum.count || 0
    }
  } catch (error) {
    console.error('Error incrementing API usage:', error)
    return {
      daily: {
        date: today.toISOString().split('T')[0],
        count: 0
      },
      total: 0
    }
  }
}

export async function getAPIUsageStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    // Get today's usage
    const usage = await prisma.aPIUsage.findUnique({
      where: {
        date: today
      }
    })

    // Get total usage
    const total = await prisma.aPIUsage.aggregate({
      _sum: {
        count: true
      }
    })

    return {
      daily: {
        date: today.toISOString().split('T')[0],
        count: usage?.count || 0
      },
      total: total._sum.count || 0
    }
  } catch (error) {
    console.error('Error getting API usage stats:', error)
    return {
      daily: {
        date: today.toISOString().split('T')[0],
        count: 0
      },
      total: 0
    }
  }
}

// For testing/debugging
export async function resetAPIUsage() {
  try {
    await prisma.aPIUsage.deleteMany()
  } catch (error) {
    console.error('Error resetting API usage:', error)
  }
} 