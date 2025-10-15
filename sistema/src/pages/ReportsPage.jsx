"use client"
import { Helmet } from "react-helmet-async"
import { motion } from "framer-motion"
import ProfessionalReports from "@/components/reports/ProfessionalReports"

export default function ReportsPage() {
  return (
    <>
      <Helmet>
        <title>Relatórios Profissionais - Império Sucata</title>
        <meta
          name="description"
          content="Sistema avançado de relatórios com dados agregados e exportação profissional."
        />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gray-50 p-4 md:p-6"
      >
        <ProfessionalReports />
      </motion.div>
    </>
  )
}
