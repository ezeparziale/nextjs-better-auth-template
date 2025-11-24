"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"

export function AnimatedBackground() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isDark = theme === "dark"

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="bg-background absolute inset-0"
      />

      {/* Gradient Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className={`absolute -top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full blur-[100px] ${
          isDark ? "bg-primary/20" : "bg-primary/30"
        }`}
      />

      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, -60, 0],
          x: [0, -30, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
          delay: 2,
        }}
        className={`absolute top-[40%] -right-[10%] h-[400px] w-[400px] rounded-full blur-[100px] ${
          isDark ? "bg-purple-500/20" : "bg-purple-500/30"
        }`}
      />

      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 45, 0],
          x: [0, 50, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
          delay: 5,
        }}
        className={`absolute -bottom-[20%] left-[20%] h-[600px] w-[600px] rounded-full blur-[100px] ${
          isDark ? "bg-blue-500/20" : "bg-blue-500/30"
        }`}
      />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] mask-[linear-gradient(180deg,white,rgba(255,255,255,0))] bg-size-[14px_24px]" />
    </div>
  )
}
