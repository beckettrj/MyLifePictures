/**
 * Night mode overlay component
 * Provides darker viewing for evening/night use
 */

import React from 'react';
import { motion } from 'framer-motion';

export function NightModeOverlay() {
  return (
    <motion.div
      className="absolute inset-0 bg-blue-900/20 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Blue tint overlay for night viewing */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-blue-900/30" />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20" />
    </motion.div>
  );
}