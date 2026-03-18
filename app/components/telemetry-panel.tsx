'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, Radio, Bed, Cpu, AlertTriangle, CheckCircle2, MapPin } from 'lucide-react'

interface Hospital {
  id: string
  name: string
  status: 'Critical' | 'Stable'
  availableBeds: number
  equipmentStatus: string
  lastUpdate: string
  coordinates: { lat: number; lng: number }
  address: string
}

interface TelemetryPanelProps {
  hospitals: Hospital[]
  onGeneratePulse: () => void
  isLoading: boolean
}

export function TelemetryPanel({ hospitals, onGeneratePulse, isLoading }: TelemetryPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary animate-pulse" />
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
            Live Telemetry
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-xs text-muted-foreground">LIVE</span>
        </div>
      </div>

      <div className="mb-4">
        <Button
          onClick={onGeneratePulse}
          disabled={isLoading}
          className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border font-mono text-xs uppercase tracking-wider"
        >
          <Activity className="mr-2 h-4 w-4" />
          {isLoading ? 'Processing...' : 'Generate Synthetic Pulse'}
        </Button>
      </div>

      <div className="flex-1 space-y-3 overflow-auto">
        {hospitals.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-border">
            <p className="font-mono text-xs text-muted-foreground">
              No telemetry data. Generate a pulse to begin.
            </p>
          </div>
        ) : (
          hospitals.map((hospital) => (
            <Card
              key={hospital.id}
              className={`border-l-4 ${
                hospital.status === 'Critical'
                  ? 'border-l-critical bg-critical/5'
                  : 'border-l-stable bg-stable/5'
              }`}
            >
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="font-mono text-sm font-medium">{hospital.name}</span>
                  <span
                    className={`flex items-center gap-1 rounded px-2 py-0.5 font-mono text-xs ${
                      hospital.status === 'Critical'
                        ? 'bg-critical/20 text-critical'
                        : 'bg-stable/20 text-stable'
                    }`}
                  >
                    {hospital.status === 'Critical' ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    {hospital.status}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="mb-2 flex items-start gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0 text-muted-foreground mt-0.5" />
                  <span className="font-mono text-[10px] text-muted-foreground leading-tight">
                    {hospital.address}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <Bed className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Beds:</span>
                    <span
                      className={
                        hospital.availableBeds === 0 ? 'font-bold text-critical' : 'text-foreground'
                      }
                    >
                      {hospital.availableBeds}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Cpu className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Equip:</span>
                    <span
                      className={
                        hospital.equipmentStatus.includes('Offline')
                          ? 'font-bold text-critical'
                          : 'text-stable'
                      }
                    >
                      {hospital.equipmentStatus}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-right font-mono text-[10px] text-muted-foreground">
                  Updated: {hospital.lastUpdate}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
