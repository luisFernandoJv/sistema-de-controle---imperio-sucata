"use client"

import React from "react"
import { Outlet, Link, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { LayoutDashboard, ArrowRightLeft, BarChart3, Settings, Package, LogOut, Menu, X } from "lucide-react"

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Painel" },
  { to: "/transacoes", icon: ArrowRightLeft, label: "Transações" },
  { to: "/estoque", icon: Package, label: "Estoque" },
  { to: "/relatorios", icon: BarChart3, label: "Relatórios" },
  { to: "/configuracoes", icon: Settings, label: "Configurações" },
]

const NavLink = ({ to, icon: Icon, label, isExpanded, onClick }) => {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link to={to} onClick={onClick}>
      <div
        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
          isActive ? "bg-blue-100 text-blue-700 shadow-sm" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        } ${!isExpanded ? "justify-center" : ""}`}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {isExpanded && <span className="font-medium">{label}</span>}
      </div>
    </Link>
  )
}

export default function DashboardLayout() {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024

      setIsMobile(mobile)

      if (mobile) {
        setIsExpanded(false)
      } else if (tablet) {
        setIsExpanded(false)
      } else {
        setIsExpanded(true)
      }
    }

    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  const handleNavClick = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false)
    }
  }

  const handleLogout = () => {
    console.log("Logout clicked")
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <motion.aside
        initial={false}
        animate={{
          width: isMobile ? (isMobileMenuOpen ? 280 : 0) : isExpanded ? 280 : 70,
          x: isMobile && !isMobileMenuOpen ? -280 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`
          flex flex-col bg-white border-r border-gray-200 shadow-lg
          ${isMobile ? "fixed left-0 top-0 h-full z-50" : "relative"}
          ${isMobile && !isMobileMenuOpen ? "overflow-hidden" : ""}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            {(isExpanded || isMobileMenuOpen) && (
              <div>
                <h1 className="text-lg font-bold text-gray-900">Império Sucata</h1>
                <p className="text-xs text-gray-500">Sistema de Gestão</p>
              </div>
            )}
          </div>

          {isMobile && isMobileMenuOpen && (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink key={item.to} {...item} isExpanded={isExpanded || isMobileMenuOpen} onClick={handleNavClick} />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 ${
              !(isExpanded || isMobileMenuOpen) ? "justify-center" : ""
            }`}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {(isExpanded || isMobileMenuOpen) && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-6 w-6 text-gray-600" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
              <Package className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Império Sucata</span>
          </div>

          {!isMobile && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
          )}
        </div>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
