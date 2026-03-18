import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const nvidia = createOpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY ?? '',
})

export async function POST(req: Request) {
  const { hospitals } = await req.json()

  const prompt = `Analyze the following hospital telemetry data and determine if there is a CRISIS situation.
A CRISIS is defined as: any hospital with 0 available beds OR critical equipment offline.

Hospital Data:
${JSON.stringify(hospitals, null, 2)}

Respond with ONLY one word: "CRISIS" if a crisis is detected, or "STABLE" if all hospitals are operational.`

  try {
    const { text } = await generateText({
      model: nvidia('nvidia/nemotron-3-nano'),
      prompt,
      maxOutputTokens: 10,
      temperature: 0.1,
    })

    return Response.json({
      status: text.trim().toUpperCase().includes('CRISIS') ? 'CRISIS' : 'STABLE',
      model: 'nvidia/nemotron-3-nano',
    })
  } catch (error) {
    // Fallback: analyze locally if API fails
    const hasCrisis = hospitals.some(
      (h: { availableBeds: number; equipmentStatus: string }) =>
        h.availableBeds === 0 || h.equipmentStatus.toLowerCase().includes('offline')
    )
    return Response.json({
      status: hasCrisis ? 'CRISIS' : 'STABLE',
      model: 'fallback-local',
    })
  }
}
