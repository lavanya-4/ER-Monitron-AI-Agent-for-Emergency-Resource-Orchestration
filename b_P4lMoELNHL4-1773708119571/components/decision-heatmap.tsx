'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Clock, AlertTriangle, Trophy, CreditCard } from 'lucide-react'
import type { HospitalScore } from '@/lib/agentic-tools'

interface DecisionHeatmapProps {
  scores: HospitalScore[]
  selectedHospitalId?: string
}

export function DecisionHeatmap({ scores, selectedHospitalId }: DecisionHeatmapProps) {
  if (scores.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded border border-dashed border-border">
        <p className="font-mono text-xs text-muted-foreground">
          Awaiting hospital scoring analysis...
        </p>
      </div>
    )
  }

  // Sort by score descending
  const sortedScores = [...scores].sort((a, b) => b.totalScore - a.totalScore)
  const maxScore = Math.max(...scores.map((s) => s.totalScore))
  const minScore = Math.min(...scores.map((s) => s.totalScore))
  const scoreRange = maxScore - minScore || 1

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
          Decision Heatmap
        </h3>
        <span className="font-mono text-[10px] text-muted-foreground">
          Score = Docs - Travel - Risk + Insurance
        </span>
      </div>

      <div className="space-y-2">
        {sortedScores.map((score, index) => {
          const isSelected = score.hospitalId === selectedHospitalId
          const isWinner = index === 0
          const normalizedScore = (score.totalScore - minScore) / scoreRange
          
          // Color based on score position
          const getBarColor = () => {
            if (isWinner) return 'bg-stable'
            if (normalizedScore > 0.6) return 'bg-info'
            if (normalizedScore > 0.3) return 'bg-warning'
            return 'bg-critical'
          }

          return (
            <motion.div
              key={score.hospitalId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded border p-2 ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : isWinner
                  ? 'border-stable/50 bg-stable/5'
                  : 'border-border bg-card/50'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isWinner && (
                    <Trophy className="h-3.5 w-3.5 text-stable" />
                  )}
                  <span className="font-mono text-xs font-bold text-foreground">
                    {score.hospitalName}
                  </span>
                </div>
                <span
                  className={`font-mono text-sm font-bold ${
                    isWinner ? 'text-stable' : normalizedScore > 0.5 ? 'text-info' : 'text-warning'
                  }`}
                >
                  {score.totalScore.toFixed(1)}
                </span>
              </div>

              {/* Score bar */}
              <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(normalizedScore * 100, 5)}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`h-full rounded-full ${getBarColor()}`}
                />
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-4 gap-1.5 font-mono text-[8px]">
                <div className="flex items-center gap-0.5">
                  <TrendingUp className="h-2 w-2 text-stable" />
                  <span className="text-muted-foreground">Docs:</span>
                  <span className="text-stable">+{score.doctorScore}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <Clock className="h-2 w-2 text-warning" />
                  <span className="text-muted-foreground">Travel:</span>
                  <span className="text-critical">-{score.travelScore}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <AlertTriangle className="h-2 w-2 text-critical" />
                  <span className="text-muted-foreground">Risk:</span>
                  <span className="text-critical">-{score.riskScore.toFixed(0)}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <CreditCard className="h-2 w-2 text-info" />
                  <span className="text-muted-foreground">Ins:</span>
                  <span className={score.inNetwork ? 'text-stable' : 'text-muted-foreground'}>
                    {score.inNetwork ? `+${score.insuranceScore}` : 'OUT'}
                  </span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-center gap-4 font-mono text-[9px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-stable" />
          <span>Optimal</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-info" />
          <span>Good</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-warning" />
          <span>Suboptimal</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-critical" />
          <span>Avoid</span>
        </div>
      </div>
    </div>
  )
}
