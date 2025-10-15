"use client"

import { createContext, useContext, useState, useEffect } from "react"
import {
  addTransaction as addTransactionToFirebase,
  getTransactions,
  getInventory,
  updateInventoryItem,
  updateTransaction as updateTransactionFirebase,
  deleteTransaction as deleteTransactionFirebase,
  subscribeToTransactions,
  subscribeToInventory,
  getDailyReports,
  getMonthlyReport,
  getYearlyReport,
} from "../lib/firebaseService"

const DataContext = createContext()

export const useData = () => useContext(DataContext)

const initialTransactions = [
  { id: 1, type: "compra", material: "plástico", weight: 10, pricePerKg: 2, total: 20, date: new Date().toISOString() },
  { id: 2, type: "venda", material: "vidro", weight: 5, pricePerKg: 3, total: 15, date: new Date().toISOString() },
]

export const DataProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([])
  const [inventory, setInventory] = useState({})
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [firebaseConnected, setFirebaseConnected] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(null)
  const [realTimeSync, setRealTimeSync] = useState(true)

  useEffect(() => {
    setLoading(true)
    console.log("[v0] Configurando listeners em tempo real...")

    let unsubscribeTransactions = null
    let unsubscribeInventory = null

    try {
      unsubscribeTransactions = subscribeToTransactions((firebaseTransactions) => {
        console.log(`[v0] Recebidas ${firebaseTransactions.length} transações do listener.`)
        setTransactions(firebaseTransactions)
        localStorage.setItem("recyclingTransactions", JSON.stringify(firebaseTransactions))
        setFirebaseConnected(true)
        setLastSyncTime(new Date())
        setLoading(false)
        setSyncing(false)
      })

      unsubscribeInventory = subscribeToInventory((firebaseInventory) => {
        console.log("[v0] Inventário atualizado pelo listener.")
        setInventory(firebaseInventory)
        localStorage.setItem("recycling_inventory", JSON.stringify(firebaseInventory))
      })

      console.log("[v0] Listeners em tempo real configurados com sucesso!")
    } catch (error) {
      console.error("[v0] Erro ao configurar listeners:", error)
      setFirebaseConnected(false)
      setLoading(false)

      try {
        const localData = localStorage.getItem("recyclingTransactions")
        setTransactions(localData ? JSON.parse(localData) : initialTransactions)

        const localInventory = localStorage.getItem("recycling_inventory")
        setInventory(localInventory ? JSON.parse(localInventory) : {})

        console.log("[v0] Usando dados locais como fallback")
      } catch (localError) {
        console.error("[v0] Erro ao carregar dados locais:", localError)
        setTransactions(initialTransactions)
        setInventory({})
      }
    }

    return () => {
      console.log("[v0] Desligando listeners...")
      if (unsubscribeTransactions) unsubscribeTransactions()
      if (unsubscribeInventory) unsubscribeInventory()
    }
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      console.log("[v0] Conexão restaurada")
      setFirebaseConnected(true)
    }

    const handleOffline = () => {
      console.log("[v0] Conexão perdida, modo offline ativado")
      setFirebaseConnected(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const refreshData = async () => {
    if (syncing) return
    try {
      setSyncing(true)
      console.log("[v0] Sincronizando dados do Firebase manualmente...")
      const [firebaseTransactions, firebaseInventory] = await Promise.all([getTransactions(), getInventory()])

      setTransactions(firebaseTransactions)
      localStorage.setItem("recyclingTransactions", JSON.stringify(firebaseTransactions))

      setInventory(firebaseInventory)
      localStorage.setItem("recycling_inventory", JSON.stringify(firebaseInventory))

      setLastSyncTime(new Date())
      console.log("[v0] Sincronização manual concluída.")
    } catch (error) {
      console.error("[v0] Erro ao sincronizar dados manualmente:", error)
      setFirebaseConnected(false)
    } finally {
      setSyncing(false)
    }
  }

  const addTransaction = async (transaction) => {
    try {
      console.log("[v0] DataContext: Adicionando transação:", transaction)

      const transactionDate = transaction.data instanceof Date ? transaction.data : new Date(transaction.data)

      const normalizedTransaction = {
        tipo: transaction.type || transaction.tipo,
        material: transaction.material,
        quantidade: transaction.weight || transaction.quantidade,
        precoUnitario: transaction.pricePerKg || transaction.precoUnitario,
        valorTotal: transaction.total || transaction.valorTotal,
        vendedor: transaction.vendedor || "",
        observacoes: transaction.observacoes || "",
        data: transactionDate,
        formaPagamento: transaction.formaPagamento || "dinheiro",
        numeroTransacao: transaction.numeroTransacao || "",
      }

      console.log("[v0] DataContext: Transação normalizada com data:", normalizedTransaction.data)

      await addTransactionToFirebase(normalizedTransaction)
    } catch (error) {
      console.error("[v0] DataContext: Erro ao adicionar transação ao Firebase:", error)
      setFirebaseConnected(false)

      const localTransaction = { ...transaction, id: Date.now(), date: new Date().toISOString(), synced: false }
      const updatedTransactions = [localTransaction, ...transactions]
      setTransactions(updatedTransactions)
      localStorage.setItem("recyclingTransactions", JSON.stringify(updatedTransactions))
      console.log("[v0] DataContext: Transação salva localmente como fallback")
    }
  }

  const editTransaction = async (id, updatedTransaction) => {
    try {
      console.log("[v0] DataContext: Editando transação:", id)

      const transactionDate =
        updatedTransaction.data instanceof Date ? updatedTransaction.data : new Date(updatedTransaction.data)

      const normalizedTransaction = {
        tipo: updatedTransaction.type || updatedTransaction.tipo,
        material: updatedTransaction.material,
        quantidade: updatedTransaction.weight || updatedTransaction.quantidade,
        precoUnitario: updatedTransaction.pricePerKg || updatedTransaction.precoUnitario,
        valorTotal: updatedTransaction.total || updatedTransaction.valorTotal,
        vendedor: updatedTransaction.vendedor || "",
        observacoes: updatedTransaction.observacoes || "",
        data: transactionDate,
        formaPagamento: updatedTransaction.formaPagamento || "dinheiro",
        numeroTransacao: updatedTransaction.numeroTransacao || "",
      }

      console.log("[v0] DataContext: Transação normalizada com data:", normalizedTransaction.data)

      await updateTransactionFirebase(id, normalizedTransaction)
    } catch (error) {
      console.error("[v0] DataContext: Erro ao editar transação:", error)
      setFirebaseConnected(false)

      const updatedTransactions = transactions.map((t) =>
        t.id === id ? { ...t, ...updatedTransaction, synced: false } : t,
      )
      setTransactions(updatedTransactions)
      localStorage.setItem("recyclingTransactions", JSON.stringify(updatedTransactions))
    }
  }

  const deleteTransaction = async (id) => {
    try {
      console.log("[v0] DataContext: Excluindo transação:", id)

      await deleteTransactionFirebase(id)

      console.log("[v0] DataContext: Transação excluída. Cloud Functions atualizarão o estoque automaticamente.")

      // Atualizar o estado local imediatamente para feedback visual
      setTransactions((prev) => prev.filter((t) => t.id !== id))
    } catch (error) {
      console.error("[v0] DataContext: Erro ao excluir transação:", error)
      setFirebaseConnected(false)

      // Fallback para exclusão local
      const updatedTransactions = transactions.filter((t) => t.id !== id)
      setTransactions(updatedTransactions)
      localStorage.setItem("recyclingTransactions", JSON.stringify(updatedTransactions))

      throw error
    }
  }

  const updateInventory = async (material, data) => {
    try {
      await updateInventoryItem(material, data)
    } catch (error) {
      console.error("Erro ao atualizar inventário:", error)
      const updatedInventory = { ...inventory, [material]: data }
      setInventory(updatedInventory)
      localStorage.setItem("recycling_inventory", JSON.stringify(updatedInventory))
    }
  }

  const fetchDailyReports = async (startDate, endDate) => {
    try {
      console.log("[v0] Fetching daily reports from aggregated collection:", { startDate, endDate })
      return await getDailyReports(startDate, endDate)
    } catch (error) {
      console.error("[v0] Erro ao buscar relatórios diários:", error)
      throw error
    }
  }

  const fetchMonthlyReport = async (year, month) => {
    try {
      console.log("[v0] Fetching monthly report from aggregated collection:", { year, month })
      return await getMonthlyReport(year, month)
    } catch (error) {
      console.error("[v0] Erro ao buscar relatório mensal:", error)
      throw error
    }
  }

  const fetchYearlyReport = async (year) => {
    try {
      console.log("[v0] Fetching yearly report from aggregated collection:", { year })
      return await getYearlyReport(year)
    } catch (error) {
      console.error("[v0] Erro ao buscar relatório anual:", error)
      throw error
    }
  }

  const value = {
    transactions,
    inventory,
    loading,
    syncing,
    firebaseConnected,
    lastSyncTime,
    realTimeSync,
    addTransaction,
    editTransaction,
    deleteTransaction,
    updateInventory,
    refreshData,
    toggleRealTimeSync: () => setRealTimeSync((prev) => !prev),
    fetchDailyReports,
    fetchMonthlyReport,
    fetchYearlyReport,
    // Legacy aliases for backward compatibility
    getDailyReports: fetchDailyReports,
    getMonthlyReport: fetchMonthlyReport,
    getYearlyReport: fetchYearlyReport,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
