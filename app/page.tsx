'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ResourceMatrix } from '@/components/resource-matrix'
import { ChainOfThoughtConsole } from '@/components/chain-of-thought-console'
import { DecisionHeatmap } from '@/components/decision-heatmap'
import { DirectivesPanel } from '@/components/directives-panel'
import { HospitalBriefing } from '@/components/hospital-briefing'
import { NeuralLinkVertical } from '@/components/neural-link'
import { GeospatialMap } from '@/components/geospatial-map'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { Activity, Shield, Clock, Radio, Cpu, Zap, Brain, Map } from 'lucide-react'
import {
  getHospitalPayload,
  getTrafficData,
  calculateClinicalRisk,
  calculateHospitalScore,
  createThought,
  hospitalInsuranceNetworks,
  type AgentThought,
  type HospitalPayload,
  type HospitalScore,
  type InsuranceType,
} from '@/lib/agentic-tools'

interface Hospital {
  id: string
  name: string
  status: 'Critical' | 'Stable'
  availableDoctors: number
  equipmentStatus: string
  lastUpdate: string
  coordinates: { lat: number; lng: number }
  address: string
}

// Patient pool with varied conditions and severity levels
interface Patient {
  id: string
  condition: string
  triageLevel: 1 | 2 | 3 | 4 | 5
  vitals: { hr: number; bp: string; spo2: number }
  insurance: InsuranceType
}

const patientPool: Patient[] = [
  // Critical - Triage Level 1 (Immediate life-threatening)
  {
    id: 'AMB-2847',
    condition: 'Suspected STEMI',
    triageLevel: 1,
    vitals: { hr: 142, bp: '85/50', spo2: 91 },
    insurance: 'Kaiser',
  },
  {
    id: 'AMB-3102',
    condition: 'Severe Trauma - MVA',
    triageLevel: 1,
    vitals: { hr: 128, bp: '78/45', spo2: 88 },
    insurance: 'Blue Cross',
  },
  {
    id: 'AMB-2955',
    condition: 'Acute Stroke - LVO',
    triageLevel: 1,
    vitals: { hr: 98, bp: '185/110', spo2: 94 },
    insurance: 'Medicare',
  },
  // Emergent - Triage Level 2 (High risk, time-sensitive)
  {
    id: 'AMB-3044',
    condition: 'Chest Pain - Unstable Angina',
    triageLevel: 2,
    vitals: { hr: 108, bp: '145/90', spo2: 95 },
    insurance: 'Aetna',
  },
  {
    id: 'AMB-2899',
    condition: 'Respiratory Distress - COPD Exacerbation',
    triageLevel: 2,
    vitals: { hr: 112, bp: '138/88', spo2: 89 },
    insurance: 'Medi-Cal',
  },
  {
    id: 'AMB-3178',
    condition: 'Diabetic Ketoacidosis',
    triageLevel: 2,
    vitals: { hr: 118, bp: '95/60', spo2: 96 },
    insurance: 'United',
  },
  // Urgent - Triage Level 3 (Requires timely care)
  {
    id: 'AMB-3221',
    condition: 'Abdominal Pain - Appendicitis',
    triageLevel: 3,
    vitals: { hr: 96, bp: '125/80', spo2: 98 },
    insurance: 'Kaiser',
  },
  {
    id: 'AMB-3087',
    condition: 'Fracture - Closed Femur',
    triageLevel: 3,
    vitals: { hr: 102, bp: '130/85', spo2: 97 },
    insurance: 'Blue Cross',
  },
  {
    id: 'AMB-3156',
    condition: 'Severe Migraine with Aura',
    triageLevel: 3,
    vitals: { hr: 88, bp: '142/92', spo2: 99 },
    insurance: 'Uninsured',
  },
  // Less Urgent - Triage Level 4 (Can wait 1-2 hours)
  {
    id: 'AMB-3290',
    condition: 'Laceration - Requires Sutures',
    triageLevel: 4,
    vitals: { hr: 78, bp: '120/75', spo2: 99 },
    insurance: 'Medicare',
  },
  {
    id: 'AMB-3312',
    condition: 'UTI with Fever',
    triageLevel: 4,
    vitals: { hr: 92, bp: '118/72', spo2: 98 },
    insurance: 'Medi-Cal',
  },
  // Non-Urgent - Triage Level 5 (Can wait longer)
  {
    id: 'AMB-3345',
    condition: 'Minor Sprain - Ankle',
    triageLevel: 5,
    vitals: { hr: 72, bp: '115/70', spo2: 99 },
    insurance: 'Aetna',
  },
]

// Helper to get triage level description
function getTriageDescription(level: number): string {
  switch (level) {
    case 1: return 'CRITICAL - Immediate'
    case 2: return 'EMERGENT - High Risk'
    case 3: return 'URGENT - Timely Care'
    case 4: return 'LESS URGENT - Can Wait'
    case 5: return 'NON-URGENT - Minor'
    default: return 'Unknown'
  }
}

export default function ERMonitronDashboard() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [payloads, setPayloads] = useState<Record<string, HospitalPayload>>({})
  const [thoughts, setThoughts] = useState<AgentThought[]>([])
  const [scores, setScores] = useState<HospitalScore[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [crisisDetected, setCrisisDetected] = useState(false)
  const [dispatchPlan, setDispatchPlan] = useState<string | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | undefined>()
  const [divertedHospitalId, setDivertedHospitalId] = useState<string | undefined>()
  const [showDivertReason, setShowDivertReason] = useState(false)
  const [isGeneratingSOAP, setIsGeneratingSOAP] = useState(false)
  const [isTransmitted, setIsTransmitted] = useState(false)
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null)
  const [selectedHospitalData, setSelectedHospitalData] = useState<{
    name: string
    address: string
    payload: HospitalPayload
    score: HospitalScore
    eta: string
    travelTime: number
  } | undefined>()

  // Geospatial map state
  const [initialRouteHospital, setInitialRouteHospital] = useState<string | undefined>()
  const [divertedRouteHospital, setDivertedRouteHospital] = useState<string | undefined>()
  const [showGpsUpdate, setShowGpsUpdate] = useState(false)
  const [routeData, setRouteData] = useState<Record<string, {
    hospitalId: string
    travelTime: number
    waitTime: number
    totalTime: number
    trafficCondition: 'Clear' | 'Moderate' | 'Gridlock'
  }>>({})
  
  // Ambulance starting position (near downtown San Jose)
  const ambulancePosition = { lat: 37.3352, lng: -121.8811 }
  
  // Date string state - initialized client-side only to avoid hydration mismatch
  const [currentDate, setCurrentDate] = useState<string>('')
  
  useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    )
  }, [])

  const addThought = useCallback((thought: AgentThought) => {
    setThoughts((prev) => [...prev, thought])
  }, [])

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const runAgentOrchestration = useCallback(async () => {
    setIsProcessing(true)
    setIsScanning(true)
    setCrisisDetected(false)
    setDispatchPlan(null)
    setIsConfirmed(false)
    setThoughts([])
    setScores([])
    setPayloads({})
    setSelectedHospitalId(undefined)
    setDivertedHospitalId(undefined)
    setShowDivertReason(false)
    setIsGeneratingSOAP(false)
    setIsTransmitted(false)
    setCurrentPatient(null)
    setSelectedHospitalData(undefined)
    setInitialRouteHospital(undefined)
    setDivertedRouteHospital(undefined)
    setShowGpsUpdate(false)
    setRouteData({})

    const now = new Date()
    const timestamp = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

    // Initialize hospital data - San Jose hospitals only
    // Regional Medical Center near SJSU (crisis), Santa Clara Valley Medical optimal
    const syntheticHospitals: Hospital[] = [
      {
        id: 'regional-med',
        name: 'Regional Medical Center',
        status: 'Critical',
        availableDoctors: 0,
        equipmentStatus: 'CT Offline',
        lastUpdate: timestamp,
        coordinates: { lat: 37.3382, lng: -121.8863 }, // Near downtown SJ
        address: '225 N Jackson Ave, San Jose, CA 95116',
      },
      {
        id: 'santa-clara-valley',
        name: 'Santa Clara Valley Medical',
        status: 'Stable',
        availableDoctors: 8,
        equipmentStatus: 'All Online',
        lastUpdate: timestamp,
        coordinates: { lat: 37.3131, lng: -121.9353 }, // Valley Med
        address: '751 S Bascom Ave, San Jose, CA 95128',
      },
      {
        id: 'oconnor',
        name: "O'Connor Hospital",
        status: 'Stable',
        availableDoctors: 5,
        equipmentStatus: 'All Online',
        lastUpdate: timestamp,
        coordinates: { lat: 37.2571, lng: -121.9306 },
        address: '2105 Forest Ave, San Jose, CA 95128',
      },
      {
        id: 'good-sam',
        name: 'Good Samaritan Hospital',
        status: 'Stable',
        availableDoctors: 6,
        equipmentStatus: 'All Online',
        lastUpdate: timestamp,
        coordinates: { lat: 37.2477, lng: -121.9464 },
        address: '2425 Samaritan Dr, San Jose, CA 95124',
      },
      {
        id: 'kaiser-san-jose',
        name: 'Kaiser San Jose',
        status: 'Stable',
        availableDoctors: 10,
        equipmentStatus: 'All Online',
        lastUpdate: timestamp,
        coordinates: { lat: 37.2506, lng: -121.8625 },
        address: '250 Hospital Pkwy, San Jose, CA 95119',
      },
    ]

    setHospitals(syntheticHospitals)

    // ===== AGENT CHAIN-OF-THOUGHT BEGINS =====

    // Step 0: Select random patient from pool
    const selectedPatient = patientPool[Math.floor(Math.random() * patientPool.length)]
    setCurrentPatient(selectedPatient)

    // Step 1: Planning - Ingest vitals
    addThought(createThought('PLANNING', `INCOMING: ${selectedPatient.condition} | ${getTriageDescription(selectedPatient.triageLevel)}`))
    await delay(800)

    addThought(createThought('PLANNING', `Patient ${selectedPatient.id}: HR ${selectedPatient.vitals.hr}, BP ${selectedPatient.vitals.bp}, SpO2 ${selectedPatient.vitals.spo2}% | Insurance: ${selectedPatient.insurance}`))
    await delay(600)

    // Step 2: Tool calls - Fetch hospital payloads
    addThought(createThought('TOOL_CALL', 'Invoking getHospitalPayload() for all facilities...'))
    await delay(500)

    const hospitalPayloads: Record<string, HospitalPayload> = {}
    for (const hospital of syntheticHospitals) {
      const payload = getHospitalPayload(hospital.id)
      hospitalPayloads[hospital.id] = payload
      setPayloads((prev) => ({ ...prev, [hospital.id]: payload }))
      await delay(200)
    }

    setIsScanning(false)

    // Check for crisis
    const crisisHospital = syntheticHospitals.find((h) => h.status === 'Critical')
    
    // Set initial route to crisis hospital (this will be diverted)
    if (crisisHospital) {
      setInitialRouteHospital(crisisHospital.id)
      setRouteData((prev) => ({
        ...prev,
        [crisisHospital.id]: {
          hospitalId: crisisHospital.id,
          travelTime: 8,
          waitTime: 45, // Long wait due to capacity issues
          totalTime: 53,
          trafficCondition: 'Gridlock',
        },
      }))
    }
    
    if (crisisHospital) {
      setCrisisDetected(true)
      setDivertedHospitalId(crisisHospital.id)
      
      addThought(createThought('ERROR', `CRISIS at ${crisisHospital.name}: Doctors=${hospitalPayloads[crisisHospital.id]?.doctorCount}, CathLab=${hospitalPayloads[crisisHospital.id]?.cathLab}`))
      await delay(600)

      // Show divert reason briefly
      setShowDivertReason(true)
      await delay(2000)
      setShowDivertReason(false)
    }

    // Step 3: Traffic data for alternate hospitals
    addThought(createThought('TOOL_CALL', `Invoking getTrafficData() for ${syntheticHospitals.length - 1} alternate facilities...`))
    await delay(500)

    const alternateHospitals = syntheticHospitals.filter((h) => h.status === 'Stable')
    const trafficDataMap: Record<string, ReturnType<typeof getTrafficData>> = {}

    for (const hospital of alternateHospitals) {
      const traffic = getTrafficData('sj-regional', hospital.id)
      trafficDataMap[hospital.id] = traffic
      addThought(createThought('TOOL_CALL', `→ ${hospital.name}: ${traffic.travelTimeMinutes}min (${traffic.trafficCondition})`))
      await delay(300)
    }

    // Step 4: Clinical risk calculation
    addThought(createThought('TOOL_CALL', 'Invoking calculateClinicalRisk() for diversion scenarios...'))
    await delay(400)

    const hospitalScores: HospitalScore[] = []
    for (const hospital of alternateHospitals) {
      const payload = hospitalPayloads[hospital.id]
      const traffic = trafficDataMap[hospital.id]
      const risk = calculateClinicalRisk(selectedPatient.triageLevel, traffic.travelTimeMinutes)

      const score = calculateHospitalScore(hospital.id, hospital.name, payload, traffic, risk, selectedPatient.insurance)
      hospitalScores.push(score)

      const networkStatus = score.inNetwork ? 'IN-NET' : 'OUT-NET'
      addThought(createThought('OPTIMIZING', `${hospital.name}: Score=${score.totalScore.toFixed(1)} [Docs:+${score.doctorScore} Travel:-${score.travelScore} Risk:-${score.riskScore.toFixed(0)} Ins:${networkStatus}${score.insuranceScore > 0 ? `+${score.insuranceScore}` : ''}]`))
      await delay(400)
    }

    setScores(hospitalScores)

    // Step 5: Final decision
    const sortedScores = [...hospitalScores].sort((a, b) => b.totalScore - a.totalScore)
    const optimalHospital = sortedScores[0]
    const runnerUp = sortedScores[1]

    setSelectedHospitalId(optimalHospital.hospitalId)

    // Set diverted route on the map and add route data
    const optimalTrafficData = trafficDataMap[optimalHospital.hospitalId]
    setRouteData((prev) => ({
      ...prev,
      [optimalHospital.hospitalId]: {
        hospitalId: optimalHospital.hospitalId,
        travelTime: optimalTrafficData.travelTimeMinutes,
        waitTime: 5, // Short wait at optimal facility
        totalTime: optimalTrafficData.travelTimeMinutes + 5,
        trafficCondition: 'Clear',
      },
    }))
    setDivertedRouteHospital(optimalHospital.hospitalId)
    
    // Show GPS update notification
    setShowGpsUpdate(true)
    setTimeout(() => setShowGpsUpdate(false), 3000)

    addThought(createThought('REASONING', `Comparing: ${optimalHospital.hospitalName} (${optimalHospital.totalScore.toFixed(1)}) vs ${runnerUp?.hospitalName} (${runnerUp?.totalScore.toFixed(1)})`))
    await delay(500)

    addThought(createThought('REASONING', `${runnerUp?.hospitalName} rejected: ${runnerUp?.breakdown.travelTime}min travel increases mortality by ${runnerUp?.breakdown.riskIncrease}%`))
    await delay(500)

    // Step 6: Execute action
    addThought(createThought('ACTION', `DECISION: Divert to ${optimalHospital.hospitalName}. Initiating pre-arrival protocol.`))
    await delay(400)

    // Prepare data for Hospital Briefing
    const optimalPayload = hospitalPayloads[optimalHospital.hospitalId]
    const optimalTraffic = trafficDataMap[optimalHospital.hospitalId]
    const selectedHospitalInfo = alternateHospitals.find((h) => h.id === optimalHospital.hospitalId)

    setSelectedHospitalData({
      name: optimalHospital.hospitalName,
      address: selectedHospitalInfo?.address || '',
      payload: optimalPayload,
      score: optimalHospital,
      eta: optimalTraffic.eta,
      travelTime: optimalTraffic.travelTimeMinutes,
    })

    // Generate dispatch plan
    const plan = `## Dispatch: ${optimalHospital.hospitalName}

### Patient ${selectedPatient.id}
- **Dx:** ${selectedPatient.condition} (${getTriageDescription(selectedPatient.triageLevel)})
- **Vitals:** HR ${selectedPatient.vitals.hr} | BP ${selectedPatient.vitals.bp} | SpO2 ${selectedPatient.vitals.spo2}%

### Destination
- **ETA:** ${optimalTraffic.eta} (${optimalTraffic.travelTimeMinutes}min)
- **Score:** ${optimalHospital.totalScore.toFixed(1)}

### Resources Confirmed
- Doctors: ${optimalPayload?.doctorCount} | Surgeon: ${optimalPayload?.surgeonOnCall} | Cath: ${optimalPayload?.cathLab}

### Pre-Arrival Orders
1. Cardiology team alerted
2. Cath Lab prep initiated
3. Blood bank standby for T&S`

    setDispatchPlan(plan)
    
    // Start SOAP note generation
    addThought(createThought('ACTION', 'Documentation Agent triggered. Generating SOAP note for handoff...'))
    setIsGeneratingSOAP(true)
    
    setIsProcessing(false)
  }, [addThought])

  const handleConfirmReroute = useCallback(() => {
    setIsConfirmed(true)
    addThought(createThought('ACTION', 'Human-in-the-loop confirmation received. Dispatch locked.'))
    toast.success('Ambulance Dispatch Confirmed', {
      description: `Rerouting to ${scores.sort((a, b) => b.totalScore - a.totalScore)[0]?.hospitalName}`,
    })
  }, [addThought, scores])

  const handleTransmit = useCallback(() => {
    setIsTransmitted(true)
    addThought(createThought('ACTION', 'SOAP note encrypted and transmitted to receiving facility.'))
    toast.success('Data Encrypted & Sent', {
      description: `Clinical briefing transmitted to ${selectedHospitalData?.name}`,
      icon: '🔒',
    })
  }, [addThought, selectedHospitalData])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card/50 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: isProcessing ? 360 : 0 }}
              transition={{ duration: 2, repeat: isProcessing ? Infinity : 0, ease: 'linear' }}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"
            >
              <Cpu className="h-5 w-5 text-primary" />
            </motion.div>
            <div>
              <h1 className="font-mono text-base font-bold tracking-tight text-foreground">
                ER-MONITRON
              </h1>
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Multi-Agent Orchestrator v2.0 • San Jose EMS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Button
                onClick={runAgentOrchestration}
                disabled={isProcessing}
                size="sm"
                className="bg-primary hover:bg-primary/80 text-primary-foreground font-mono text-xs uppercase tracking-wider"
              >
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                {isProcessing ? 'Processing...' : 'Initiate Pulse'}
              </Button>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>NVIDIA NIM</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{currentDate}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard - Three Columns */}
      <main className="flex flex-1 gap-3 overflow-hidden p-3">
        {/* Left Panel - Resource Matrix */}
        <section className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-card p-3">
          <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
            <Radio className="h-4 w-4 text-primary animate-pulse" />
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
              Live Telemetry
            </h2>
          </div>
          <div className="flex-1 overflow-auto">
            <ResourceMatrix
              hospitals={hospitals}
              payloads={payloads}
              isScanning={isScanning}
              selectedHospital={selectedHospitalId}
              divertedHospital={divertedHospitalId}
              showDivertReason={showDivertReason}
            />
          </div>
        </section>

        {/* Center Panel - Agent Console + Hospital Briefing */}
        <section className="flex flex-1 flex-col gap-2 overflow-hidden">
          {/* Chain of Thought Console - Clinical Brain */}
          <div className="flex-1 rounded-lg border border-border bg-card p-3 overflow-hidden">
            <div className="mb-2 flex items-center gap-2 border-b border-border pb-2">
              <Brain className="h-4 w-4 text-primary" />
              <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                Clinical Brain
              </h2>
              {isProcessing && (
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="ml-auto font-mono text-[9px] text-primary"
                >
                  REASONING
                </motion.span>
              )}
            </div>
            <div className="h-[calc(100%-2rem)] overflow-hidden">
              <ChainOfThoughtConsole thoughts={thoughts} isProcessing={isProcessing} />
            </div>
          </div>

          {/* Neural Link Animation */}
          <NeuralLinkVertical isActive={isGeneratingSOAP} />

          {/* Hospital Briefing - SOAP Note */}
          <div className="h-72 shrink-0 rounded-lg border border-info/30 bg-card overflow-hidden">
            <HospitalBriefing
              isGenerating={isGeneratingSOAP}
              patient={currentPatient}
              selectedHospital={selectedHospitalData}
              onTransmit={handleTransmit}
              isTransmitted={isTransmitted}
            />
          </div>

          {/* Decision Heatmap */}
          <div className="h-40 shrink-0 rounded-lg border border-border bg-card p-3 overflow-auto">
            <DecisionHeatmap scores={scores} selectedHospitalId={selectedHospitalId} />
          </div>
        </section>

        {/* Right Panel - Map + Directives */}
        <section className="w-80 shrink-0 flex flex-col gap-2">
          {/* Geospatial Map */}
          <div className="flex-1 rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Map className="h-4 w-4 text-info" />
              <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                Live Routing
              </h2>
              {isProcessing && (
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="ml-auto font-mono text-[9px] text-info"
                >
                  TRACKING
                </motion.span>
              )}
            </div>
            <div className="h-[calc(100%-2.5rem)]">
              <GeospatialMap
                hospitals={hospitals}
                ambulancePosition={ambulancePosition}
                initialRoute={initialRouteHospital}
                divertedRoute={divertedRouteHospital}
                routeData={routeData}
                isCalculating={isProcessing}
                showGpsUpdate={showGpsUpdate}
              />
            </div>
          </div>

        {/* Directives Panel */}
          <div className="h-64 shrink-0 rounded-lg border border-border bg-card p-3">
            <DirectivesPanel
              crisisDetected={crisisDetected}
              dispatchPlan={dispatchPlan}
              onConfirmReroute={handleConfirmReroute}
              isConfirmed={isConfirmed}
            />
          </div>
        </section>
      </main>

      {/* Footer Status Bar */}
      <footer className="shrink-0 border-t border-border bg-card/50 px-4 py-1.5">
        <div className="flex items-center justify-between font-mono text-[9px] text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              SYSTEM:{' '}
              <span className={isProcessing ? 'text-warning' : 'text-stable'}>
                {isProcessing ? 'ACTIVE' : 'STANDBY'}
              </span>
            </span>
            <span>PATIENT: {currentPatient?.id ?? '---'}</span>
            <span>TRIAGE: {currentPatient ? `LEVEL ${currentPatient.triageLevel}` : '---'}</span>
            <span>INSURANCE: {currentPatient?.insurance ?? '---'}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>AGENTS: TRIAGE + DOCUMENTATION</span>
            <span>ALGORITHM: WEIGHTED SCORE (50-15-20+INS)</span>
            <span>
              STATUS: <span className="text-stable">OPERATIONAL</span>
            </span>
          </div>
        </div>
      </footer>

      <Toaster richColors position="bottom-right" />
    </div>
  )
}
