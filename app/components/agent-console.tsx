'use client'

import { useEffect, useState } from 'react'
import { Brain, Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react'

interface AgentStep {
  id: number
  label: string
  status: 'pending' | 'running' | 'complete' | 'error'
  model?: string
}

interface AgentConsoleProps {
  steps: AgentStep[]
  currentStep: number
  isProcessing: boolean
}

export function AgentConsole({ steps, currentStep, isProcessing }: AgentConsoleProps) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    if (!isProcessing) {
      setDots('')
      return
    }

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'))
    }, 400)

    return () => clearInterval(interval)
  }, [isProcessing])

  const getStepIcon = (step: AgentStep) => {
    switch (step.status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-stable" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-critical" />
      default:
        return <div className="h-4 w-4 rounded-full border border-muted-foreground" />
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-info" />
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
            Agent Logic Console
          </h2>
        </div>
        {isProcessing && (
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-warning animate-pulse" />
            <span className="font-mono text-xs text-warning">PROCESSING</span>
          </div>
        )}
      </div>

      <div className="flex-1 rounded-md border border-border bg-background/50 p-4">
        <div className="font-mono text-xs">
          <div className="mb-4 text-muted-foreground">
            {'>'} NEMOTRON AI AGENT INITIALIZED
          </div>

          {steps.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground">
                Awaiting telemetry data...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-start gap-3 ${
                    step.status === 'pending' ? 'opacity-50' : ''
                  }`}
                >
                  <div className="mt-0.5">{getStepIcon(step)}</div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-muted-foreground">Step {index + 1}:</span>
                      <span
                        className={
                          step.status === 'running'
                            ? 'text-primary'
                            : step.status === 'complete'
                            ? 'text-stable'
                            : step.status === 'error'
                            ? 'text-critical'
                            : 'text-foreground'
                        }
                      >
                        {step.label}
                        {step.status === 'running' && dots}
                      </span>
                    </div>
                    {step.model && step.status !== 'pending' && (
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        Model: {step.model}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isProcessing && steps.length > 0 && steps.every((s) => s.status === 'complete') && (
            <div className="mt-4 border-t border-border pt-4 text-stable">
              {'>'} ANALYSIS COMPLETE - DIRECTIVES GENERATED
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
