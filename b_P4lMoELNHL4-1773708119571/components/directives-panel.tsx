'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, FileText, Ambulance, CheckCircle, Siren } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface DirectivesPanelProps {
  crisisDetected: boolean
  dispatchPlan: string | null
  onConfirmReroute: () => void
  isConfirmed: boolean
}

export function DirectivesPanel({
  crisisDetected,
  dispatchPlan,
  onConfirmReroute,
  isConfirmed,
}: DirectivesPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-warning" />
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
            Active Directives
          </h2>
        </div>
        {crisisDetected && (
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="flex items-center gap-1 rounded bg-critical/20 px-1.5 py-0.5 font-mono text-[10px] text-critical"
          >
            <Siren className="h-3 w-3" />
            CRISIS
          </motion.span>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {!crisisDetected && !dispatchPlan ? (
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border">
            <p className="font-mono text-[10px] text-muted-foreground text-center">
              No active directives.<br />System nominal.
            </p>
          </div>
        ) : crisisDetected && !dispatchPlan ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-critical bg-critical/10">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="flex items-center gap-2 font-mono text-xs text-critical">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  CRISIS DETECTED
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="font-mono text-[10px] text-muted-foreground">
                  Running weighted scoring algorithm...
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <Card className="border-warning/50 bg-warning/5">
              <CardHeader className="pb-1 pt-2">
                <CardTitle className="flex items-center gap-2 font-mono text-[10px] text-warning">
                  <Siren className="h-3 w-3" />
                  DISPATCH DIRECTIVE
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="prose prose-invert max-w-none font-mono text-[10px] leading-relaxed">
                  <ReactMarkdown
                    components={{
                      h2: ({ children }) => (
                        <h2 className="mb-1.5 mt-2 text-[11px] font-bold text-foreground border-b border-border pb-1">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="mb-1 mt-2 text-[10px] font-bold text-primary">{children}</h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-1.5 text-muted-foreground leading-relaxed">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="mb-1.5 list-none space-y-0.5 text-muted-foreground">{children}</ul>
                      ),
                      li: ({ children }) => (
                        <li className="flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{children}</span>
                        </li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold text-foreground">{children}</strong>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-1.5 list-decimal pl-3 space-y-0.5 text-muted-foreground">{children}</ol>
                      ),
                    }}
                  >
                    {dispatchPlan || ''}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            <div className="border-t border-border pt-3">
              <div className="mb-2 flex items-center gap-2 font-mono text-[9px] text-muted-foreground">
                <Ambulance className="h-3 w-3" />
                HUMAN-IN-THE-LOOP REQUIRED
              </div>
              <Button
                onClick={onConfirmReroute}
                disabled={isConfirmed}
                size="sm"
                className={`w-full font-mono text-[10px] uppercase tracking-wider ${
                  isConfirmed
                    ? 'bg-stable text-primary-foreground'
                    : 'bg-critical hover:bg-critical/80 text-destructive-foreground'
                }`}
              >
                {isConfirmed ? (
                  <>
                    <CheckCircle className="mr-1.5 h-3 w-3" />
                    DISPATCH CONFIRMED
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-1.5 h-3 w-3" />
                    CONFIRM REROUTE
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
