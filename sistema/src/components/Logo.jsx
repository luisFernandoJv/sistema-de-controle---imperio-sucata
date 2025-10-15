"use client"
import { motion } from "framer-motion"
import { Recycle } from "lucide-react"

const Logo = () => {
  return (
    <motion.div
      className="flex items-center space-x-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="relative bg-gradient-to-br from-amber-500 via-yellow-400 to-orange-500 p-3 rounded-2xl shadow-xl"
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.3 }}
      >
        <Recycle className="h-8 w-8 text-white relative z-10" />
      </motion.div>

      <div>
        <motion.h1
          className="text-2xl font-extrabold bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 bg-clip-text text-transparent tracking-tight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Império Sucata
        </motion.h1>
        <motion.p
          className="text-sm font-medium bg-gradient-to-r from-slate-600 to-slate-500 bg-clip-text text-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Sistema de Gestão Inteligente
        </motion.p>
      </div>
    </motion.div>
  )
}

export default Logo
