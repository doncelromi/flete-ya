import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

/** Subtle entrance (opacity + translate, never `transform`). */
export function Enter({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, translate: '0px 10px' }}
      animate={{ opacity: 1, translate: '0px 0px' }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
