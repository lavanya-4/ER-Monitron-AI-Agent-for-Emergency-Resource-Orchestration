'use client'

import { motion } from 'framer-motion'

interface NeuralLinkProps {
  isActive: boolean
  direction?: 'horizontal' | 'vertical'
}

export function NeuralLink({ isActive, direction = 'horizontal' }: NeuralLinkProps) {
  if (!isActive) return null

  const isHorizontal = direction === 'horizontal'

  return (
    <div
      className={`relative ${isHorizontal ? 'h-8 w-full' : 'w-8 h-full'} flex items-center justify-center overflow-hidden`}
    >
      {/* Base line */}
      <div
        className={`absolute ${
          isHorizontal ? 'h-[2px] w-full' : 'w-[2px] h-full'
        } bg-gradient-to-${isHorizontal ? 'r' : 'b'} from-transparent via-primary/20 to-transparent`}
      />

      {/* Animated pulse line */}
      <motion.div
        initial={isHorizontal ? { x: '-100%', opacity: 0 } : { y: '-100%', opacity: 0 }}
        animate={
          isHorizontal
            ? { x: ['−100%', '100%'], opacity: [0, 1, 1, 0] }
            : { y: ['-100%', '100%'], opacity: [0, 1, 1, 0] }
        }
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`absolute ${
          isHorizontal ? 'h-[3px] w-16' : 'w-[3px] h-16'
        } rounded-full bg-gradient-to-${isHorizontal ? 'r' : 'b'} from-transparent via-primary to-transparent shadow-[0_0_10px_var(--primary)]`}
      />

      {/* Glow dots */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.2,
            delay: i * 0.3,
            repeat: Infinity,
          }}
          className="absolute h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]"
          style={
            isHorizontal
              ? { left: `${20 + i * 30}%` }
              : { top: `${20 + i * 30}%` }
          }
        />
      ))}

      {/* Connection nodes at ends */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1, repeat: Infinity }}
        className={`absolute ${isHorizontal ? 'left-0' : 'top-0'} h-3 w-3 rounded-full border border-primary/50 bg-primary/20`}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
        className={`absolute ${isHorizontal ? 'right-0' : 'bottom-0'} h-3 w-3 rounded-full border border-primary/50 bg-primary/20`}
      />
    </div>
  )
}

// Vertical connector for column layouts
export function NeuralLinkVertical({ isActive }: { isActive: boolean }) {
  if (!isActive) return null

  return (
    <div className="relative w-full h-6 flex items-center justify-center overflow-hidden">
      {/* Base line */}
      <div className="absolute h-full w-[2px] bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20" />

      {/* Animated pulse */}
      <motion.div
        initial={{ y: '-100%', opacity: 0 }}
        animate={{ y: ['−100%', '200%'], opacity: [0, 1, 1, 0] }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute w-[3px] h-4 rounded-full bg-gradient-to-b from-transparent via-primary to-transparent shadow-[0_0_8px_var(--primary)]"
      />

      {/* Center node */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="absolute h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]"
      />
    </div>
  )
}
