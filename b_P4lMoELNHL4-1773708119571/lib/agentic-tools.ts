// Agentic Tools for Multi-Agent Orchestrator
// These simulate real-time data that the agent must call before making decisions

// Insurance types accepted by hospitals
export type InsuranceType = 'Kaiser' | 'Blue Cross' | 'Aetna' | 'Medicare' | 'Medi-Cal' | 'United' | 'Uninsured'

// Hospital insurance network configuration
export const hospitalInsuranceNetworks: Record<string, InsuranceType[]> = {
  'regional-med': ['Blue Cross', 'Aetna', 'Medicare', 'Medi-Cal', 'United', 'Uninsured'], // Public hospital - accepts most
  'santa-clara-valley': ['Blue Cross', 'Aetna', 'Medicare', 'Medi-Cal', 'United', 'Uninsured'], // County hospital - accepts all
  'oconnor': ['Blue Cross', 'Aetna', 'Medicare', 'United'], // Private - limited Medi-Cal
  'good-sam': ['Blue Cross', 'Aetna', 'Medicare', 'Medi-Cal', 'United'], // Accepts most
  'kaiser-san-jose': ['Kaiser'], // Kaiser members only (except emergencies)
}

export interface HospitalPayload {
  hospitalId: string
  doctorCount: number  // Available doctors for immediate treatment
  surgeonOnCall: 'Available' | 'In Surgery' | 'Unavailable'
  cathLab: 'Ready' | 'In Use' | 'Offline'
  traumaBay: 'Open' | 'Occupied' | 'Offline'
  ventilators: number
  lastUpdated: string
}

export interface TrafficData {
  origin: string
  destination: string
  travelTimeMinutes: number
  trafficCondition: 'Clear' | 'Moderate' | 'Heavy' | 'Emergency Corridor'
  distanceMiles: number
  eta: string
}

export interface ClinicalRiskAssessment {
  triageLevel: number
  delayMinutes: number
  baselineMortality: number
  riskIncrease: number
  finalRiskPercentage: number
  recommendation: 'Proceed' | 'Expedite' | 'Critical - Avoid Delay'
}

export interface HospitalScore {
  hospitalId: string
  hospitalName: string
  doctorScore: number
  travelScore: number
  riskScore: number
  insuranceScore: number
  totalScore: number
  inNetwork: boolean
  breakdown: {
    doctors: number
    travelTime: number
    riskIncrease: number
    insuranceMatch: boolean
  }
}

// Simulated hospital resources - San Jose hospitals only
// doctorCount = number of doctors available for immediate treatment
const hospitalResources: Record<string, () => Omit<HospitalPayload, 'hospitalId' | 'lastUpdated'>> = {
  'regional-med': () => ({
    doctorCount: 0,  // Crisis - no doctors available
    surgeonOnCall: 'Unavailable',
    cathLab: 'Offline',
    traumaBay: 'Occupied',
    ventilators: 0,
  }),
  'santa-clara-valley': () => ({
    doctorCount: Math.floor(Math.random() * 4) + 6,  // 6-9 doctors
    surgeonOnCall: Math.random() > 0.3 ? 'Available' : 'In Surgery',
    cathLab: Math.random() > 0.2 ? 'Ready' : 'In Use',
    traumaBay: Math.random() > 0.3 ? 'Open' : 'Occupied',
    ventilators: Math.floor(Math.random() * 4) + 4,
  }),
  'oconnor': () => ({
    doctorCount: Math.floor(Math.random() * 3) + 4,  // 4-6 doctors
    surgeonOnCall: Math.random() > 0.4 ? 'Available' : 'In Surgery',
    cathLab: Math.random() > 0.3 ? 'Ready' : 'In Use',
    traumaBay: Math.random() > 0.5 ? 'Open' : 'Occupied',
    ventilators: Math.floor(Math.random() * 3) + 3,
  }),
  'good-sam': () => ({
    doctorCount: Math.floor(Math.random() * 4) + 5,  // 5-8 doctors
    surgeonOnCall: Math.random() > 0.25 ? 'Available' : 'In Surgery',
    cathLab: Math.random() > 0.2 ? 'Ready' : 'In Use',
    traumaBay: Math.random() > 0.35 ? 'Open' : 'Occupied',
    ventilators: Math.floor(Math.random() * 4) + 4,
  }),
  'kaiser-san-jose': () => ({
    doctorCount: Math.floor(Math.random() * 5) + 8,  // 8-12 doctors
    surgeonOnCall: Math.random() > 0.2 ? 'Available' : 'In Surgery',
    cathLab: Math.random() > 0.15 ? 'Ready' : 'In Use',
    traumaBay: Math.random() > 0.25 ? 'Open' : 'Occupied',
    ventilators: Math.floor(Math.random() * 5) + 5,
  }),
}

// Base distances (in miles) from Regional Medical Center to each San Jose hospital
const baseDistances: Record<string, number> = {
  'santa-clara-valley': 3.8,  // Closest to Regional Med
  'oconnor': 5.5,
  'good-sam': 6.8,
  'kaiser-san-jose': 6.2,
}

// Tool 1: Get Hospital Payload
export function getHospitalPayload(hospitalId: string): HospitalPayload {
  const now = new Date()
  const timestamp = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const resourceGenerator = hospitalResources[hospitalId]
  if (!resourceGenerator) {
    return {
      hospitalId,
      doctorCount: 0,
      surgeonOnCall: 'Unavailable',
      cathLab: 'Offline',
      traumaBay: 'Offline',
      ventilators: 0,
      lastUpdated: timestamp,
    }
  }

  return {
    hospitalId,
    ...resourceGenerator(),
    lastUpdated: timestamp,
  }
}

// Tool 2: Get Traffic Data
export function getTrafficData(origin: string, destination: string): TrafficData {
  const baseMiles = baseDistances[destination] || 10
  
  // Simulate varying traffic conditions
  const conditions: Array<{ condition: TrafficData['trafficCondition']; multiplier: number }> = [
    { condition: 'Clear', multiplier: 1 },
    { condition: 'Moderate', multiplier: 1.3 },
    { condition: 'Heavy', multiplier: 1.8 },
    { condition: 'Emergency Corridor', multiplier: 0.7 },
  ]
  
  const randomCondition = conditions[Math.floor(Math.random() * conditions.length)]
  
  // Base travel time: ~2.5 mins per mile in normal traffic
  const baseTravelTime = baseMiles * 2.5
  const actualTravelTime = Math.round(baseTravelTime * randomCondition.multiplier)
  
  const now = new Date()
  const eta = new Date(now.getTime() + actualTravelTime * 60 * 1000)
  
  return {
    origin,
    destination,
    travelTimeMinutes: actualTravelTime,
    trafficCondition: randomCondition.condition,
    distanceMiles: Math.round(baseMiles * 10) / 10,
    eta: eta.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  }
}

// Tool 3: Calculate Clinical Risk
export function calculateClinicalRisk(triageLevel: number, delayMinutes: number): ClinicalRiskAssessment {
  // Baseline mortality by triage level (1 = most critical)
  const baselineMortality: Record<number, number> = {
    1: 15, // Resuscitation
    2: 8,  // Emergency
    3: 3,  // Urgent
    4: 1,  // Less Urgent
    5: 0.1 // Non-Urgent
  }
  
  // Risk increase per minute of delay (higher for critical patients)
  const riskPerMinute: Record<number, number> = {
    1: 2.5,  // 2.5% per minute for Level 1
    2: 1.2,  // 1.2% per minute for Level 2
    3: 0.4,  // 0.4% per minute for Level 3
    4: 0.1,  // 0.1% per minute for Level 4
    5: 0.02  // 0.02% per minute for Level 5
  }
  
  const baseline = baselineMortality[triageLevel] || 5
  const ratePerMin = riskPerMinute[triageLevel] || 0.5
  const riskIncrease = Math.round((delayMinutes * ratePerMin) * 10) / 10
  const finalRisk = Math.min(baseline + riskIncrease, 100)
  
  let recommendation: ClinicalRiskAssessment['recommendation'] = 'Proceed'
  if (riskIncrease > 15) recommendation = 'Critical - Avoid Delay'
  else if (riskIncrease > 5) recommendation = 'Expedite'
  
  return {
    triageLevel,
    delayMinutes,
    baselineMortality: baseline,
    riskIncrease,
    finalRiskPercentage: Math.round(finalRisk * 10) / 10,
    recommendation,
  }
}

// Weighted Scoring Algorithm
// Score = (DoctorCount × 50) - (TravelTime × 15) - (ClinicalRisk × 20) + InsuranceBonus
// Doctor availability weighted higher for immediate treatment capacity
// Insurance adds bonus for in-network, but NEVER blocks emergency care
export function calculateHospitalScore(
  hospitalId: string,
  hospitalName: string,
  payload: HospitalPayload,
  traffic: TrafficData,
  risk: ClinicalRiskAssessment,
  patientInsurance?: InsuranceType
): HospitalScore {
  const doctorScore = payload.doctorCount * 50  // Doctors weighted at 50 points each
  const travelScore = traffic.travelTimeMinutes * 15
  const riskScore = risk.riskIncrease * 20
  
  // Check insurance network match
  const acceptedInsurance = hospitalInsuranceNetworks[hospitalId] || []
  const inNetwork = patientInsurance ? acceptedInsurance.includes(patientInsurance) : true
  
  // Insurance scoring: +100 for in-network, 0 for out-of-network
  // NOTE: In emergency situations (Triage 1-2), insurance should NOT be a deciding factor
  // This is a soft preference, not a hard requirement
  let insuranceScore = 0
  if (inNetwork) {
    insuranceScore = 100 // Bonus for in-network
  } else if (patientInsurance === 'Uninsured') {
    // Uninsured patients prefer county/public hospitals
    if (hospitalId === 'santa-clara-valley' || hospitalId === 'regional-med') {
      insuranceScore = 50 // Partial bonus for safety-net hospitals
    }
  }
  
  // Bonus modifiers for resource availability
  let resourceBonus = 0
  if (payload.surgeonOnCall === 'Available') resourceBonus += 60
  if (payload.cathLab === 'Ready') resourceBonus += 40
  if (payload.traumaBay === 'Open') resourceBonus += 20
  
  const totalScore = doctorScore - travelScore - riskScore + resourceBonus + insuranceScore
  
  return {
    hospitalId,
    hospitalName,
    doctorScore,
    travelScore,
    riskScore,
    insuranceScore,
    inNetwork,
    totalScore: Math.round(totalScore * 10) / 10,
    breakdown: {
      doctors: payload.doctorCount,
      travelTime: traffic.travelTimeMinutes,
      riskIncrease: risk.riskIncrease,
      insuranceMatch: inNetwork,
    },
  }
}

export interface AgentThought {
  timestamp: string
  type: 'PLANNING' | 'TOOL_CALL' | 'REASONING' | 'OPTIMIZING' | 'ACTION' | 'ERROR'
  message: string
  data?: Record<string, unknown>
}

export function createThought(
  type: AgentThought['type'],
  message: string,
  data?: Record<string, unknown>
): AgentThought {
  const now = new Date()
  return {
    timestamp: now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
    type,
    message,
    data,
  }
}
