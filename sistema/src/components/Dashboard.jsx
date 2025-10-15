"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useData } from "../contexts/DataContext"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Package,
  Activity,
  Eye,
  AlertTriangle,
  Wifi,
  WifiOff,
  RefreshCw,
  XCircle,
  CalculatorIcon,
  Sparkles,
  Zap,
  TrendingUpIcon,
  Clock,
} from "lucide-react"
import Calculator from "./Calculator" // Importando componente da calculadora

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>{children}</div>
)

const Button = ({ children, onClick, disabled = false, variant = "default", size = "default", className = "" }) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"

  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
  }

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-sm",
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

const Badge = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    outline: "border border-gray-300 text-gray-700",
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("pt-BR")
}

const Dashboard = ({ onQuickAction }) => {
  const [stats, setStats] = useState({
    totalVendas: 0,
    totalCompras: 0,
    lucroTotal: 0,
    transacoesHoje: 0,
    estoqueTotal: 0,
    margemLucro: 0,
    crescimentoSemanal: 0,
  })

  const [recentTransactions, setRecentTransactions] = useState([])
  const [lowStockAlerts, setLowStockAlerts] = useState([])
  const [calculatorOpen, setCalculatorOpen] = useState(false) // Estado para controlar abertura da calculadora
  const dataContext = useData()

  const {
    transactions = [],
    inventory = {},
    firebaseConnected = false,
    syncing = false,
    lastSyncTime = null,
    realTimeSync = true,
    pendingChanges = 0,
    refreshData,
    toggleRealTimeSync,
  } = dataContext || {}

  useEffect(() => {
    calculateStats()
    checkLowStock()
  }, [transactions, inventory])

  const calculateStats = () => {
    const today = new Date().toDateString()
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    let totalVendas = 0
    let totalCompras = 0
    let transacoesHoje = 0
    let vendasSemanaPassada = 0

    transactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.data)
      const transactionDateString = transactionDate.toDateString()

      if (transaction.tipo === "venda") {
        totalVendas += transaction.valorTotal || 0
        if (transactionDate >= lastWeek) {
          vendasSemanaPassada += transaction.valorTotal || 0
        }
      } else if (transaction.tipo === "compra") {
        totalCompras += transaction.valorTotal || 0
      }

      if (transactionDateString === today) {
        transacoesHoje++
      }
    })

    const estoqueTotal = Object.values(inventory).reduce((total, item) => total + (item.quantidade || 0), 0)
    const margemLucro = totalCompras > 0 ? ((totalVendas - totalCompras) / totalCompras) * 100 : 0
    const crescimentoSemanal =
      vendasSemanaPassada > 0 ? ((totalVendas - vendasSemanaPassada) / vendasSemanaPassada) * 100 : 0

    setStats({
      totalVendas,
      totalCompras,
      lucroTotal: totalVendas - totalCompras,
      transacoesHoje,
      estoqueTotal,
      margemLucro,
      crescimentoSemanal,
    })

    const recent = transactions.sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 6)
    setRecentTransactions(recent)
  }

  const checkLowStock = () => {
    const alerts = []
    Object.entries(inventory).forEach(([material, data]) => {
      if (data.quantidade < 10) {
        // Alerta quando estoque < 10kg
        alerts.push({
          material,
          quantidade: data.quantidade,
          nivel: data.quantidade < 5 ? "critico" : "baixo",
        })
      }
    })
    setLowStockAlerts(alerts)
  }

  const handleSync = async () => {
    if (refreshData) {
      await refreshData()
    }
  }

  const getMaterialColor = (material) => {
    const colors = {
      ferro: "bg-gray-600",
      aluminio: "bg-blue-600",
      cobre: "bg-orange-600",
      latinha: "bg-green-600",
    }
    return colors[material] || "bg-gray-600"
  }

  const getMaterialIcon = (material) => {
    const icons = {
      ferro: "🔩",
      aluminio: "⚡",
      cobre: "🔶",
      latinha: "🥤",
    }
    return icons[material] || "📦"
  }

  const statsCards = [
    {
      title: "Total de Vendas",
      value: formatCurrency(stats.totalVendas),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-gradient-to-br from-green-50 via-emerald-50 to-green-100",
      borderColor: "border-green-300",
      change: `+${stats.crescimentoSemanal.toFixed(1)}%`,
      changeColor: stats.crescimentoSemanal >= 0 ? "text-green-600" : "text-red-600",
      glowColor: "shadow-green-200",
    },
    {
      title: "Total de Compras",
      value: formatCurrency(stats.totalCompras),
      icon: TrendingDown,
      color: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100",
      borderColor: "border-blue-300",
      change: "Este mês",
      changeColor: "text-blue-600",
      glowColor: "shadow-blue-200",
    },
    {
      title: "Lucro Total",
      value: formatCurrency(stats.lucroTotal),
      icon: DollarSign,
      color: stats.lucroTotal >= 0 ? "text-emerald-600" : "text-red-600",
      bgColor:
        stats.lucroTotal >= 0
          ? "bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100"
          : "bg-gradient-to-br from-red-50 via-rose-50 to-red-100",
      borderColor: stats.lucroTotal >= 0 ? "border-emerald-300" : "border-red-300",
      change: `${stats.margemLucro.toFixed(1)}% margem`,
      changeColor: stats.margemLucro >= 0 ? "text-emerald-600" : "text-red-600",
      glowColor: stats.lucroTotal >= 0 ? "shadow-emerald-200" : "shadow-red-200",
    },
    {
      title: "Transações Hoje",
      value: stats.transacoesHoje,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100",
      borderColor: "border-purple-300",
      change: "Hoje",
      changeColor: "text-purple-600",
      glowColor: "shadow-purple-200",
    },
    {
      title: "Estoque Total",
      value: `${stats.estoqueTotal.toFixed(1)}kg`,
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100",
      borderColor: "border-orange-300",
      change: `${Object.keys(inventory).length} materiais`,
      changeColor: "text-orange-600",
      glowColor: "shadow-orange-200",
    },
  ]

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="text-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-cyan-400/20 blur-3xl -z-10"></div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-3 mb-3"
        >
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg animate-pulse-glow">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
            Painel Principal
          </h1>
        </motion.div>
        <p className="text-gray-600 text-lg mb-4">Visão geral completa do seu negócio em tempo real</p>

        <div className="flex justify-center items-center gap-4 mb-4 flex-wrap">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-all ${
              firebaseConnected
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                : "bg-gradient-to-r from-yellow-500 to-orange-600 text-white"
            }`}
          >
            {firebaseConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            <span>{firebaseConnected ? "Sistema Online" : "Modo Offline"}</span>
          </motion.div>

          {syncing && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-full text-sm font-medium shadow-lg"
            >
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Sincronizando dados...</span>
            </motion.div>
          )}

          {lastSyncTime && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-200 rounded-full text-sm text-slate-600 shadow-md"
            >
              <Clock className="h-4 w-4" />
              <span>Última sync: {new Date(lastSyncTime).toLocaleTimeString("pt-BR")}</span>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {lowStockAlerts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card className="p-3 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <h3 className="font-medium text-orange-800 text-sm">
                    {lowStockAlerts.length} {lowStockAlerts.length === 1 ? "item com" : "itens com"} estoque baixo
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onQuickAction("inventory")}
                  className="text-orange-700 hover:bg-orange-100 text-xs"
                >
                  Ver Estoque
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {lowStockAlerts.slice(0, 5).map((alert) => (
                  <span
                    key={alert.material}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      alert.nivel === "critico" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {getMaterialIcon(alert.material)} {alert.material} ({alert.quantidade.toFixed(1)}kg)
                  </span>
                ))}
                {lowStockAlerts.length > 5 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    +{lowStockAlerts.length - 5} mais
                  </span>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group"
            >
              <Card
                className={`p-4 lg:p-6 ${stat.bgColor} ${stat.borderColor} border-2 hover:shadow-2xl transition-all duration-300 relative overflow-hidden card-premium ${stat.glowColor}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`p-2 lg:p-3 rounded-xl bg-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className={`h-5 w-5 lg:h-6 lg:w-6 ${stat.color}`} />
                    </div>
                    <div className="text-right">
                      <p className={`text-xs lg:text-sm font-bold ${stat.changeColor} flex items-center gap-1`}>
                        {stat.change.includes("+") && <TrendingUpIcon className="h-3 w-3" />}
                        {stat.change}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm font-semibold text-gray-600 mb-1">{stat.title}</p>
                    <p className={`text-lg lg:text-2xl font-bold ${stat.color} truncate`}>{stat.value}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        <Card className="p-4 lg:p-6 xl:col-span-2 card-premium hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-2 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              Atividade Recente
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuickAction("reports")}
              className="text-sm hover:bg-blue-50 hover:border-blue-300 transition-all"
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver Todas
            </Button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 mb-1">Nenhuma transação encontrada</p>
              <p className="text-sm text-gray-400">Comece registrando sua primeira transação</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.slice(0, 4).map((transaction, index) => (
                <motion.div
                  key={transaction.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getMaterialColor(transaction.material)}`}></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {transaction.tipo === "compra" ? "Compra" : "Venda"}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">{transaction.material}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {transaction.quantidade}kg • {formatDate(transaction.data)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${transaction.tipo === "venda" ? "text-green-600" : "text-blue-600"}`}>
                      {formatCurrency(transaction.valorTotal)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 lg:p-6 card-premium hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              Ações Rápidas
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => onQuickAction("transaction", "venda")}
                className="w-full h-14 flex-col space-y-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-sm shadow-lg hover:shadow-xl transition-all btn-3d"
              >
                <TrendingUp className="h-5 w-5" />
                <span className="font-semibold">Nova Venda</span>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => onQuickAction("transaction", "compra")}
                className="w-full h-14 flex-col space-y-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-sm shadow-lg hover:shadow-xl transition-all btn-3d"
              >
                <TrendingDown className="h-5 w-5" />
                <span className="font-semibold">Nova Compra</span>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => onQuickAction("inventory")}
                className="w-full h-14 flex-col space-y-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-sm shadow-lg hover:shadow-xl transition-all btn-3d"
              >
                <Package className="h-5 w-5" />
                <span className="font-semibold">Ver Estoque</span>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => onQuickAction("reports")}
                className="w-full h-14 flex-col space-y-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-sm shadow-lg hover:shadow-xl transition-all btn-3d"
              >
                <Eye className="h-5 w-5" />
                <span className="font-semibold">Relatórios</span>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="col-span-2">
              <Button
                onClick={() => setCalculatorOpen(true)}
                className="w-full h-14 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-sm shadow-lg hover:shadow-xl transition-all btn-3d"
              >
                <CalculatorIcon className="h-5 w-5" />
                <span className="font-semibold">Calculadora Rápida</span>
              </Button>
            </motion.div>
          </div>

          <div className="mt-4">
            <Button
              onClick={handleSync}
              disabled={syncing}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 text-sm bg-gradient-to-r from-slate-50 to-blue-50 hover:from-slate-100 hover:to-blue-100 border-2 border-slate-200 hover:border-blue-300 transition-all h-12 font-semibold"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Sincronizando..." : "Sincronizar Dados"}</span>
            </Button>
          </div>
        </Card>
      </div>

      <Calculator isOpen={calculatorOpen} onClose={() => setCalculatorOpen(false)} />
    </div>
  )
}

export default Dashboard
