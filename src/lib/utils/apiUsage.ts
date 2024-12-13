import { incrementAPIUsage, getAPIUsageStats } from './apiUsageStore'

interface APIUsage {
  daily: {
    date: string;
    count: number;
  };
  total: number;
}

export function trackAPICall() {
  return incrementAPIUsage()
}

export function getAPIUsage(): APIUsage {
  return getAPIUsageStats()
}

export function estimateCosts(usage: APIUsage) {
  const PRICING = {
    search: 17, // $17 per 1000 requests
    details: 17, // $17 per 1000 requests
    geocoding: 5, // $5 per 1000 requests
    monthlyCredit: 200 // $200 free credit
  }

  // Assuming an even mix of search, details, and geocoding requests
  const avgCostPer1000 = (PRICING.search + PRICING.details + PRICING.geocoding) / 3

  // Calculate costs
  const dailyCost = (usage.daily.count / 1000) * avgCostPer1000
  const totalCost = (usage.total / 1000) * avgCostPer1000

  // Calculate remaining credit (resets monthly)
  const remainingCredit = PRICING.monthlyCredit - totalCost

  return {
    dailyCost,
    totalCost,
    remainingCredit: Math.max(0, remainingCredit),
    isWithinFreeQuota: totalCost < PRICING.monthlyCredit
  }
} 