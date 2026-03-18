'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Send, 
  Lock, 
  CheckCircle2, 
  Activity,
  Stethoscope,
  ClipboardList,
  Target
} from 'lucide-react'
import type { HospitalPayload, HospitalScore } from '@/lib/agentic-tools'

interface PatientData {
  id: string
  condition: string
  triageLevel: number
  vitals: { hr: number; bp: string; spo2: number }
}

interface HospitalBriefingProps {
  isGenerating: boolean
  patient: PatientData | null
  selectedHospital?: {
    name: string
    address: string
    payload: HospitalPayload
    score: HospitalScore
    eta: string
    travelTime: number
  }
  onTransmit: () => void
  isTransmitted: boolean
}

interface SOAPNote {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

export function HospitalBriefing({
  isGenerating,
  patient,
  selectedHospital,
  onTransmit,
  isTransmitted,
}: HospitalBriefingProps) {
  const [displayedText, setDisplayedText] = useState<Partial<SOAPNote>>({})
  const [currentSection, setCurrentSection] = useState<keyof SOAPNote | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Get clinical context based on condition
  const getClinicalContext = (condition: string) => {
    const conditionLower = condition.toLowerCase()
    if (conditionLower.includes('stemi') || conditionLower.includes('chest pain') || conditionLower.includes('angina')) {
      return {
        symptoms: 'acute onset chest pain radiating to left arm, diaphoresis, and shortness of breath',
        findings: '12-lead ECG shows ST changes consistent with cardiac ischemia. Patient alert and oriented x3',
        intervention: 'Prep Cath Lab for potential percutaneous coronary intervention (PCI). Cardiology team notified.',
      }
    }
    if (conditionLower.includes('stroke') || conditionLower.includes('lvo')) {
      return {
        symptoms: 'sudden onset facial droop, arm weakness, and speech difficulty. FAST positive',
        findings: 'NIH Stroke Scale assessment in progress. CT head ordered for hemorrhage exclusion',
        intervention: 'Activate stroke protocol. Neurology team on standby. Consider tPA if within window.',
      }
    }
    if (conditionLower.includes('trauma') || conditionLower.includes('mva')) {
      return {
        symptoms: 'multiple trauma from motor vehicle accident. Patient reports chest and abdominal pain',
        findings: 'FAST exam positive. C-spine immobilized. GCS 14. Multiple abrasions noted',
        intervention: 'Trauma team activation. Prepare OR for potential surgical intervention. Blood bank notified.',
      }
    }
    if (conditionLower.includes('respiratory') || conditionLower.includes('copd')) {
      return {
        symptoms: 'progressive dyspnea, productive cough, and wheezing over past 3 days',
        findings: 'Decreased breath sounds bilaterally. Using accessory muscles. Tripod positioning',
        intervention: 'Continue bronchodilator therapy. Prepare for potential BiPAP. Pulmonology consult.',
      }
    }
    if (conditionLower.includes('diabetic') || conditionLower.includes('dka')) {
      return {
        symptoms: 'polyuria, polydipsia, nausea, and altered mental status over past 24 hours',
        findings: 'Blood glucose >400 mg/dL. Kussmaul respirations noted. Fruity breath odor',
        intervention: 'Initiate DKA protocol. IV fluids and insulin drip. Monitor potassium closely.',
      }
    }
    // Default for other conditions
    return {
      symptoms: `presenting symptoms consistent with ${condition.toLowerCase()}`,
      findings: 'Physical examination findings documented. Appropriate diagnostic workup initiated',
      intervention: 'Appropriate specialty consultation arranged. Continue supportive care.',
    }
  }

  // Generate SOAP note content
  const soapNote: SOAPNote = selectedHospital && patient
    ? (() => {
        const context = getClinicalContext(patient.condition)
        return {
          subjective: `Patient ${patient.id} transported via ambulance with chief complaint of ${patient.condition.toLowerCase()}. Patient reports ${context.symptoms}. Symptoms began prior to EMS arrival.`,
          objective: `Vitals: HR ${patient.vitals.hr} bpm, BP ${patient.vitals.bp} mmHg, SpO2 ${patient.vitals.spo2}% on room air. ${context.findings}.`,
          assessment: `Triage Level ${patient.triageLevel} - ${patient.condition}. ${patient.triageLevel <= 2 ? 'High-risk presentation requiring emergent intervention.' : patient.triageLevel === 3 ? 'Urgent condition requiring timely care.' : 'Stable condition for routine evaluation.'} AI confidence: ${(90 + Math.random() * 8).toFixed(1)}%`,
          plan: `DIVERT to ${selectedHospital.name} (ETA: ${selectedHospital.eta}). ${context.intervention} Surgeon status: ${selectedHospital.payload.surgeonOnCall}. Cath Lab: ${selectedHospital.payload.cathLab}.`,
        }
      })()
    : {
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
      }

  // Typing effect
  useEffect(() => {
    if (!isGenerating || !selectedHospital || !patient) {
      return
    }

    setDisplayedText({})
    setIsComplete(false)

    const sections: (keyof SOAPNote)[] = ['subjective', 'objective', 'assessment', 'plan']
    let sectionIndex = 0
    let charIndex = 0

    const typeNextChar = () => {
      if (sectionIndex >= sections.length) {
        setIsComplete(true)
        setCurrentSection(null)
        return
      }

      const currentSectionKey = sections[sectionIndex]
      const fullText = soapNote[currentSectionKey]

      if (charIndex === 0) {
        setCurrentSection(currentSectionKey)
      }

      if (charIndex < fullText.length) {
        setDisplayedText((prev) => ({
          ...prev,
          [currentSectionKey]: fullText.slice(0, charIndex + 1),
        }))
        charIndex++
        setTimeout(typeNextChar, 8 + Math.random() * 12) // Variable typing speed
      } else {
        sectionIndex++
        charIndex = 0
        setTimeout(typeNextChar, 300) // Pause between sections
      }
    }

    const startDelay = setTimeout(typeNextChar, 500)
    return () => clearTimeout(startDelay)
  }, [isGenerating, selectedHospital, patient])

  // Auto-scroll to bottom during typing
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [displayedText])

  const sectionIcons = {
    subjective: Stethoscope,
    objective: Activity,
    assessment: ClipboardList,
    plan: Target,
  }

  const sectionLabels = {
    subjective: 'SUBJECTIVE',
    objective: 'OBJECTIVE',
    assessment: 'ASSESSMENT',
    plan: 'PLAN',
  }

  return (
    <Card className="flex h-full flex-col border-info/30 bg-card/80 backdrop-blur">
      <CardHeader className="shrink-0 pb-2 pt-3 border-b border-border">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-info">
            <FileText className="h-4 w-4" />
            HOSPITAL BRIEFING
          </div>
          {isGenerating && !isComplete && (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="font-mono text-[9px] text-primary"
            >
              GENERATING SOAP NOTE
            </motion.span>
          )}
          {isComplete && (
            <span className="font-mono text-[9px] text-stable">
              DOCUMENTATION COMPLETE
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col overflow-hidden p-3">
        {!selectedHospital ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="font-mono text-[10px] text-muted-foreground text-center">
              Awaiting triage decision...<br />
              SOAP note will generate automatically
            </p>
          </div>
        ) : (
          <>
            <div
              ref={containerRef}
              className="flex-1 overflow-auto space-y-3 pr-1"
            >
              {(['subjective', 'objective', 'assessment', 'plan'] as const).map((section) => {
                const Icon = sectionIcons[section]
                const text = displayedText[section]
                const isActive = currentSection === section

                if (!text && !isActive) return null

                return (
                  <motion.div
                    key={section}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className={`h-3 w-3 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`font-mono text-[9px] font-bold tracking-wider ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {sectionLabels[section]}
                      </span>
                      {isActive && (
                        <motion.span
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                          className="text-primary"
                        >
                          |
                        </motion.span>
                      )}
                    </div>
                    <p className="font-mono text-[10px] text-foreground/90 leading-relaxed pl-4 border-l border-border">
                      {text}
                      {isActive && (
                        <motion.span
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                          className="text-primary ml-0.5"
                        >
                          _
                        </motion.span>
                      )}
                    </p>
                  </motion.div>
                )
              })}
            </div>

            <AnimatePresence>
              {isComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="shrink-0 border-t border-border pt-3 mt-3"
                >
                  <Button
                    onClick={onTransmit}
                    disabled={isTransmitted}
                    size="sm"
                    className={`w-full font-mono text-[10px] uppercase tracking-wider ${
                      isTransmitted
                        ? 'bg-stable/20 text-stable border border-stable/30'
                        : 'bg-info hover:bg-info/80 text-info-foreground'
                    }`}
                  >
                    {isTransmitted ? (
                      <>
                        <CheckCircle2 className="mr-1.5 h-3 w-3" />
                        DATA ENCRYPTED & SENT
                      </>
                    ) : (
                      <>
                        <Send className="mr-1.5 h-3 w-3" />
                        TRANSMIT TO RECEIVING FACILITY
                        <Lock className="ml-1.5 h-2.5 w-2.5 opacity-50" />
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </CardContent>
    </Card>
  )
}
