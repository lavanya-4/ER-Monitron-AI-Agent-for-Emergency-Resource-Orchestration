'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Stethoscope, User, HeartPulse, Wind, MapPin, X } from 'lucide-react'
import type { HospitalPayload } from '@/lib/agentic-tools'

interface Hospital {
  id: string
  name: string
  status: 'Critical' | 'Stable'
  address: string
  coordinates: { lat: number; lng: number }
}

interface ResourceMatrixProps {
  hospitals: Hospital[]
  payloads: Record<string, HospitalPayload>
  isScanning: boolean
  selectedHospital?: string
  divertedHospital?: string
  showDivertReason?: boolean
}

function StatusCell({ 
  status, 
  label 
}: { 
  status: 'OK' | 'WARN' | 'CRIT' | 'OFF'
  label: string 
}) {
  const colors = {
    OK: 'bg-stable/20 text-stable border-stable/30',
    WARN: 'bg-warning/20 text-warning border-warning/30',
    CRIT: 'bg-critical/20 text-critical border-critical/30',
    OFF: 'bg-muted text-muted-foreground border-border',
  }

  return (
    <div className={`rounded border px-1.5 py-0.5 text-center font-mono text-[9px] font-bold ${colors[status]}`}>
      {label}
    </div>
  )
}

export function ResourceMatrix({ 
  hospitals, 
  payloads, 
  isScanning, 
  selectedHospital,
  divertedHospital,
  showDivertReason = false,
}: ResourceMatrixProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
          Live Resource Matrix
        </h3>
        {isScanning && (
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="font-mono text-[10px] text-info"
          >
            SCANNING
          </motion.span>
        )}
      </div>

      <div className="space-y-1.5">
        {hospitals.map((hospital, index) => {
          const payload = payloads[hospital.id]
          const isSelected = selectedHospital === hospital.id
          const isCritical = hospital.status === 'Critical'
          const isDiverted = divertedHospital === hospital.id && showDivertReason

          // Determine divert reasons for the diverted hospital
          const divertReasons: string[] = []
          if (isDiverted && payload) {
            if (payload.doctorCount === 0) divertReasons.push('Doctors: None Available')
            if (payload.surgeonOnCall === 'Unavailable') divertReasons.push('Surgeon: Unavailable')
            if (payload.cathLab === 'Offline') divertReasons.push('Cath Lab: Offline')
            if (payload.traumaBay === 'Offline') divertReasons.push('Trauma Bay: Offline')
          }

          return (
            <motion.div
              key={hospital.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded border p-2 ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : isDiverted
                  ? 'border-critical bg-critical/10'
                  : isCritical
                  ? 'border-critical/50 bg-critical/5'
                  : 'border-border bg-card/50'
              }`}
            >
              {/* Scanning overlay effect */}
              {isScanning && (
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{
                    duration: 1.5,
                    delay: index * 0.2,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
                />
              )}

              <div className="relative">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-foreground truncate pr-2">
                    {hospital.name}
                  </span>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[8px] font-bold ${
                      isCritical ? 'bg-critical/20 text-critical' : 'bg-stable/20 text-stable'
                    }`}
                  >
                    {hospital.status.toUpperCase()}
                  </span>
                </div>

                <div className="mb-1.5 flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-2.5 w-2.5" />
                  <span className="font-mono text-[8px] truncate">{hospital.address}</span>
                </div>

                {payload ? (
                  <div className="grid grid-cols-4 gap-1">
                    <div className="flex flex-col items-center gap-0.5">
                      <Stethoscope className="h-3 w-3 text-muted-foreground" />
                      <StatusCell
                        status={payload.doctorCount === 0 ? 'CRIT' : payload.doctorCount < 4 ? 'WARN' : 'OK'}
                        label={`${payload.doctorCount}`}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <StatusCell
                        status={
                          payload.surgeonOnCall === 'Available'
                            ? 'OK'
                            : payload.surgeonOnCall === 'In Surgery'
                            ? 'WARN'
                            : 'CRIT'
                        }
                        label={payload.surgeonOnCall === 'Available' ? 'OK' : payload.surgeonOnCall === 'In Surgery' ? 'BUSY' : 'OFF'}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <HeartPulse className="h-3 w-3 text-muted-foreground" />
                      <StatusCell
                        status={
                          payload.cathLab === 'Ready'
                            ? 'OK'
                            : payload.cathLab === 'In Use'
                            ? 'WARN'
                            : 'OFF'
                        }
                        label={payload.cathLab === 'Ready' ? 'RDY' : payload.cathLab === 'In Use' ? 'USE' : 'OFF'}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <Wind className="h-3 w-3 text-muted-foreground" />
                      <StatusCell
                        status={payload.ventilators === 0 ? 'CRIT' : payload.ventilators < 3 ? 'WARN' : 'OK'}
                        label={`${payload.ventilators}`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-1">
                    {[Stethoscope, User, HeartPulse, Wind].map((Icon, i) => (
                      <div key={i} className="flex flex-col items-center gap-0.5">
                        <Icon className="h-3 w-3 text-muted-foreground" />
                        <StatusCell status="OFF" label="--" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-1.5 flex items-center justify-between font-mono text-[8px] text-muted-foreground">
                  <span>Doc | Surg | Cath | Vent</span>
                  {payload && <span>Updated: {payload.lastUpdated}</span>}
                </div>

                {/* Divert Reason Overlay */}
                <AnimatePresence>
                  {isDiverted && divertReasons.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute inset-0 rounded bg-critical/90 backdrop-blur-sm flex flex-col items-center justify-center p-2"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ duration: 0.3 }}
                        className="mb-2"
                      >
                        <X className="h-6 w-6 text-destructive-foreground" strokeWidth={3} />
                      </motion.div>
                      <span className="font-mono text-[9px] font-bold text-destructive-foreground mb-1">
                        DIVERT REASON
                      </span>
                      <div className="space-y-0.5 text-center">
                        {divertReasons.map((reason, i) => (
                          <motion.p
                            key={reason}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                            className="font-mono text-[8px] text-destructive-foreground/90"
                          >
                            {reason}
                          </motion.p>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
