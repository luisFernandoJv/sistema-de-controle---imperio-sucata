"use client"

import { useState, useEffect, useCallback } from "react"
import { useData } from "../contexts/DataContext"
import { calculateReportStats } from "../utils/printUtils"

export const useReports = (initialFilters = {}) => {
  const { transactions, firebaseConnected, syncing, refreshData, editTransaction, deleteTransaction, lastSyncTime } =
    useData()

  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(),
  })

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    material: "",
    tipo: "",
    formaPagamento: "",
    cliente: "",
    valorMin: "",
    valorMax: "",
    periodo: "todos",
    searchTerm: "",
    ...initialFilters,
  })

  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [reportStats, setReportStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      const startDate = dateRange.from.toISOString().split("T")[0]
      const endDate = dateRange.to.toISOString().split("T")[0]

      // Só atualiza se as datas realmente mudaram
      if (filters.startDate !== startDate || filters.endDate !== endDate) {
        setFilters((prev) => ({
          ...prev,
          startDate,
          endDate,
          periodo: "personalizado", // Marca como período personalizado
        }))
      }
    }
  }, [dateRange])

  useEffect(() => {
    try {
      let filtered = [...transactions]

      // Filtro de período rápido
      if (filters.periodo !== "todos" && filters.periodo !== "personalizado") {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (filters.periodo === "hoje") {
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          filtered = filtered.filter((t) => {
            if (!t.data) return false
            const transactionDate = new Date(t.data)
            return transactionDate >= today && transactionDate < tomorrow
          })
        } else if (filters.periodo === "semana") {
          const weekStart = new Date(today)
          weekStart.setDate(today.getDate() - today.getDay())
          filtered = filtered.filter((t) => {
            if (!t.data) return false
            return new Date(t.data) >= weekStart
          })
        } else if (filters.periodo === "mes") {
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
          filtered = filtered.filter((t) => {
            if (!t.data) return false
            return new Date(t.data) >= monthStart
          })
        } else if (filters.periodo === "trimestre") {
          const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
          filtered = filtered.filter((t) => {
            if (!t.data) return false
            return new Date(t.data) >= quarterStart
          })
        } else if (filters.periodo === "ano") {
          const yearStart = new Date(today.getFullYear(), 0, 1)
          filtered = filtered.filter((t) => {
            if (!t.data) return false
            return new Date(t.data) >= yearStart
          })
        }
      }

      // Filtros de data customizados (usados quando periodo é "personalizado")
      if (filters.startDate && filters.periodo === "personalizado") {
        const start = new Date(filters.startDate)
        start.setHours(0, 0, 0, 0)
        filtered = filtered.filter((t) => {
          if (!t.data) return false
          const transactionDate = new Date(t.data)
          transactionDate.setHours(0, 0, 0, 0)
          return transactionDate >= start
        })
      }

      if (filters.endDate && filters.periodo === "personalizado") {
        const end = new Date(filters.endDate)
        end.setHours(23, 59, 59, 999)
        filtered = filtered.filter((t) => {
          if (!t.data) return false
          const transactionDate = new Date(t.data)
          return transactionDate <= end
        })
      }

      // Filtro de material (case-insensitive)
      if (filters.material) {
        const materialLower = filters.material.toLowerCase().trim()
        filtered = filtered.filter((t) => {
          if (!t.material) return false
          return t.material.toLowerCase().trim() === materialLower
        })
      }

      // Filtro de tipo
      if (filters.tipo) {
        const tipoLower = filters.tipo.toLowerCase().trim()
        filtered = filtered.filter((t) => {
          if (!t.tipo) return false
          return t.tipo.toLowerCase().trim() === tipoLower
        })
      }

      // Filtro de forma de pagamento (handle null/undefined)
      if (filters.formaPagamento) {
        const formaPagamentoLower = filters.formaPagamento.toLowerCase().trim()
        filtered = filtered.filter((t) => {
          // Se não tem forma de pagamento definida, considera como "dinheiro"
          const formaPagamento = (t.formaPagamento || "dinheiro").toLowerCase().trim()
          return formaPagamento === formaPagamentoLower
        })
      }

      // Filtro de cliente/fornecedor/vendedor
      if (filters.cliente) {
        const clienteLower = filters.cliente.toLowerCase().trim()
        filtered = filtered.filter(
          (t) =>
            (t.cliente && t.cliente.toLowerCase().includes(clienteLower)) ||
            (t.fornecedor && t.fornecedor.toLowerCase().includes(clienteLower)) ||
            (t.vendedor && t.vendedor.toLowerCase().includes(clienteLower)),
        )
      }

      // Filtro de valor mínimo
      if (filters.valorMin) {
        const minValue = Number.parseFloat(filters.valorMin)
        if (!isNaN(minValue)) {
          filtered = filtered.filter((t) => (t.valorTotal || 0) >= minValue)
        }
      }

      // Filtro de valor máximo
      if (filters.valorMax) {
        const maxValue = Number.parseFloat(filters.valorMax)
        if (!isNaN(maxValue)) {
          filtered = filtered.filter((t) => (t.valorTotal || 0) <= maxValue)
        }
      }

      // Busca por termo (case-insensitive, busca em múltiplos campos)
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase().trim()
        filtered = filtered.filter(
          (t) =>
            (t.material && t.material.toLowerCase().includes(term)) ||
            (t.cliente && t.cliente.toLowerCase().includes(term)) ||
            (t.fornecedor && t.fornecedor.toLowerCase().includes(term)) ||
            (t.vendedor && t.vendedor.toLowerCase().includes(term)) ||
            (t.formaPagamento && t.formaPagamento.toLowerCase().includes(term)) ||
            (t.tipo && t.tipo.toLowerCase().includes(term)) ||
            (t.observacoes && t.observacoes.toLowerCase().includes(term)) ||
            (t.valorTotal && t.valorTotal.toString().includes(term)) ||
            (t.quantidade && t.quantidade.toString().includes(term)),
        )
      }

      // Ordenar por data (mais recente primeiro)
      filtered.sort((a, b) => {
        if (!a.data) return 1
        if (!b.data) return -1
        return new Date(b.data) - new Date(a.data)
      })

      setFilteredTransactions(filtered)

      // Calcular estatísticas
      if (filtered.length > 0) {
        const stats = calculateReportStats(filtered)
        setReportStats(stats)
      } else {
        setReportStats(null)
      }

      setLoading(false)
    } catch (err) {
      console.error("[v0] Erro ao filtrar transações:", err)
      setError(err.message)
      setLoading(false)
    }
  }, [transactions, filters])

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const setMonthYear = useCallback((month, year) => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    setDateRange({
      from: firstDay,
      to: lastDay,
    })

    setFilters((prev) => ({
      ...prev,
      periodo: "personalizado",
      startDate: firstDay.toISOString().split("T")[0],
      endDate: lastDay.toISOString().split("T")[0],
    }))
  }, [])

  const navigateMonth = useCallback(
    (direction) => {
      const currentDate = dateRange.from || new Date()
      const newDate = new Date(currentDate)

      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }

      setMonthYear(newDate.getMonth(), newDate.getFullYear())
    },
    [dateRange, setMonthYear],
  )

  const clearFilters = useCallback(() => {
    const today = new Date()
    setFilters({
      startDate: "",
      endDate: "",
      material: "",
      tipo: "",
      formaPagamento: "",
      cliente: "",
      valorMin: "",
      valorMax: "",
      periodo: "todos",
      searchTerm: "",
    })
    setDateRange({
      from: today,
      to: today,
    })
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      await refreshData()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [refreshData])

  return {
    // Dados
    filteredTransactions,
    reportStats,
    filteredStats: reportStats,

    // Filtros
    filters,
    setFilters: updateFilters,
    clearFilters,

    dateRange,
    setDateRange,
    setMonthYear,
    navigateMonth,

    // Estado
    loading,
    error,
    firebaseConnected,
    syncing,

    // Ações
    refresh,
    editTransaction,
    deleteTransaction,

    lastSyncTime,
  }
}
