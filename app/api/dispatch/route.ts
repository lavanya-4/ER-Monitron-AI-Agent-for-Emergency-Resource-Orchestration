import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const nvidia = createOpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY ?? '',
})

interface HospitalData {
  id: string
  name: string
  status: string
  availableBeds: number
  equipmentStatus: string
  coordinates: { lat: number; lng: number }
  address: string
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function POST(req: Request) {
  const { hospitals, crisisHospital }: { hospitals: HospitalData[]; crisisHospital: HospitalData } =
    await req.json()

  // Calculate distances from crisis hospital to all other hospitals
  const hospitalsWithDistance = hospitals
    .filter((h) => h.id !== crisisHospital.id && h.status === 'Stable')
    .map((h) => ({
      ...h,
      distanceMiles: calculateDistance(
        crisisHospital.coordinates.lat,
        crisisHospital.coordinates.lng,
        h.coordinates.lat,
        h.coordinates.lng
      ),
    }))
    .sort((a, b) => a.distanceMiles - b.distanceMiles)

  const prompt = `You are an emergency medical services AI coordinator for San Jose and Silicon Valley hospitals.

CRITICAL SITUATION DETECTED at ${crisisHospital.name}:
- Location: ${crisisHospital.address}
- Coordinates: ${crisisHospital.coordinates.lat}, ${crisisHospital.coordinates.lng}
- Available Beds: ${crisisHospital.availableBeds}
- Equipment Status: ${crisisHospital.equipmentStatus}

Available hospitals for patient rerouting (sorted by distance from crisis location):
${hospitalsWithDistance
  .map(
    (h) =>
      `- ${h.name} (${h.distanceMiles.toFixed(1)} miles away)
    Address: ${h.address}
    Beds: ${h.availableBeds} available
    Equipment: ${h.equipmentStatus}`
  )
  .join('\n')}

Generate an INTER-HOSPITAL DISPATCH PLAN in markdown format with:
1. **Immediate Actions** - Route ambulances to nearest facilities based on distance and capacity
2. **Patient Distribution** - Prioritize closer hospitals with available capacity
3. **Equipment Contingency** - Backup plans for offline equipment, consider equipment availability at nearby facilities
4. **Communication Protocol** - Notifications to send, include specific distances for dispatch

IMPORTANT: Consider both distance AND available bed capacity when making recommendations. Closer hospitals should be preferred when capacity allows.`

  try {
    const { text } = await generateText({
      model: nvidia('nvidia/llama-3.1-nemotron-70b-instruct'),
      prompt,
      maxOutputTokens: 1000,
      temperature: 0.7,
    })

    return Response.json({
      plan: text,
      model: 'nvidia/llama-3.1-nemotron-70b-instruct',
    })
  } catch (error) {
    // Fallback plan if API fails
    const availableHospitals = hospitals.filter(
      (h: { id: string; status: string }) => h.id !== crisisHospital.id && h.status === 'Stable'
    )
    const fallbackPlan = `# Emergency Dispatch Plan

## Immediate Actions
- **HALT** all ambulance dispatches to ${crisisHospital.name}
- **REDIRECT** incoming ambulances to nearest available facility

## Patient Distribution
${availableHospitals
  .map(
    (h: { name: string; availableBeds: number }) =>
      `- **${h.name}**: Accept overflow patients (${h.availableBeds} beds available)`
  )
  .join('\n')}

## Equipment Contingency
- Request mobile CT unit from Valley Medical Center
- Activate mutual aid agreement with Stanford Medical

## Communication Protocol
- Notify County EMS Dispatch
- Alert all ambulance units via radio channel 7
- Update hospital status board`

    return Response.json({
      plan: fallbackPlan,
      model: 'fallback-local',
    })
  }
}
