import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  getDoc,
  where,
} from "firebase/firestore"
import { db } from "./firebase"

// Coleções do Firestore
const TRANSACTIONS_COLLECTION = "transactions"
const INVENTORY_COLLECTION = "inventory"
const DAILY_REPORTS_COLLECTION = "daily_reports"

// Funções para Transações
export const addTransaction = async (transaction) => {
  try {
    const transactionData = {
      ...transaction,
      createdAt: new Date(),
      // Garantir que a data seja um objeto Date válido
      data: transaction.data instanceof Date ? transaction.data : new Date(transaction.data),
    }

    console.log("[v0] Salvando transação com data:", transactionData.data)

    const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), transactionData)
    console.log("[v0] Transação salva com ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("[v0] Erro ao adicionar transação:", error)
    throw error
  }
}

export const getTransactions = async () => {
  try {
    const q = query(collection(db, TRANSACTIONS_COLLECTION), orderBy("data", "desc"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      data: doc.data().data.toDate(),
    }))
  } catch (error) {
    console.error("Erro ao buscar transações:", error)
    throw error
  }
}

export const updateTransaction = async (id, transaction) => {
  try {
    const docRef = doc(db, TRANSACTIONS_COLLECTION, id)
    const updateData = {
      ...transaction,
      // Garantir que a data seja um objeto Date válido
      data: transaction.data instanceof Date ? transaction.data : new Date(transaction.data),
      updatedAt: new Date(),
    }

    console.log("[v0] Atualizando transação com data:", updateData.data)

    await updateDoc(docRef, updateData)
    console.log("[v0] Transação atualizada com sucesso")
  } catch (error) {
    console.error("[v0] Erro ao atualizar transação:", error)
    throw error
  }
}

export const deleteTransaction = async (id) => {
  try {
    console.log("[v0] Deletando transação:", id)
    const docRef = doc(db, TRANSACTIONS_COLLECTION, id)
    await deleteDoc(docRef)
    console.log("[v0] Transação deletada com sucesso")
  } catch (error) {
    console.error("[v0] Erro ao deletar transação:", error)
    throw error
  }
}

// Funções para Inventário
export const getInventory = async () => {
  try {
    const docRef = doc(db, INVENTORY_COLLECTION, "current")
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data()
    } else {
      const initialInventory = {
        ferro: { quantidade: 0, precoCompra: 2.5, precoVenda: 3.2 },
        aluminio: { quantidade: 0, precoCompra: 8.5, precoVenda: 10.8 },
        cobre: { quantidade: 0, precoCompra: 25.0, precoVenda: 32.0 },
        latinha: { quantidade: 0, precoCompra: 4.2, precoVenda: 5.5 },
        panela: { quantidade: 0, precoCompra: 3.0, precoVenda: 4.0 },
        bloco2: { quantidade: 0, precoCompra: 1.8, precoVenda: 2.5 },
        chapa: { quantidade: 0, precoCompra: 2.2, precoVenda: 3.0 },
        perfil: { quantidade: 0, precoCompra: 2.8, precoVenda: 3.8 },
        bloco: { quantidade: 0, precoCompra: 1.5, precoVenda: 2.2 },
        metal: { quantidade: 0, precoCompra: 2.0, precoVenda: 2.8 },
        inox: { quantidade: 0, precoCompra: 12.0, precoVenda: 15.0 },
        bateria: { quantidade: 0, precoCompra: 8.0, precoVenda: 12.0 },
        motor_gel: { quantidade: 0, precoCompra: 15.0, precoVenda: 20.0 },
        roda: { quantidade: 0, precoCompra: 5.0, precoVenda: 7.0 },
        papelao: { quantidade: 0, precoCompra: 0.8, precoVenda: 1.2 },
        rad_metal: { quantidade: 0, precoCompra: 3.5, precoVenda: 4.5 },
        rad_cobre: { quantidade: 0, precoCompra: 28.0, precoVenda: 35.0 },
        rad_chapa: { quantidade: 0, precoCompra: 2.8, precoVenda: 3.6 },
        tela: { quantidade: 0, precoCompra: 1.5, precoVenda: 2.0 },
        antimonio: { quantidade: 0, precoCompra: 45.0, precoVenda: 55.0 },
        cabo_ai: { quantidade: 0, precoCompra: 12.0, precoVenda: 16.0 },
        tubo_limpo: { quantidade: 0, precoCompra: 4.0, precoVenda: 5.5 },
      }
      await setDoc(docRef, initialInventory)
      return initialInventory
    }
  } catch (error) {
    console.error("Erro ao buscar inventário:", error)
    throw error
  }
}

export const updateInventory = async (inventory) => {
  try {
    const docRef = doc(db, INVENTORY_COLLECTION, "current")
    await setDoc(docRef, {
      ...inventory,
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error("Erro ao atualizar inventário:", error)
    throw error
  }
}

export const updateInventoryQuantity = async (material, quantidade, tipo) => {
  try {
    const docRef = doc(db, INVENTORY_COLLECTION, "current")
    const docSnap = await getDoc(docRef)

    let currentInventory = {}
    if (docSnap.exists()) {
      currentInventory = docSnap.data()
    }

    if (!currentInventory[material]) {
      currentInventory[material] = { quantidade: 0, precoCompra: 0, precoVenda: 0 }
    }

    if (tipo === "compra") {
      currentInventory[material].quantidade += quantidade
    } else if (tipo === "venda") {
      currentInventory[material].quantidade = Math.max(0, currentInventory[material].quantidade - quantidade)
    }

    currentInventory[material].updatedAt = new Date()

    await setDoc(docRef, currentInventory)
    return currentInventory[material].quantidade
  } catch (error) {
    console.error("Erro ao atualizar quantidade do inventário:", error)
    throw error
  }
}

// Inventory is now automatically synced by Cloud Functions on every transaction

// Função para escutar mudanças em tempo real nas transações
export const subscribeToTransactions = (callback) => {
  const q = query(collection(db, TRANSACTIONS_COLLECTION), orderBy("data", "desc"))
  return onSnapshot(q, (querySnapshot) => {
    const transactions = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      data: doc.data().data.toDate(),
    }))
    callback(transactions)
  })
}

// Função para escutar mudanças em tempo real no inventário
export const subscribeToInventory = (callback) => {
  const docRef = doc(db, INVENTORY_COLLECTION, "current")
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data())
    }
  })
}

export const getDailyReports = async (startDate, endDate) => {
  try {
    console.log("[v0] Fetching from daily_reports collection (OPTIMIZED):", { startDate, endDate })

    // Ensure dates are properly formatted
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)

    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const q = query(
      collection(db, DAILY_REPORTS_COLLECTION),
      where("date", ">=", start),
      where("date", "<=", end),
      orderBy("date", "desc"),
    )

    const querySnapshot = await getDocs(q)
    const reports = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
    }))

    console.log(`[v0] ✅ Fetched ${reports.length} daily reports (${reports.length} reads)`)
    return reports
  } catch (error) {
    console.error("[v0] ❌ Erro ao buscar relatórios diários:", error)
    throw error
  }
}

export const getMonthlyReport = async (year, month) => {
  try {
    console.log("[v0] Generating monthly report from daily_reports (OPTIMIZED):", { year, month })

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const dailyReports = await getDailyReports(startDate, endDate)

    // Aggregate daily reports into monthly summary
    const monthlyStats = {
      year,
      month,
      totalSales: 0,
      totalPurchases: 0,
      totalExpenses: 0,
      totalProfit: 0,
      totalTransactions: 0,
      materialStats: {},
      dailyBreakdown: dailyReports,
    }

    dailyReports.forEach((report) => {
      monthlyStats.totalSales += report.totalSales || 0
      monthlyStats.totalPurchases += report.totalPurchases || 0
      monthlyStats.totalExpenses += report.totalExpenses || 0
      monthlyStats.totalProfit += report.totalProfit || 0
      monthlyStats.totalTransactions += report.totalTransactions || 0

      // Merge material stats
      Object.entries(report.materialStats || {}).forEach(([material, stats]) => {
        if (!monthlyStats.materialStats[material]) {
          monthlyStats.materialStats[material] = {
            vendas: 0,
            compras: 0,
            quantidade: 0,
            lucro: 0,
          }
        }
        monthlyStats.materialStats[material].vendas += stats.vendas || 0
        monthlyStats.materialStats[material].compras += stats.compras || 0
        monthlyStats.materialStats[material].quantidade += stats.quantidade || 0
        monthlyStats.materialStats[material].lucro += stats.lucro || 0
      })
    })

    console.log(`[v0] ✅ Monthly report generated from ${dailyReports.length} daily reports`)
    return monthlyStats
  } catch (error) {
    console.error("[v0] ❌ Erro ao gerar relatório mensal:", error)
    throw error
  }
}

export const getYearlyReport = async (year) => {
  try {
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59)

    const dailyReports = await getDailyReports(startDate, endDate)

    // Aggregate into yearly summary
    const yearlyStats = {
      year,
      totalSales: 0,
      totalPurchases: 0,
      totalExpenses: 0,
      totalProfit: 0,
      totalTransactions: 0,
      materialStats: {},
      monthlyBreakdown: {},
    }

    dailyReports.forEach((report) => {
      const month = report.date.getMonth() + 1

      if (!yearlyStats.monthlyBreakdown[month]) {
        yearlyStats.monthlyBreakdown[month] = {
          totalSales: 0,
          totalPurchases: 0,
          totalExpenses: 0,
          totalProfit: 0,
          totalTransactions: 0,
        }
      }

      yearlyStats.totalSales += report.totalSales || 0
      yearlyStats.totalPurchases += report.totalPurchases || 0
      yearlyStats.totalExpenses += report.totalExpenses || 0
      yearlyStats.totalProfit += report.totalProfit || 0
      yearlyStats.totalTransactions += report.totalTransactions || 0

      yearlyStats.monthlyBreakdown[month].totalSales += report.totalSales || 0
      yearlyStats.monthlyBreakdown[month].totalPurchases += report.totalPurchases || 0
      yearlyStats.monthlyBreakdown[month].totalExpenses += report.totalExpenses || 0
      yearlyStats.monthlyBreakdown[month].totalProfit += report.totalProfit || 0
      yearlyStats.monthlyBreakdown[month].totalTransactions += report.totalTransactions || 0

      // Merge material stats
      Object.entries(report.materialStats || {}).forEach(([material, stats]) => {
        if (!yearlyStats.materialStats[material]) {
          yearlyStats.materialStats[material] = {
            vendas: 0,
            compras: 0,
            quantidade: 0,
            lucro: 0,
          }
        }
        yearlyStats.materialStats[material].vendas += stats.vendas || 0
        yearlyStats.materialStats[material].compras += stats.compras || 0
        yearlyStats.materialStats[material].quantidade += stats.quantidade || 0
        yearlyStats.materialStats[material].lucro += stats.lucro || 0
      })
    })

    return yearlyStats
  } catch (error) {
    console.error("Erro ao gerar relatório anual:", error)
    throw error
  }
}

// Funções avançadas para relatórios
// Only use for specific transaction lookups, NOT for reports
export const getTransactionsByDateRange = async (startDate, endDate) => {
  console.warn(
    "[v0] ⚠️ WARNING: getTransactionsByDateRange fetches ALL transactions! Use getDailyReports instead for reports.",
  )
  try {
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where("data", ">=", new Date(startDate)),
      where("data", "<=", new Date(endDate)),
      orderBy("data", "desc"),
    )
    const querySnapshot = await getDocs(q)
    const transactions = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      data: doc.data().data.toDate(),
    }))

    console.log(`[v0] ⚠️ Fetched ${transactions.length} transactions (EXPENSIVE: ${transactions.length} reads)`)
    return transactions
  } catch (error) {
    console.error("[v0] Erro ao buscar transações por período:", error)
    throw error
  }
}

export const getAggregatedStats = async () => {
  try {
    const transactions = await getTransactions()

    const stats = {
      totalVendas: 0,
      totalCompras: 0,
      totalTransacoes: transactions.length,
      materialStats: {},
      monthlyStats: {},
    }

    transactions.forEach((transaction) => {
      const month = new Date(transaction.data).toISOString().slice(0, 7)

      if (transaction.tipo === "venda") {
        stats.totalVendas += transaction.valorTotal
      } else {
        stats.totalCompras += transaction.valorTotal
      }

      if (!stats.materialStats[transaction.material]) {
        stats.materialStats[transaction.material] = { vendas: 0, compras: 0, quantidade: 0 }
      }

      if (transaction.tipo === "venda") {
        stats.materialStats[transaction.material].vendas += transaction.valorTotal
      } else {
        stats.materialStats[transaction.material].compras += transaction.valorTotal
      }
      stats.materialStats[transaction.material].quantidade += transaction.quantidade

      if (!stats.monthlyStats[month]) {
        stats.monthlyStats[month] = { vendas: 0, compras: 0, transacoes: 0 }
      }

      if (transaction.tipo === "venda") {
        stats.monthlyStats[month].vendas += transaction.valorTotal
      } else {
        stats.monthlyStats[month].compras += transaction.valorTotal
      }
      stats.monthlyStats[month].transacoes++
    })

    return stats
  } catch (error) {
    console.error("Erro ao calcular estatísticas:", error)
    throw error
  }
}

export const backupData = async () => {
  try {
    const transactions = await getTransactions()
    const inventory = await getInventory()

    const backup = {
      transactions,
      inventory,
      timestamp: new Date().toISOString(),
      version: "1.0",
    }

    return backup
  } catch (error) {
    console.error("Erro ao fazer backup:", error)
    throw error
  }
}

export const updateInventoryItem = async (material, data) => {
  try {
    const docRef = doc(db, INVENTORY_COLLECTION, "current")
    const docSnap = await getDoc(docRef)

    let currentInventory = {}
    if (docSnap.exists()) {
      currentInventory = docSnap.data()
    }

    currentInventory[material] = {
      ...data,
      updatedAt: new Date(),
    }

    await setDoc(docRef, currentInventory)
  } catch (error) {
    console.error("Erro ao atualizar item do inventário:", error)
    throw error
  }
}

export const syncLocalDataToFirebase = async () => {
  try {
    const localTransactions = JSON.parse(localStorage.getItem("recycling_transactions") || "[]")
    const localInventory = JSON.parse(localStorage.getItem("recycling_inventory") || "{}")

    const firebaseTransactions = await getTransactions()
    const firebaseIds = new Set(firebaseTransactions.map((t) => t.localId || t.id))

    const unsyncedTransactions = localTransactions.filter((t) => !firebaseIds.has(t.id) && t.synced !== true)

    for (const transaction of unsyncedTransactions) {
      const normalizedTransaction = {
        tipo: transaction.tipo || transaction.type,
        material: transaction.material,
        quantidade: transaction.quantidade || transaction.weight,
        precoUnitario: transaction.precoUnitario || transaction.pricePerKg,
        valorTotal: transaction.valorTotal || transaction.total,
        vendedor: transaction.vendedor || "",
        observacoes: transaction.observacoes || "",
        data: transaction.data || transaction.date,
        localId: transaction.id,
      }

      await addTransaction(normalizedTransaction)
    }

    if (Object.keys(localInventory).length > 0) {
      await updateInventory(localInventory)
    }

    console.log(`Sincronizados ${unsyncedTransactions.length} transações com Firebase`)
    return { syncedTransactions: unsyncedTransactions.length }
  } catch (error) {
    console.error("Erro na sincronização:", error)
    throw error
  }
}
