"use client"

import { useState, useEffect } from "react"
import { Helmet } from "react-helmet-async"
import { motion, AnimatePresence } from "framer-motion"
import { DataProvider } from "./contexts/DataContext"
import Dashboard from "./components/Dashboard"
import TransactionForm from "./components/TransactionForm"
import Reports from "./components/reports/Reports"
import Inventory from "./components/Inventory"
import ExpenseForm from "./components/ExpenseForm"
import Login from "./components/Login"
import { BarChart3, Package, FileText, Menu, X, TrendingUp, DollarSign, LogOut } from "lucide-react"
import Logo from "./components/Logo"

const Button = ({ children, variant = "default", size = "default", className = "", onClick, ...props }) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  }
  const sizes = {
    default: "h-10 py-2 px-4",
    icon: "h-10 w-10",
  }

  return (
    <button className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} onClick={onClick} {...props}>
      {children}
    </button>
  )
}

const Toaster = () => <div id="toast-container" className="fixed top-4 right-4 z-50"></div>

function App() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [transactionType, setTransactionType] = useState("compra")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const authToken = localStorage.getItem("imperio_sucata_auth")
      if (authToken) {
        setIsAuthenticated(true)
      }
      setIsLoading(false)
    }

    const initializeData = () => {
      if (!localStorage.getItem("recycling_transactions")) {
        localStorage.setItem("recycling_transactions", JSON.stringify([]))
      }
      if (!localStorage.getItem("recycling_inventory")) {
        localStorage.setItem(
          "recycling_inventory",
          JSON.stringify({
            ferro: { quantidade: 0, precoCompra: 2.5, precoVenda: 3.2 },
            aluminio: { quantidade: 0, precoCompra: 8.5, precoVenda: 10.8 },
            cobre: { quantidade: 0, precoCompra: 25.0, precoVenda: 32.0 },
            latinha: { quantidade: 0, precoCompra: 4.2, precoVenda: 5.5 },
          }),
        )
      }
    }

    checkAuth()
    initializeData()
  }, [])

  const handleLogin = (credentials) => {
    if (credentials.username === "admin" && credentials.password === "imperio2025") {
      localStorage.setItem("imperio_sucata_auth", "authenticated")
      setIsAuthenticated(true)
      return true
    }
    return false
  }

  const handleLogout = () => {
    localStorage.removeItem("imperio_sucata_auth")
    setIsAuthenticated(false)
    setActiveTab("dashboard")
  }

  const handleQuickAction = (tab, type = "compra") => {
    setActiveTab(tab)
    if (tab === "transaction") {
      setTransactionType(type)
    }
    setIsMobileMenuOpen(false)
  }

  const menuItems = [
    {
      id: "dashboard",
      label: "Painel",
      icon: BarChart3,
      color: "text-blue-600",
      gradient: "from-blue-500 to-blue-600",
      description: "Visão geral do negócio",
    },
    {
      id: "transaction",
      label: "Transações",
      icon: TrendingUp,
      color: "text-green-600",
      gradient: "from-green-500 to-green-600",
      description: "Compras e vendas",
    },
    {
      id: "inventory",
      label: "Estoque",
      icon: Package,
      color: "text-purple-600",
      gradient: "from-purple-500 to-purple-600",
      description: "Controle de materiais",
    },
    {
      id: "expenses",
      label: "Despesas",
      icon: DollarSign,
      color: "text-red-600",
      gradient: "from-red-500 to-red-600",
      description: "Gastos operacionais",
    },
    {
      id: "reports",
      label: "Relatórios",
      icon: FileText,
      color: "text-orange-600",
      gradient: "from-orange-500 to-orange-600",
      description: "Análises e exportações",
    },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onQuickAction={handleQuickAction} />
      case "transaction":
        return <TransactionForm onSuccess={() => setActiveTab("dashboard")} initialType={transactionType} />
      case "inventory":
        return <Inventory />
      case "expenses":
        return <ExpenseForm onSuccess={() => setActiveTab("dashboard")} />
      case "reports":
        return <Reports />
      default:
        return <Dashboard onQuickAction={handleQuickAction} />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sistema...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <DataProvider>
      <Helmet>
        <title>Império Sucata - Sistema de Gestão Inteligente</title>
        <meta
          name="description"
          content="Sistema completo e moderno para controle de compra e venda de materiais recicláveis com sincronização em tempo real."
        />
        <meta property="og:title" content="Império Sucata - Sistema de Gestão Inteligente" />
        <meta
          property="og:description"
          content="Sistema completo e moderno para controle de compra e venda de materiais recicláveis."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-gray-100">
        <header className="bg-white/95 backdrop-blur-xl shadow-2xl border-b-4 border-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 sticky top-0 z-50 no-print">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.05 }}
                className="flex items-center"
              >
                <Logo />
              </motion.div>

              <nav className="hidden md:flex items-center space-x-2">
                {menuItems.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative group"
                    >
                      <Button
                        variant={activeTab === item.id ? "default" : "ghost"}
                        onClick={() => handleQuickAction(item.id)}
                        className={`flex items-center space-x-2 transition-all duration-300 h-12 px-5 ${
                          activeTab === item.id
                            ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg hover:shadow-xl`
                            : "hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 border border-transparent hover:border-blue-200"
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${activeTab === item.id ? "text-white" : item.color}`} />
                        <span className="font-semibold text-sm">{item.label}</span>
                      </Button>

                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {item.description}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                      </div>
                    </motion.div>
                  )
                })}

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="ml-4 text-red-600 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200 h-12 px-5 font-semibold transition-all"
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Sair
                  </Button>
                </motion.div>
              </nav>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all h-12 w-12 rounded-full"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <motion.div
                  animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                  transition={{ duration: 0.3, type: "spring" }}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-7 w-7 text-red-600" />
                  ) : (
                    <Menu className="h-7 w-7 text-blue-600" />
                  )}
                </motion.div>
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="md:hidden bg-gradient-to-br from-white via-blue-50 to-cyan-50 backdrop-blur-xl border-t-2 border-blue-200 shadow-inner"
              >
                <div className="px-4 py-4 space-y-2">
                  {menuItems.map((item, index) => {
                    const Icon = item.icon
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08, type: "spring" }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Button
                          variant={activeTab === item.id ? "default" : "ghost"}
                          onClick={() => handleQuickAction(item.id)}
                          className={`w-full justify-start text-base h-16 transition-all duration-300 ${
                            activeTab === item.id
                              ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg`
                              : "hover:bg-white hover:shadow-md border border-transparent hover:border-blue-200"
                          }`}
                        >
                          <Icon className={`h-6 w-6 mr-3 ${activeTab === item.id ? "text-white" : item.color}`} />
                          <div className="flex flex-col items-start">
                            <span className="font-semibold">{item.label}</span>
                            <span className={`text-xs ${activeTab === item.id ? "text-white/80" : "text-gray-500"}`}>
                              {item.description}
                            </span>
                          </div>
                        </Button>
                      </motion.div>
                    )
                  })}

                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: menuItems.length * 0.08, type: "spring" }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full justify-start text-base h-16 text-red-600 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200 font-semibold mt-2"
                    >
                      <LogOut className="h-6 w-6 mr-3" />
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">Sair do Sistema</span>
                        <span className="text-xs text-red-500">Encerrar sessão</span>
                      </div>
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="fade-in"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        <Toaster />
      </div>
    </DataProvider>
  )
}

export default App
