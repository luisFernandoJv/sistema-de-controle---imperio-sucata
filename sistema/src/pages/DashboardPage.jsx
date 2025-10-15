"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useData } from "../contexts/DataContext"
import {
  TrendingUp,
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
  Clock,
  Target,
  BarChart3,
  PieChart,
  Zap,
  Award,
  Banknote,
  ShoppingCart,
  Store,
  CreditCard,
  Smartphone,
} from "lucide-react"
import Calculator from "./Calculator" // Importando componente da calculadora
import NotificationCenter from "../components/NotificationCenter"
import { Label, Input } from "@radix-ui/react-label"

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
    totalDespesas: 0,
    lucroTotal: 0,
    transacoesHoje: 0,
    estoqueTotal: 0,
    margemLucro: 0,
    crescimentoSemanal: 0,
    clientesAtivos: 0,
    materialMaisVendido: "",
    ticketMedio: 0,
    transacoesSemana: 0,
    metaMensal: 50000,
    progressoMeta: 0,
    pagamentoPix: 0,
    pagamentoDinheiro: 0,
    pagamentoOutros: 0,
    totalTransactions: 0,
  })

  const [recentTransactions, setRecentTransactions] = useState([])
  const [lowStockAlerts, setLowStockAlerts] = useState([])
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [topMaterials, setTopMaterials] = useState([])
  const [weeklyTrend, setWeeklyTrend] = useState([])
  const [paymentStats, setPaymentStats] = useState({ pix: 0, dinheiro: 0, outros: 0, totalTransactions: 0 })
  const [monthlyGoal, setMonthlyGoal] = useState(50000)
  const [showGoalEditor, setShowGoalEditor] = useState(false)

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
    calculateTopMaterials()
    calculateWeeklyTrend()
    calculatePaymentStats()
  }, [transactions, inventory])

  const calculateStats = () => {
    // Por enquanto, mantemos o cálculo local, mas preparamos para migração futura
    const today = new Date().toDateString()
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

    let totalVendas = 0
    let totalCompras = 0
    let totalDespesas = 0
    let transacoesHoje = 0
    let transacoesSemana = 0
    let vendasSemanaPassada = 0
    let vendasMes = 0
    const clientesUnicos = new Set()

    transactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.data)
      const transactionDateString = transactionDate.toDateString()

      const valor = transaction.valorTotal || transaction.total || 0
      const tipo = transaction.tipo || transaction.type

      if (tipo === "venda") {
        totalVendas += valor
        if (transactionDate >= lastWeek) {
          vendasSemanaPassada += valor
        }
        if (transactionDate >= thisMonth) {
          vendasMes += valor
        }
        if (transaction.vendedor) {
          clientesUnicos.add(transaction.vendedor)
        }
      } else if (tipo === "compra") {
        totalCompras += valor
      } else if (tipo === "despesa") {
        totalDespesas += valor
      }

      if (transactionDateString === today) {
        transacoesHoje++
      }

      if (transactionDate >= lastWeek) {
        transacoesSemana++
      }
    })

    const estoqueTotal = Object.values(inventory).reduce((total, item) => total + (item.quantidade || 0), 0)
    const margemLucro = totalCompras > 0 ? ((totalVendas - totalCompras - totalDespesas) / totalCompras) * 100 : 0
    const crescimentoSemanal =
      vendasSemanaPassada > 0 ? ((totalVendas - vendasSemanaPassada) / vendasSemanaPassada) * 100 : 0

    const ticketMedio =
      transactions.filter((t) => (t.tipo || t.type) === "venda").length > 0
        ? totalVendas / transactions.filter((t) => (t.tipo || t.type) === "venda").length
        : 0

    const progressoMeta = (vendasMes / monthlyGoal) * 100

    const materialCount = {}
    transactions
      .filter((t) => (t.tipo || t.type) === "venda")
      .forEach((t) => {
        materialCount[t.material] = (materialCount[t.material] || 0) + (t.quantidade || 0)
      })
    const materialMaisVendido = Object.keys(materialCount).reduce(
      (a, b) => (materialCount[a] > materialCount[b] ? a : b),
      "N/A",
    )

    setStats({
      totalVendas,
      totalCompras,
      totalDespesas,
      lucroTotal: totalVendas - totalCompras - totalDespesas,
      transacoesHoje,
      estoqueTotal,
      margemLucro,
      crescimentoSemanal,
      clientesAtivos: clientesUnicos.size,
      materialMaisVendido,
      ticketMedio,
      transacoesSemana,
      metaMensal: monthlyGoal,
      progressoMeta: Math.min(progressoMeta, 100),
      pagamentoPix: paymentStats.pix,
      pagamentoDinheiro: paymentStats.dinheiro,
      pagamentoOutros: paymentStats.outros,
      totalTransactions: paymentStats.totalTransactions,
    })

    const recent = transactions.sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 8)
    setRecentTransactions(recent)
  }

  const calculatePaymentStats = () => {
    const stats = { pix: 0, dinheiro: 0, outros: 0 }
    let totalTransactions = 0

    transactions.forEach((transaction) => {
      const formaPagamento = (transaction.formaPagamento || transaction.paymentMethod || "").toLowerCase()
      const valor = transaction.valorTotal || transaction.total || 0

      if (valor > 0) {
        totalTransactions++

        if (formaPagamento === "pix") {
          stats.pix += valor
        } else if (formaPagamento === "dinheiro") {
          stats.dinheiro += valor
        } else {
          stats.outros += valor
        }
      }
    })

    setPaymentStats({
      ...stats,
      totalTransactions,
      pixPercentage: totalTransactions > 0 ? (stats.pix / totalTransactions) * 100 : 0,
      dinheiroPercentage: totalTransactions > 0 ? (stats.dinheiro / totalTransactions) * 100 : 0,
    })
  }

  const calculateTopMaterials = () => {
    const materialStats = {}

    transactions.forEach((transaction) => {
      const material = transaction.material
      const quantidade = transaction.quantidade || transaction.quantity || 0
      const valor = transaction.valorTotal || transaction.total || 0

      if (!materialStats[material]) {
        materialStats[material] = { quantidade: 0, valor: 0, transacoes: 0 }
      }

      materialStats[material].quantidade += quantidade
      materialStats[material].valor += valor
      materialStats[material].transacoes += 1
    })

    const sorted = Object.entries(materialStats)
      .sort(([, a], [, b]) => b.valor - a.valor)
      .slice(0, 5)
      .map(([material, data]) => ({ material, ...data }))

    setTopMaterials(sorted)
  }

  const calculateWeeklyTrend = () => {
    const last7Days = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = date.toDateString()

      const dayTransactions = transactions.filter((t) => new Date(t.data).toDateString() === dateString)

      const dayTotal = dayTransactions.reduce((sum, t) => sum + (t.valorTotal || t.total || 0), 0)

      last7Days.push({
        date: date.toLocaleDateString("pt-BR", { weekday: "short" }),
        value: dayTotal,
        transactions: dayTransactions.length,
      })
    }

    setWeeklyTrend(last7Days)
  }

  const checkLowStock = () => {
    const alerts = []
    Object.entries(inventory).forEach(([material, data]) => {
      if (data.quantidade < 10) {
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
      panela: "bg-purple-600",
      bloco2: "bg-red-600",
      chapa: "bg-yellow-600",
    }
    return colors[material] || "bg-gray-600"
  }

  const getMaterialIcon = (material) => {
    const icons = {
      ferro: "🔩",
      aluminio: "⚡",
      cobre: "🔶",
      latinha: "🥤",
      panela: "🍳",
      bloco2: "🧱",
      chapa: "📄",
    }
    return icons[material] || "📦"
  }

  const statsCards = [
    {
      title: "Vendas do Mês",
      value: formatCurrency(stats.totalVendas),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-gradient-to-br from-green-50 to-green-100",
      borderColor: "border-green-200",
      change: `+${stats.crescimentoSemanal.toFixed(1)}%`,
      changeColor: stats.crescimentoSemanal >= 0 ? "text-green-600" : "text-red-600",
      subtitle: `${stats.transacoesSemana} transações esta semana`,
    },
    {
      title: "Meta Mensal",
      value: `${stats.progressoMeta.toFixed(0)}%`,
      icon: Target,
      color:
        stats.progressoMeta >= 80 ? "text-green-600" : stats.progressoMeta >= 50 ? "text-yellow-600" : "text-red-600",
      bgColor:
        stats.progressoMeta >= 80
          ? "bg-gradient-to-br from-green-50 to-green-100"
          : stats.progressoMeta >= 50
            ? "bg-gradient-to-br from-yellow-50 to-yellow-100"
            : "bg-gradient-to-br from-red-50 to-red-100",
      borderColor:
        stats.progressoMeta >= 80
          ? "border-green-200"
          : stats.progressoMeta >= 50
            ? "border-yellow-200"
            : "border-red-200",
      change: formatCurrency(monthlyGoal),
      changeColor: "text-gray-600",
      subtitle: "Meta do mês",
    },
    {
      title: "Lucro Total",
      value: formatCurrency(stats.lucroTotal),
      icon: DollarSign,
      color: stats.lucroTotal >= 0 ? "text-emerald-600" : "text-red-600",
      bgColor:
        stats.lucroTotal >= 0
          ? "bg-gradient-to-br from-emerald-50 to-emerald-100"
          : "bg-gradient-to-br from-red-50 to-red-100",
      borderColor: stats.lucroTotal >= 0 ? "border-emerald-200" : "border-red-200",
      change: `${stats.margemLucro.toFixed(1)}% margem`,
      changeColor: stats.margemLucro >= 0 ? "text-emerald-600" : "text-red-600",
      subtitle: "Resultado líquido",
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(stats.ticketMedio),
      icon: BarChart3,
      color: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
      change: `${stats.clientesAtivos} clientes`,
      changeColor: "text-blue-600",
      subtitle: "Valor médio por venda",
    },
    {
      title: "Estoque Total",
      value: `${stats.estoqueTotal.toFixed(1)}kg`,
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-gradient-to-br from-orange-50 to-yellow-50",
      borderColor: "border-orange-200",
      change: `${Object.keys(inventory).length} materiais`,
      changeColor: "text-orange-600",
      subtitle: lowStockAlerts.length > 0 ? `${lowStockAlerts.length} alertas` : "Estoque ok",
    },
    {
      title: "Transações Hoje",
      value: stats.transacoesHoje,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
      borderColor: "border-purple-200",
      change: "Hoje",
      changeColor: "text-purple-600",
      subtitle: `${stats.materialMaisVendido} em destaque`,
    },
  ]

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
        >
          🏭 Império Sucata - Painel Executivo
        </motion.h1>
        <p className="text-gray-600 mb-4">Controle total do seu negócio de reciclagem</p>

        <div className="flex justify-center items-center gap-4 mb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              firebaseConnected ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {firebaseConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            <span className="font-medium">{firebaseConnected ? "🟢 Sistema Online" : "🟡 Modo Offline"}</span>
          </motion.div>

          {syncing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
            >
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Sincronizando dados...</span>
            </motion.div>
          )}

          {pendingChanges > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
            >
              <Clock className="h-4 w-4" />
              <span>{pendingChanges} alterações pendentes</span>
            </motion.div>
          )}

          <NotificationCenter />
        </div>
      </div>

      <AnimatePresence>
        {lowStockAlerts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card className="p-4 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <h3 className="font-medium text-orange-800">
                    ⚠️ {lowStockAlerts.length} {lowStockAlerts.length === 1 ? "material com" : "materiais com"} estoque
                    baixo
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onQuickAction("inventory")}
                  className="text-orange-700 hover:bg-orange-100"
                >
                  Ver Estoque
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {lowStockAlerts.slice(0, 6).map((alert) => (
                  <span
                    key={alert.material}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      alert.nivel === "critico" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {getMaterialIcon(alert.material)} {alert.material} ({alert.quantidade.toFixed(1)}kg)
                  </span>
                ))}
                {lowStockAlerts.length > 6 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                    +{lowStockAlerts.length - 6} mais
                  </span>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="group"
            >
              <Card
                className={`p-4 lg:p-5 ${stat.bgColor} ${stat.borderColor} border-2 hover:shadow-xl transition-all duration-300 group-hover:shadow-2xl`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 lg:p-3 rounded-xl bg-white/60 shadow-sm`}>
                    <Icon className={`h-5 w-5 lg:h-6 lg:w-6 ${stat.color}`} />
                  </div>
                  <div className="text-right">
                    <p className={`text-xs lg:text-sm font-medium ${stat.changeColor}`}>{stat.change}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className={`text-lg lg:text-xl font-bold ${stat.color} truncate`}>{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-blue-600" />💳 Análise de Pagamentos
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-full">
                  <Smartphone className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="font-bold text-blue-800">📱 PIX</span>
                  <p className="text-xs text-blue-600 mt-1">Pagamento instantâneo</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-700 text-lg">{formatCurrency(paymentStats.pix)}</p>
                <p className="text-sm text-blue-600 font-medium">
                  {(paymentStats.pixPercentage || 0).toFixed(1)}% do total
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600 rounded-full">
                  <Banknote className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="font-bold text-green-800">💵 Dinheiro</span>
                  <p className="text-xs text-green-600 mt-1">Pagamento em espécie</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-700 text-lg">{formatCurrency(paymentStats.dinheiro)}</p>
                <p className="text-sm text-green-600 font-medium">
                  {(paymentStats.dinheiroPercentage || 0).toFixed(1)}% do total
                </p>
              </div>
            </div>

            {paymentStats.outros > 0 && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-700">Outros</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-700">{formatCurrency(paymentStats.outros)}</p>
                </div>
              </div>
            )}

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Total Processado:</span>
                <span className="font-bold text-gray-800">
                  {formatCurrency(paymentStats.pix + paymentStats.dinheiro + paymentStats.outros)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">Transações:</span>
                <span className="text-xs font-medium text-gray-600">{paymentStats.totalTransactions || 0}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Award className="h-5 w-5 mr-2 text-yellow-600" />🏆 Top Materiais
          </h3>
          <div className="space-y-3">
            {topMaterials.slice(0, 4).map((material, index) => (
              <div key={material.material} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getMaterialIcon(material.material)}</span>
                  <div>
                    <p className="font-medium text-sm">{material.material}</p>
                    <p className="text-xs text-gray-500">{material.quantidade.toFixed(1)}kg</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{formatCurrency(material.valor)}</p>
                  <p className="text-xs text-gray-500">{material.transacoes} transações</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-purple-600" />⚡ Ações Rápidas
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => onQuickAction("transaction", "venda")}
                className="w-full h-14 flex-col space-y-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-sm"
              >
                <Store className="h-5 w-5" />
                <span className="font-medium">💰 Venda</span>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => onQuickAction("transaction", "compra")}
                className="w-full h-14 flex-col space-y-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-sm"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="font-medium">🛒 Compra</span>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => onQuickAction("inventory")}
                className="w-full h-14 flex-col space-y-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-sm"
              >
                <Package className="h-5 w-5" />
                <span className="font-medium">📦 Estoque</span>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => onQuickAction("reports")}
                className="w-full h-14 flex-col space-y-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-sm"
              >
                <PieChart className="h-5 w-5" />
                <span className="font-medium">📊 Relatórios</span>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="col-span-2">
              <Button
                onClick={() => setCalculatorOpen(true)}
                className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-sm"
              >
                <CalculatorIcon className="h-4 w-4" />
                <span className="font-medium">🧮 Calculadora</span>
              </Button>
            </motion.div>
          </div>

          <div className="mt-4 space-y-2">
            <Button
              onClick={handleSync}
              disabled={syncing}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 text-sm bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Sincronizando..." : "🔄 Sincronizar Dados"}</span>
            </Button>

            {lastSyncTime && (
              <p className="text-xs text-gray-500 text-center">
                Última sync: {new Date(lastSyncTime).toLocaleTimeString("pt-BR")}
              </p>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Activity className="h-6 w-6 mr-2 text-blue-600" />📈 Atividade Recente
          </h2>
          <Button variant="outline" size="sm" onClick={() => onQuickAction("reports")} className="text-sm">
            <Eye className="h-4 w-4 mr-1" />
            Ver Todas
          </Button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-12">
            <XCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2 text-lg font-medium">Nenhuma transação encontrada</p>
            <p className="text-sm text-gray-400">Comece registrando sua primeira transação</p>
            <Button
              onClick={() => onQuickAction("transaction", "venda")}
              className="mt-4 bg-green-600 hover:bg-green-700"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Registrar Venda
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentTransactions.slice(0, 6).map((transaction, index) => (
              <motion.div
                key={transaction.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100 bg-white"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${getMaterialColor(transaction.material)}`}></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          transaction.tipo === "venda" ? "text-green-600" : "text-blue-600"
                        }`}
                      >
                        {transaction.tipo === "compra" ? "🛒 Compra" : "💰 Venda"}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">{transaction.material}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {(transaction.quantidade || 0).toFixed(1)}kg • {formatDate(transaction.data)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {(transaction.formaPagamento || "").toLowerCase() === "pix" ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                          <Smartphone className="h-3 w-3" />
                          PIX
                        </span>
                      ) : (transaction.formaPagamento || "").toLowerCase() === "dinheiro" ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                          <Banknote className="h-3 w-3" />
                          Dinheiro
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                          <CreditCard className="h-3 w-3" />
                          {transaction.formaPagamento || "N/A"}
                        </span>
                      )}

                      {transaction.vendedor && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          👤 {transaction.vendedor.substring(0, 10)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${transaction.tipo === "venda" ? "text-green-600" : "text-blue-600"}`}>
                    {formatCurrency(transaction.valorTotal)}
                  </p>
                  {transaction.vendedor && <p className="text-xs text-gray-500">{transaction.vendedor}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <Target className="h-5 w-5 mr-2 text-purple-600" />🎯 Metas e Progresso
          </h3>
          <Button onClick={() => setShowGoalEditor(!showGoalEditor)} variant="outline" size="sm">
            Editar Meta
          </Button>
        </div>

        {showGoalEditor && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <Label htmlFor="monthlyGoal">Meta Mensal (R$)</Label>
            <Input
              id="monthlyGoal"
              type="number"
              value={monthlyGoal}
              onChange={(e) => setMonthlyGoal(Number.parseFloat(e.target.value) || 0)}
              className="mt-2"
            />
            <Button onClick={() => setShowGoalEditor(false)} className="mt-2" size="sm">
              Salvar
            </Button>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Vendas do Mês</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(stats.totalVendas)} / {formatCurrency(monthlyGoal)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  stats.progressoMeta >= 80
                    ? "bg-green-500"
                    : stats.progressoMeta >= 50
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${Math.min(stats.progressoMeta, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.progressoMeta >= 100
                ? "🎉 Meta atingida! Parabéns!"
                : `Faltam ${formatCurrency(monthlyGoal - stats.totalVendas)} para atingir a meta`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-gray-600">Crescimento Semanal</p>
              <p className={`text-2xl font-bold ${stats.crescimentoSemanal >= 0 ? "text-green-600" : "text-red-600"}`}>
                {stats.crescimentoSemanal >= 0 ? "+" : ""}
                {stats.crescimentoSemanal.toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Margem de Lucro</p>
              <p className={`text-2xl font-bold ${stats.margemLucro >= 0 ? "text-green-600" : "text-red-600"}`}>
                {stats.margemLucro.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Calculator isOpen={calculatorOpen} onClose={() => setCalculatorOpen(false)} />
    </div>
  )
}

export default Dashboard
