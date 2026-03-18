'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Cpu, Search, Brain, Zap, AlertTriangle } from 'lucide-react'
import type { AgentThought } from '@/lib/agentic-tools'

interface ChainOfThoughtConsoleProps {
  thoughts: AgentThought[]
  isProcessing: boolean
}

const typeConfig: Record<AgentThought['type'], { icon: typeof Terminal; color: string; prefix: string }> = {
  PLANNING: { icon: Brain, color: 'text-info', prefix: '[PLANNING]' },
  TOOL_CALL: { icon: Search, color: 'text-warning', prefix: '[TOOL CALL]' },
  REASONING: { icon: Cpu, color: 'text-primary', prefix: '[REASONING]' },
  OPTIMIZING: { icon: Zap, color: 'text-stable', prefix: '[OPTIMIZING]' },
  ACTION: { icon: Terminal, color: 'text-stable', prefix: '[ACTION]' },
  ERROR: { icon: AlertTriangle, color: 'text-critical', prefix: '[ERROR]' },
}

export function ChainOfThoughtConsole({ thoughts, isProcessing }: ChainOfThoughtConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [thoughts])

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
            Agent Terminal
          </h3>
        </div>
        {isProcessing && (
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="flex items-center gap-1.5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-stable" />
            <span className="font-mono text-[10px] text-stable">THINKING</span>
          </motion.div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-auto rounded border border-border bg-background/80 p-2 font-mono text-[11px]"
      >
        <div className="text-muted-foreground mb-2">
          {'>'} NEMOTRON MULTI-AGENT ORCHESTRATOR v2.0
        </div>
        <div className="text-muted-foreground mb-3">
          {'>'} Initializing Chain-of-Thought reasoning engine...
        </div>

        <AnimatePresence mode="popLayout">
          {thoughts.map((thought, index) => {
            const config = typeConfig[thought.type]
            const Icon = config.icon

            return (
              <motion.div
                key={`${thought.timestamp}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-2 flex items-start gap-2"
              >
                <Icon className={`h-3 w-3 shrink-0 mt-0.5 ${config.color}`} />
                <div className="flex-1">
                  <span className={`font-bold ${config.color}`}>{config.prefix}</span>
                  <span className="text-foreground ml-1">{thought.message}</span>
                  <span className="text-muted-foreground ml-2 text-[9px]">[{thought.timestamp}]</span>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {isProcessing && (
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="flex items-center gap-2 text-muted-foreground"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            Processing...
          </motion.div>
        )}
      </div>
    </div>
  )
}
