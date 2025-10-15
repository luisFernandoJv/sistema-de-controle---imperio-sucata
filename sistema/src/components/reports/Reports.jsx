"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  Printer,
  FileText,
  BarChart3,
  Calendar,
  FileDown,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  X,
  TrendingUp,
  DollarSign,
  Download,
  Search,
  Filter,
  Settings,
  Zap,
  Target,
  Activity,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  AlertCircle,
  Menu,
  Home,
  ShoppingCart,
  Package,
  Receipt,
  BarChart2,
  Users,
  SettingsIcon,
  ArrowUp,
  Layers,
  FileSpreadsheet,
  PieChart,
} from "lucide-react"
import {
  exportToCSV,
  generateAdvancedPDF,
  calculateReportStats,
  exportToExcel,
} from "@/utils/printUtils"
import { useData } from "../../contexts/DataContext"
import ReportSummary from "./ReportSummary"
import TransactionsReport from "./TransactionsReport"
import MaterialsReport from "./MaterialsReport"
import DailyReport from "./DailyReport"
import TransactionEditModal from "../TransactionEditModal"
import {
  format,
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  startOfWeek,
  endOfWeek,
  isToday,
  isThisWeek,
  isThisMonth,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { motion } from "framer-motion" // Import motion from framer-motion

const Reports = () => {
  const { transactions, firebaseConnected, syncing, refreshData, editTransaction, deleteTransaction, lastSyncTime } =
    useData()

  const { toast } = useToast()

  const [showFloatingNav, setShowFloatingNav] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const headerRef = useRef(null)
  const filtersRef = useRef(null)
  const statsRef = useRef(null)
  const tabsRef = useRef(null)

  const [dateRange, setDateRange] = useState({
    from: startOfDay(subDays(new Date(), 30)),
    to: endOfDay(new Date()),
  })

  const [datePreset, setDatePreset] = useState("last30days")
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeTab, setActiveTab] = useState("summary")
  const [isCompactView, setIsCompactView] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [savedFilters, setSavedFilters] = useState([])
  const [currentFilterName, setCurrentFilterName] = useState("")
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(30000)
  const [showNavMenu, setShowNavMenu] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [materialFilter, setMaterialFilter] = useState("all")

  const [printOptions, setPrintOptions] = useState({
    type: "all",
    includeDetails: true,
    includeSummary: true,
    pageOrientation: "portrait",
    includePaymentAnalysis: true,
    includeDateAnalysis: true,
    includeCharts: true,
    includeComparison: false,
    groupByMaterial: false,
    showOnlyProfit: false,
    customTitle: "",
    includeFooter: true,
    colorMode: "color",
    maxRows: 1000, // Increased to show all transactions
  })
  const [showPrintSelector, setShowPrintSelector] = useState(false)

  const [quickFilters, setQuickFilters] = useState({
    today: false,
    thisWeek: false,
    thisMonth: false,
    profitable: false,
    highValue: false,
    recentlyAdded: false,
  })

  const filteredTransactions = useMemo(() => {
    if (!transactions) return []

    // console.log(`[v0] Filtrando ${transactions.length} transacoes`)

    const filtered = transactions.filter((t) => {
      const transactionDate = new Date(t.data)
      const inDateRange = transactionDate >= dateRange.from && transactionDate <= dateRange.to

      // Quick filters
      if (quickFilters.today && !isToday(transactionDate)) return false
      if (quickFilters.thisWeek && !isThisWeek(transactionDate, { locale: ptBR })) return false
      if (quickFilters.thisMonth && !isThisMonth(transactionDate)) return false
      if (quickFilters.profitable) {
        if (t.tipo === "venda") {
          // Check if this sale is profitable (has higher value than average purchase)
          const avgPurchase =
            transactions
              .filter((tr) => tr.tipo === "compra" && tr.material === t.material)
              .reduce((sum, tr) => sum + (tr.precoUnitario || 0), 0) /
              transactions.filter((tr) => tr.tipo === "compra" && tr.material === t.material).length || 0
          if ((t.precoUnitario || 0) <= avgPurchase) return false
        } else {
          return false
        }
      }
      if (quickFilters.highValue && (t.valorTotal || 0) < 1000) return false
      if (quickFilters.recentlyAdded) {
        const daysSinceAdded = Math.floor((new Date() - transactionDate) / (1000 * 60 * 60 * 24))
        if (daysSinceAdded > 7) return false
      }

      // Type filter
      if (typeFilter !== "all" && t.tipo !== typeFilter) return false

      // Payment filter
      if (paymentFilter !== "all") {
        const payment = (t.formaPagamento || "dinheiro").toLowerCase()
        if (paymentFilter === "pix" && payment !== "pix") return false
        if (paymentFilter === "dinheiro" && payment !== "dinheiro" && payment !== "") return false
      }

      // Material filter
      if (materialFilter !== "all" && t.material !== materialFilter) return false

      // Search term
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchesSearch =
          (t.material || "").toLowerCase().includes(search) ||
          (t.vendedor || "").toLowerCase().includes(search) ||
          (t.cliente || "").toLowerCase().includes(search) ||
          (t.fornecedor || "").toLowerCase().includes(search) ||
          (t.observacoes || "").toLowerCase().includes(search)
        if (!matchesSearch) return false
      }

      return inDateRange
    })

    // const sorted = filtered.sort((a, b) => new Date(b.data) - new Date(a.data))
    // console.log(`[v0] ${sorted.length} transacoes apos filtragem`)
    return filtered.sort((a, b) => new Date(b.data) - new Date(a.data))
  }, [transactions, dateRange, quickFilters, typeFilter, paymentFilter, materialFilter, searchTerm])

  const filteredStats = useMemo(() => {
    if (!filteredTransactions.length) return null
    return calculateReportStats(filteredTransactions)
  }, [filteredTransactions])

  const uniqueMaterials = useMemo(() => {
    if (!transactions) return []
    const materials = [...new Set(transactions.map((t) => t.material).filter(Boolean))]
    return materials.sort()
  }, [transactions])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshData()
      }, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, refreshData])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    setShowFloatingNav(false)
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
    setShowFloatingNav(false)
  }

  const handleDatePresetChange = (preset) => {
    setDatePreset(preset)
    const now = new Date()
    let from, to

    switch (preset) {
      case "today":
        from = startOfDay(now)
        to = endOfDay(now)
        break
      case "yesterday":
        from = startOfDay(subDays(now, 1))
        to = endOfDay(subDays(now, 1))
        break
      case "last7days":
        from = startOfDay(subDays(now, 7))
        to = endOfDay(now)
        break
      case "last30days":
        from = startOfDay(subDays(now, 30))
        to = endOfDay(now)
        break
      case "thisWeek":
        from = startOfWeek(now, { locale: ptBR })
        to = endOfWeek(now, { locale: ptBR })
        break
      case "thisMonth":
        from = startOfMonth(now)
        to = endOfMonth(now)
        break
      case "lastMonth":
        from = startOfMonth(subMonths(now, 1))
        to = endOfMonth(subMonths(now, 1))
        break
      case "thisYear":
        from = startOfYear(now)
        to = endOfYear(now)
        break
      case "custom":
        return
      default:
        from = startOfDay(subDays(now, 30))
        to = endOfDay(now)
    }

    setDateRange({ from, to })
  }

  const saveCurrentFilter = () => {
    if (!currentFilterName.trim()) {
      toast({
        title: "Nome Necessário",
        description: "Digite um nome para salvar o filtro.",
        variant: "destructive",
      })
      return
    }

    const newFilter = {
      id: Date.now(),
      name: currentFilterName,
      dateRange,
      typeFilter,
      paymentFilter,
      materialFilter,
      searchTerm,
      quickFilters,
    }

    setSavedFilters((prev) => [...prev, newFilter])
    setCurrentFilterName("")

    toast({
      title: "Filtro Salvo",
      description: `O filtro "${currentFilterName}" foi salvo com sucesso.`,
      className: "bg-green-100 border-green-500 text-green-800",
    })
  }

  const applySavedFilter = (savedFilter) => {
    setDateRange(savedFilter.dateRange)
    setTypeFilter(savedFilter.typeFilter)
    setPaymentFilter(savedFilter.paymentFilter)
    setMaterialFilter(savedFilter.materialFilter)
    setSearchTerm(savedFilter.searchTerm)
    setQuickFilters(savedFilter.quickFilters)
    setDatePreset("custom")

    toast({
      title: "Filtro Aplicado",
      description: `Filtro "${savedFilter.name}" foi aplicado.`,
      className: "bg-blue-100 border-blue-500 text-blue-800",
    })
  }

  const clearAllFilters = () => {
    setDateRange({
      from: startOfDay(subDays(new Date(), 30)),
      to: endOfDay(new Date()),
    })
    setDatePreset("last30days")
    setTypeFilter("all")
    setPaymentFilter("all")
    setMaterialFilter("all")
    setSearchTerm("")
    setQuickFilters({
      today: false,
      thisWeek: false,
      thisMonth: false,
      profitable: false,
      highValue: false,
      recentlyAdded: false,
    })

    toast({
      title: "Filtros Limpos",
      description: "Todos os filtros foram removidos.",
      className: "bg-gray-100 border-gray-500 text-gray-800",
    })
  }

  const handlePrint = useCallback(
    async (type = "all") => {
      try {
        console.log("[v0] Iniciando impressão rápida por categoria:", type)

        if (!filteredTransactions || filteredTransactions.length === 0) {
          toast({
            title: "⚠️ Aviso",
            description: "Não há dados para imprimir. Verifique os filtros aplicados.",
            variant: "destructive",
          })
          return
        }

        let dataToprint = filteredTransactions
        let title = "Relatório Completo"

        switch (type) {
          case "vendas":
            dataToprint = filteredTransactions.filter((t) => t.tipo === "venda")
            title = "Relatório de Vendas"
            break
          case "compras":
            dataToprint = filteredTransactions.filter((t) => t.tipo === "compra")
            title = "Relatório de Compras"
            break
          case "despesas":
            dataToprint = filteredTransactions.filter((t) => t.tipo === "despesa")
            title = "Relatório de Despesas"
            break
          case "lucros":
            dataToprint = filteredTransactions.filter((t) => t.tipo === "venda")
            title = "Relatório de Lucros"
            break
          case "materiais":
            title = "Relatório por Material"
            break
          case "resumo":
            title = "Resumo Executivo"
            break
          default:
            dataToprint = filteredTransactions
            title = "Relatório Completo"
        }

        console.log("[v0] Dados filtrados para impressão:", dataToprint.length, "registros")

        if (dataToprint.length === 0 && type !== "resumo" && type !== "materiais") {
          toast({
            title: "⚠️ Aviso",
            description: `Não há dados de ${type} para imprimir no período selecionado.`,
            variant: "destructive",
          })
          return
        }

        if (dataToprint.length > 100) {
          toast({
            title: "⏳ Processando...",
            description: `Gerando relatório com ${dataToprint.length} transações. Isso pode levar alguns segundos.`,
            className: "bg-blue-100 border-blue-500 text-blue-800",
          })
        }

        const reportData = {
          transactions: dataToprint,
          filters: {
            startDate: format(dateRange.from, "yyyy-MM-dd"),
            endDate: format(dateRange.to, "yyyy-MM-dd"),
          },
          stats: calculateReportStats(dataToprint),
          generatedAt: new Date().toLocaleString("pt-BR"),
          period: {
            start: format(dateRange.from, "dd/MM/yyyy", { locale: ptBR }),
            end: format(dateRange.to, "dd/MM/yyyy", { locale: ptBR }),
          },
        }

        await generateAdvancedPDF(reportData, {
          type,
          title,
          includeDetails: true,
          includeSummary: true,
          includePaymentAnalysis: true,
          includeMaterialAnalysis: true,
        })

        toast({
          title: "✅ Sucesso",
          description: `${title} gerado com ${dataToprint.length} transações!`,
          className: "bg-green-100 border-green-500 text-green-800",
        })
      } catch (error) {
        console.error("[v0] Erro ao gerar relatório:", error)
        toast({
          title: "❌ Erro",
          description: error.message || "Erro ao gerar relatório. Tente novamente.",
          variant: "destructive",
        })
      }
    },
    [filteredTransactions, dateRange, toast],
  )

  const handleGeneratePDF = useCallback(async () => {
    if (!filteredTransactions.length) {
      toast({
        title: "Nenhum Dado",
        description: "Não há transações no período selecionado.",
        variant: "destructive",
      })
      return
    }

    try {
      toast({
        title: "⏳ Gerando PDF...",
        description: `Preparando relatório completo com ${filteredTransactions.length} transações.`,
        className: "bg-blue-100 border-blue-500 text-blue-800",
      })

      const reportData = {
        transactions: filteredTransactions,
        filters: {
          startDate: format(dateRange.from, "yyyy-MM-dd"),
          endDate: format(dateRange.to, "yyyy-MM-dd"),
        },
        stats: filteredStats,
        generatedAt: new Date().toLocaleString("pt-BR"),
        period: {
          start: format(dateRange.from, "dd/MM/yyyy", { locale: ptBR }),
          end: format(dateRange.to, "dd/MM/yyyy", { locale: ptBR }),
        },
      }

      await generateAdvancedPDF(reportData, {
        type: "completo",
        title: printOptions.customTitle || "Relatório Completo",
        includeSummary: true,
        includePaymentAnalysis: true,
        includeMaterialAnalysis: true,
        includeDetails: true,
      })

      toast({
        title: "✅ PDF Gerado com Sucesso",
        description: `Relatório com ${filteredTransactions.length} transações foi baixado.`,
        className: "bg-green-100 border-green-500 text-green-800",
      })
    } catch (error) {
      console.error("[v0] Error generating PDF:", error)
      toast({
        title: "❌ Erro ao Gerar PDF",
        description: error.message || "Verifique sua conexão e tente novamente.",
        variant: "destructive",
      })
    }
  }, [filteredTransactions, dateRange, filteredStats, printOptions.customTitle, toast])

  const handleAdvancedExportPDF = useCallback(async () => {
    try {
      if (!filteredTransactions.length) {
        toast({
          title: "Nenhum Dado",
          description: "Não há transações para exportar.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "⏳ Processando...",
        description: `Gerando relatório avançado com ${filteredTransactions.length} transações.`,
        className: "bg-blue-100 border-blue-500 text-blue-800",
      })

      const reportData = {
        transactions: filteredTransactions,
        filters: {
          startDate: format(dateRange.from, "yyyy-MM-dd"),
          endDate: format(dateRange.to, "yyyy-MM-dd"),
        },
        stats: filteredStats,
        generatedAt: new Date().toLocaleString("pt-BR"),
        period: {
          start: format(dateRange.from, "dd/MM/yyyy", { locale: ptBR }),
          end: format(dateRange.to, "dd/MM/yyyy", { locale: ptBR }),
        },
      }

      await generateAdvancedPDF(reportData, {
        ...printOptions,
        title: printOptions.customTitle || "Relatório Avançado",
        includeSummary: printOptions.includeSummary !== false,
        includePaymentAnalysis: printOptions.includePaymentAnalysis !== false,
        includeMaterialAnalysis: true,
        includeDetails: printOptions.includeDetails !== false,
      })

      toast({
        title: "✅ PDF Gerado!",
        description: `Relatório avançado com ${filteredTransactions.length} transações exportado com sucesso.`,
        className: "bg-green-100 border-green-500 text-green-800",
      })
      setShowPrintSelector(false)
    } catch (error) {
      console.error("[v0] Erro ao gerar PDF:", error)
      toast({
        title: "❌ Erro na Exportação",
        description: error.message || "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive",
      })
    }
  }, [filteredTransactions, dateRange, filteredStats, printOptions, toast])

  const handleExportCSV = useCallback(() => {
    if (!filteredTransactions.length) {
      toast({
        title: "Nenhum Dado",
        description: "Não há transações para exportar.",
        variant: "destructive",
      })
      return
    }

    try {
      const fileName = `relatorio_${format(dateRange.from, "yyyy-MM-dd")}_a_${format(dateRange.to, "yyyy-MM-dd")}.csv`
      exportToCSV(filteredTransactions, fileName)

      toast({
        title: "✅ CSV Exportado",
        description: `Arquivo com ${filteredTransactions.length} transações foi baixado.`,
        className: "bg-green-100 border-green-500 text-green-800",
      })
    } catch (error) {
      console.error("[v0] Erro ao exportar CSV:", error)
      toast({
        title: "❌ Erro na Exportação",
        description: error.message || "Não foi possível exportar o CSV.",
        variant: "destructive",
      })
    }
  }, [filteredTransactions, dateRange, toast])

  const handleExportExcel = useCallback(() => {
    if (!filteredTransactions.length) {
      toast({
        title: "Nenhum Dado",
        description: "Não há transações para exportar.",
        variant: "destructive",
      })
      return
    }

    try {
      const fileName = `relatorio_${format(dateRange.from, "yyyy-MM-dd")}_a_${format(dateRange.to, "yyyy-MM-dd")}.xlsx`
      exportToExcel(filteredTransactions, fileName)

      toast({
        title: "✅ Excel Exportado",
        description: `Planilha com ${filteredTransactions.length} transações foi baixada.`,
        className: "bg-green-100 border-green-500 text-green-800",
      })
    } catch (error) {
      console.error("[v0] Erro ao exportar Excel:", error)
      toast({
        title: "❌ Erro na Exportação",
        description: error.message || "Não foi possível exportar o Excel.",
        variant: "destructive",
      })
    }
  }, [filteredTransactions, dateRange, toast])

  const handleRefreshData = async () => {
    try {
      await refreshData()
      toast({
        title: "Dados Atualizados",
        description: "Os relatórios foram sincronizados com o Firebase.",
        className: "bg-green-100 border-green-500 text-green-800",
      })
    } catch (error) {
      toast({
        title: "Erro na Atualização",
        description: "Não foi possível atualizar os dados.",
        variant: "destructive",
      })
    }
  }

  const handleSaveTransaction = async (transaction) => {
    try {
      await editTransaction(transaction.id, transaction)
      await refreshData()
      setShowEditModal(false)
      setEditingTransaction(null)

      toast({
        title: "Transação Atualizada",
        description: "As alterações foram salvas com sucesso.",
        className: "bg-green-100 border-green-500 text-green-800",
      })
    } catch (error) {
      console.error("[v0] Error saving transaction:", error)
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTransaction = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return

    try {
      await deleteTransaction(id)
      await refreshData()

      toast({
        title: "Transação Excluída",
        description: "A transação foi removida com sucesso.",
        className: "bg-green-100 border-green-500 text-green-800",
      })
    } catch (error) {
      console.error("[v0] Error deleting transaction:", error)
      toast({
        title: "Erro ao Excluir",
        description: "Não foi possível excluir a transação.",
        variant: "destructive",
      })
    }
  }

  const datePresets = [
    { value: "today", label: "Hoje" },
    { value: "yesterday", label: "Ontem" },
    { value: "last7days", label: "Últimos 7 dias" },
    { value: "last30days", label: "Últimos 30 dias" },
    { value: "thisWeek", label: "Esta Semana" },
    { value: "thisMonth", label: "Este Mês" },
    { value: "lastMonth", label: "Mês Passado" },
    { value: "thisYear", label: "Este Ano" },
    { value: "custom", label: "Personalizado" },
  ]

  const navMenuItems = [
    { icon: Home, label: "Dashboard", href: "/" },
    { icon: ShoppingCart, label: "Vendas", action: () => handlePrint("vendas") },
    { icon: Package, label: "Compras", action: () => handlePrint("compras") },
    { icon: Receipt, label: "Despesas", action: () => handlePrint("despesas") },
    { icon: BarChart2, label: "Relatórios", href: "/reports" },
    { icon: Users, label: "Clientes", href: "/clients" },
    { icon: SettingsIcon, label: "Configurações", href: "/settings" },
  ]

  const floatingMenuItems = [
    {
      icon: ArrowUp,
      label: "Voltar ao Topo",
      action: scrollToTop,
      color: "from-slate-500 to-slate-600",
    },
    {
      icon: Filter,
      label: "Filtros",
      action: () => scrollToSection(filtersRef),
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: BarChart2,
      label: "Estatísticas",
      action: () => scrollToSection(statsRef),
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: Layers,
      label: "Relatórios",
      action: () => scrollToSection(tabsRef),
      color: "from-cyan-500 to-cyan-600",
    },
    {
      icon: FileDown,
      label: "Exportar PDF",
      action: handleGeneratePDF,
      color: "from-violet-500 to-violet-600",
    },
    {
      icon: FileSpreadsheet,
      label: "Exportar Excel",
      action: handleExportExcel,
      color: "from-emerald-500 to-emerald-600",
    },
    {
      icon: PieChart,
      label: "Resumo Rápido",
      action: () => {
        setActiveTab("summary")
        scrollToSection(tabsRef)
      },
      color: "from-orange-500 to-orange-600",
    },
    {
      icon: Home,
      label: "Dashboard",
      action: () => (window.location.href = "/"),
      color: "from-indigo-500 to-indigo-600",
    },
  ]

  return (
    // Enhanced Header with gradient and better styling
    // Adding ref to header for scroll navigation
    <div
      ref={headerRef}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-4 md:p-6 relative"
    >
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-slate-200 animate-slide-up">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-3 rounded-xl shadow-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
              Relatórios Avançados
            </h1>
            <p className="text-slate-600 mt-2 text-lg">Análise completa de transações e desempenho financeiro</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant={firebaseConnected ? "default" : "destructive"}
              className="h-9 px-4 text-sm shadow-md transition-all hover:scale-105"
            >
              {firebaseConnected ? (
                <>
                  <Wifi className="h-4 w-4 mr-2" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 mr-2" />
                  Offline
                </>
              )}
            </Badge>

            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              className="h-9 shadow-md transition-all hover:scale-105"
            >
              <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-pulse" : ""}`} />
              Auto-Refresh
            </Button>

            <Button
              onClick={handleRefreshData}
              disabled={syncing}
              variant="outline"
              size="sm"
              className="h-9 shadow-md transition-all hover:scale-105 bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>

            <Button
              onClick={() => setIsCompactView(!isCompactView)}
              variant="outline"
              size="sm"
              className="h-9 shadow-md transition-all hover:scale-105"
            >
              {isCompactView ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {lastSyncTime && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
            <Clock className="h-4 w-4" />
            Última sincronização: {format(lastSyncTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </div>
        )}
      </div>

      <Card ref={filtersRef} className="p-6 bg-white shadow-xl mb-6 border border-slate-200 animate-slide-up">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-lg">
                <Filter className="h-5 w-5 text-white" />
              </div>
              Filtros Avançados
            </h2>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                variant="outline"
                size="sm"
                className="shadow-md transition-all hover:scale-105"
              >
                {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {showAdvancedFilters ? "Ocultar" : "Mostrar"}
              </Button>
              <Button
                onClick={clearAllFilters}
                variant="outline"
                size="sm"
                className="shadow-md transition-all hover:scale-105 bg-transparent"
              >
                <X className="h-4 w-4 mr-2" />
                Limpar Tudo
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-20"></div>
            <div className="relative bg-white rounded-xl border-2 border-slate-200 focus-within:border-blue-500 transition-all">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Buscar por material, cliente, fornecedor ou observações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-lg border-0 focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { key: "today", label: "Hoje", icon: Calendar, color: "blue" },
              { key: "thisWeek", label: "Esta Semana", icon: BarChart3, color: "cyan" },
              { key: "thisMonth", label: "Este Mês", icon: FileText, color: "indigo" },
              { key: "profitable", label: "Lucrativos", icon: TrendingUp, color: "green" },
              { key: "highValue", label: "Alto Valor", icon: DollarSign, color: "emerald" },
              { key: "recentlyAdded", label: "Recentes", icon: Clock, color: "violet" },
            ].map(({ key, label, icon: Icon, color }) => (
              <Button
                key={key}
                onClick={() => setQuickFilters((prev) => ({ ...prev, [key]: !prev[key] }))}
                variant={quickFilters[key] ? "default" : "outline"}
                size="sm"
                className={`transition-all duration-200 shadow-md hover:scale-105 ${
                  quickFilters[key]
                    ? `bg-gradient-to-r from-${color}-500 to-${color}-600 text-white hover:from-${color}-600 hover:to-${color}-700`
                    : ""
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </Button>
            ))}
          </div>

          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center">
                <Bookmark className="h-4 w-4 mr-2" />
                Filtros Salvos
              </h4>
              <div className="flex flex-wrap gap-2">
                {savedFilters.map((savedFilter) => (
                  <Badge
                    key={savedFilter.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-blue-50 transition-colors shadow-sm"
                    onClick={() => applySavedFilter(savedFilter)}
                  >
                    <BookmarkCheck className="h-3 w-3 mr-1" />
                    {savedFilter.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Save Filter Input */}
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Nome do filtro..."
              value={currentFilterName}
              onChange={(e) => setCurrentFilterName(e.target.value)}
              className="flex-1 shadow-sm"
            />
            <Button onClick={saveCurrentFilter} size="sm" className="shadow-md">
              <Bookmark className="h-4 w-4 mr-2" />
              Salvar Filtro
            </Button>
          </div>

          {/* Advanced Filter Options */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Transação</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="venda">Vendas</SelectItem>
                    <SelectItem value="compra">Compras</SelectItem>
                    <SelectItem value="despesa">Despesas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Forma de Pagamento</label>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Material</label>
                <Select value={materialFilter} onValueChange={setMaterialFilter}>
                  <SelectTrigger className="shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {uniqueMaterials.map((material) => (
                      <SelectItem key={material} value={material}>
                        {material}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 bg-white shadow-xl mb-6 border border-slate-200 animate-slide-up">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              Período do Relatório
            </h2>
            <Badge variant="outline" className="text-sm shadow-sm bg-blue-50 border-blue-200 text-blue-700">
              {filteredTransactions.length} transações
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {datePresets.map(({ value, label }) => (
              <Button
                key={value}
                onClick={() => handleDatePresetChange(value)}
                variant={datePreset === value ? "default" : "outline"}
                size="sm"
                className={`transition-all shadow-md hover:scale-105 ${
                  datePreset === value ? "bg-gradient-to-r from-blue-500 to-cyan-500" : ""
                }`}
              >
                {label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Data Inicial</label>
              <Input
                type="date"
                value={format(dateRange.from, "yyyy-MM-dd")}
                onChange={(e) => {
                  setDatePreset("custom")
                  setDateRange((prev) => ({ ...prev, from: startOfDay(new Date(e.target.value)) }))
                }}
                className="h-11 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Data Final</label>
              <Input
                type="date"
                value={format(dateRange.to, "yyyy-MM-dd")}
                onChange={(e) => {
                  setDatePreset("custom")
                  setDateRange((prev) => ({ ...prev, to: endOfDay(new Date(e.target.value)) }))
                }}
                className="h-11 shadow-sm"
              />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} até{" "}
                  {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 shadow-sm">
                {Math.ceil((dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24))} dias
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-xl mb-6 bg-white border border-slate-200 animate-slide-up">
        <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-lg mr-2">
            <Zap className="h-5 w-5 text-white" />
          </div>
          Ações Rápidas
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Button
            onClick={() => setShowPrintSelector(true)}
            className="h-16 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Printer className="h-5 w-5 mr-2" />
            Impressão Avançada
          </Button>

          <Button
            onClick={handleGeneratePDF}
            disabled={!filteredTransactions.length}
            className="h-16 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <FileDown className="h-5 w-5 mr-2" />
            Exportar PDF
          </Button>

          <Button
            onClick={handleExportExcel}
            disabled={!filteredTransactions.length}
            className="h-16 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <FileText className="h-5 w-5 mr-2" />
            Exportar Excel
          </Button>

          <Button
            onClick={handleExportCSV}
            disabled={!filteredTransactions.length}
            className="h-16 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Download className="h-5 w-5 mr-2" />
            Exportar CSV
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { type: "vendas", label: "Vendas", color: "green", icon: "💰" },
            { type: "compras", label: "Compras", color: "blue", icon: "🛒" },
            { type: "despesas", label: "Despesas", color: "red", icon: "💸" },
            { type: "lucros", label: "Lucros", color: "emerald", icon: "📈" },
            { type: "materiais", label: "Materiais", color: "orange", icon: "🏭" },
            { type: "resumo", label: "Resumo", color: "purple", icon: "📊" },
          ].map(({ type, label, icon }) => (
            <Button
              key={type}
              onClick={() => handlePrint(type)}
              size="sm"
              variant="outline"
              className="transition-all hover:scale-105 shadow-md hover:shadow-lg"
            >
              <span className="mr-1">{icon}</span>
              {label}
            </Button>
          ))}
        </div>
      </Card>

      {/* No Data State */}
      {!filteredTransactions.length && (
        <Card className="p-8 bg-white shadow-xl animate-slide-up">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="bg-slate-100 p-6 rounded-full">
              <AlertCircle className="h-16 w-16 text-slate-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Nenhuma Transação Encontrada</h3>
              <p className="text-slate-600 text-lg">
                Não há transações no período selecionado. Tente ajustar as datas ou adicionar novas transações.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Report Content */}
      {filteredTransactions.length > 0 && (
        <>
          {filteredStats && !isCompactView && (
            <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 animate-slide-up">
              <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Total Vendas</p>
                    <p className="text-3xl font-bold text-green-900 mt-2">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(filteredStats.totalSales || 0)}
                    </p>
                    <p className="text-xs text-green-600 mt-2 font-medium">{filteredStats.salesCount} transações</p>
                  </div>
                  <div className="bg-green-500 p-4 rounded-2xl shadow-lg">
                    <TrendingUp className="h-10 w-10 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Total Compras</p>
                    <p className="text-3xl font-bold text-blue-900 mt-2">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(filteredStats.totalPurchases || 0)}
                    </p>
                    <p className="text-xs text-blue-600 mt-2 font-medium">{filteredStats.purchasesCount} transações</p>
                  </div>
                  <div className="bg-blue-500 p-4 rounded-2xl shadow-lg">
                    <DollarSign className="h-10 w-10 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">Total Despesas</p>
                    <p className="text-3xl font-bold text-red-900 mt-2">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(filteredStats.totalExpenses || 0)}
                    </p>
                    <p className="text-xs text-red-600 mt-2 font-medium">{filteredStats.expensesCount} transações</p>
                  </div>
                  <div className="bg-red-500 p-4 rounded-2xl shadow-lg">
                    <BarChart3 className="h-10 w-10 text-white" />
                  </div>
                </div>
              </Card>

              <Card
                className={`p-6 bg-gradient-to-br ${
                  (filteredStats.totalProfit || 0) >= 0
                    ? "from-emerald-50 to-teal-50 border-2 border-emerald-200"
                    : "from-orange-50 to-amber-50 border-2 border-orange-200"
                } shadow-xl hover:shadow-2xl transition-all hover:scale-105`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm font-semibold uppercase tracking-wide ${
                        (filteredStats.totalProfit || 0) >= 0 ? "text-emerald-700" : "text-orange-700"
                      }`}
                    >
                      Lucro Líquido
                    </p>
                    <p
                      className={`text-3xl font-bold mt-2 ${
                        (filteredStats.totalProfit || 0) >= 0 ? "text-emerald-900" : "text-orange-900"
                      }`}
                    >
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(filteredStats.totalProfit || 0)}
                    </p>
                    <p
                      className={`text-xs mt-2 font-medium ${
                        (filteredStats.totalProfit || 0) >= 0 ? "text-emerald-600" : "text-orange-600"
                      }`}
                    >
                      Margem: {filteredStats.profitMargin?.toFixed(1)}%
                    </p>
                  </div>
                  <div
                    className={`p-4 rounded-2xl shadow-lg ${
                      (filteredStats.totalProfit || 0) >= 0 ? "bg-emerald-500" : "bg-orange-500"
                    }`}
                  >
                    <Target className="h-10 w-10 text-white" />
                  </div>
                </div>
              </Card>
            </div>
          )}

          <Card ref={tabsRef} className="bg-white shadow-xl border border-slate-200 animate-slide-up">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b px-6 pt-6 bg-gradient-to-r from-slate-50 to-blue-50">
                <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-white shadow-md">
                  <TabsTrigger
                    value="summary"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                  >
                    Resumo
                  </TabsTrigger>
                  <TabsTrigger
                    value="transactions"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                  >
                    Transações
                  </TabsTrigger>
                  <TabsTrigger
                    value="materials"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                  >
                    Materiais
                  </TabsTrigger>
                  <TabsTrigger
                    value="daily"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                  >
                    Diário
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="summary" className="mt-0">
                  <ReportSummary transactions={filteredTransactions} stats={filteredStats} dateRange={dateRange} />
                </TabsContent>

                <TabsContent value="transactions" className="mt-0">
                  <TransactionsReport
                    transactions={filteredTransactions}
                    onEditTransaction={(transaction) => {
                      setEditingTransaction(transaction)
                      setShowEditModal(true)
                    }}
                    onDeleteTransaction={handleDeleteTransaction}
                  />
                </TabsContent>

                <TabsContent value="materials" className="mt-0">
                  <MaterialsReport transactions={filteredTransactions} stats={filteredStats} />
                </TabsContent>

                <TabsContent value="daily" className="mt-0">
                  <DailyReport transactions={filteredTransactions} dateRange={dateRange} />
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        </>
      )}

      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          {showFloatingNav && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute bottom-20 right-0 bg-white rounded-2xl shadow-2xl p-4 w-80 border-2 border-blue-100"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-slate-200">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-1.5 rounded-lg">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  Ações Rápidas
                </h3>
                <button
                  onClick={() => setShowFloatingNav(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                {floatingMenuItems.map((item, index) => (
                  <motion.button
                    key={index}
                    onClick={item.action}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all text-left group border-2 border-transparent hover:border-blue-200 hover:shadow-md"
                  >
                    <div className={`bg-gradient-to-br ${item.color} p-2.5 rounded-xl transition-transform shadow-lg`}>
                      <item.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold text-slate-700 group-hover:text-blue-600 text-sm flex-1">
                      {item.label}
                    </span>
                    <ChevronUp className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <motion.button
            onClick={() => setShowFloatingNav(!showFloatingNav)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-2xl hover:shadow-3xl transition-all flex items-center justify-center group relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
            <Menu
              className={`h-7 w-7 text-white transition-transform duration-300 relative z-10 ${showFloatingNav ? "rotate-90" : ""}`}
            />
          </motion.button>
        </div>
      </div>

      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.1, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 z-40 h-14 w-14 rounded-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 shadow-xl hover:shadow-2xl transition-all flex items-center justify-center"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="h-6 w-6 text-white" />
        </motion.button>
      )}

      {showPrintSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900 flex items-center">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-lg mr-2">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  Opções de Impressão Avançada
                </h3>
                <Button
                  onClick={() => setShowPrintSelector(false)}
                  variant="ghost"
                  size="sm"
                  className="hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900">Conteúdo</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={printOptions.includeSummary}
                        onChange={(e) => setPrintOptions((prev) => ({ ...prev, includeSummary: e.target.checked }))}
                        className="rounded"
                      />
                      <span>Incluir resumo executivo</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={printOptions.includePaymentAnalysis}
                        onChange={(e) =>
                          setPrintOptions((prev) => ({ ...prev, includePaymentAnalysis: e.target.checked }))
                        }
                        className="rounded"
                      />
                      <span>Incluir análise de pagamentos</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={printOptions.includeDetails}
                        onChange={(e) => setPrintOptions((prev) => ({ ...prev, includeDetails: e.target.checked }))}
                        className="rounded"
                      />
                      <span>Incluir detalhes das transações</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={printOptions.includeCharts}
                        onChange={(e) => setPrintOptions((prev) => ({ ...prev, includeCharts: e.target.checked }))}
                        className="rounded"
                      />
                      <span>Incluir gráficos e análises</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900">Formato</h4>
                  <div className="space-y-2">
                    <Select
                      value={printOptions.pageOrientation}
                      onValueChange={(value) => setPrintOptions((prev) => ({ ...prev, pageOrientation: value }))}
                    >
                      <SelectTrigger className="shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Retrato</SelectItem>
                        <SelectItem value="landscape">Paisagem</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={printOptions.colorMode}
                      onValueChange={(value) => setPrintOptions((prev) => ({ ...prev, colorMode: value }))}
                    >
                      <SelectTrigger className="shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="color">Colorido</SelectItem>
                        <SelectItem value="grayscale">Preto e Branco</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">Título Personalizado</h4>
                <Input
                  placeholder="Digite um título personalizado (opcional)"
                  value={printOptions.customTitle}
                  onChange={(e) => setPrintOptions((prev) => ({ ...prev, customTitle: e.target.value }))}
                  className="shadow-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                  onClick={handleAdvancedExportPDF}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white h-12 shadow-lg"
                  disabled={!printOptions.includeSummary && !printOptions.includeDetails}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
                <Button onClick={() => setShowPrintSelector(false)} variant="outline" className="h-12 shadow-md">
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showEditModal && editingTransaction && (
        <TransactionEditModal
          transaction={editingTransaction}
          onSave={handleSaveTransaction}
          onClose={() => {
            setShowEditModal(false)
            setEditingTransaction(null)
          }}
        />
      )}
    </div>
  )
}

export default Reports
