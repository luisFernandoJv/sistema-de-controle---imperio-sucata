export const aggregateDailyData = (dailyReports) => {
  if (!dailyReports || dailyReports.length === 0) {
    return {
      totalVendas: 0,
      totalCompras: 0,
      totalDespesas: 0,
      totalLucro: 0,
      totalTransacoes: 0,
      materialStats: {},
      paymentStats: {},
      dailyData: [],
    }
  }

  const aggregated = {
    totalVendas: 0,
    totalCompras: 0,
    totalDespesas: 0,
    totalLucro: 0,
    totalTransacoes: 0,
    materialStats: {},
    paymentStats: {},
    dailyData: [],
  }

  dailyReports.forEach((report) => {
    // Aggregate totals
    aggregated.totalVendas += report.totalSales || 0
    aggregated.totalCompras += report.totalPurchases || 0
    aggregated.totalDespesas += report.totalExpenses || 0
    aggregated.totalLucro += report.totalProfit || 0
    aggregated.totalTransacoes += report.totalTransactions || 0

    // Aggregate material stats
    Object.entries(report.materialStats || {}).forEach(([material, stats]) => {
      if (!aggregated.materialStats[material]) {
        aggregated.materialStats[material] = {
          vendas: 0,
          compras: 0,
          quantidade: 0,
          lucro: 0,
        }
      }
      aggregated.materialStats[material].vendas += stats.vendas || 0
      aggregated.materialStats[material].compras += stats.compras || 0
      aggregated.materialStats[material].quantidade += stats.quantidade || 0
      aggregated.materialStats[material].lucro += stats.lucro || 0
    })

    // Aggregate payment stats
    Object.entries(report.paymentStats || {}).forEach(([method, amount]) => {
      if (!aggregated.paymentStats[method]) {
        aggregated.paymentStats[method] = 0
      }
      aggregated.paymentStats[method] += amount
    })

    // Store daily data for charts
    aggregated.dailyData.push({
      date: report.date,
      vendas: report.totalSales || 0,
      compras: report.totalPurchases || 0,
      lucro: report.totalProfit || 0,
      transacoes: report.totalTransactions || 0,
    })
  })

  // Calculate margins for materials
  Object.keys(aggregated.materialStats).forEach((material) => {
    const stats = aggregated.materialStats[material]
    stats.margem = stats.vendas > 0 ? ((stats.lucro / stats.vendas) * 100).toFixed(2) : 0
  })

  return aggregated
}

export const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export const formatDate = (date) => {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date))
}

export const getMaterialName = (material) => {
  const names = {
    ferro: "Ferro",
    aluminio: "Alumínio",
    cobre: "Cobre",
    latinha: "Latinha",
    panela: "Panela",
    bloco2: "Bloco 2",
    chapa: "Chapa",
    perfil: "Perfil",
    bloco: "Bloco",
    metal: "Metal",
    inox: "Inox",
    bateria: "Bateria",
    motor_gel: "Motor/Gel",
    roda: "Roda",
    papelao: "Papelão",
    rad_metal: "Radiador Metal",
    rad_cobre: "Radiador Cobre",
    rad_chapa: "Radiador Chapa",
    tela: "Tela",
    antimonio: "Antimônio",
    cabo_ai: "Cabo AI",
    tubo_limpo: "Tubo Limpo",
  }
  return names[material] || material
}

// Adicione esta função dentro do seu arquivo reportUtils.js

export const calculateReportStats = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return {
      totalSales: 0,
      salesCount: 0,
      totalPurchases: 0,
      purchasesCount: 0,
      totalExpenses: 0,
      expensesCount: 0,
      totalProfit: 0,
      profitMargin: 0,
      materialStats: {},
      paymentStats: {},
    }
  }

  const stats = {
    totalSales: 0,
    salesCount: 0,
    totalPurchases: 0,
    purchasesCount: 0,
    totalExpenses: 0,
    expensesCount: 0,
    materialStats: {},
    paymentStats: {},
  }

  transactions.forEach((t) => {
    const value = t.valorTotal || 0

    switch (t.tipo) {
      case "venda":
        stats.totalSales += value
        stats.salesCount++
        break
      case "compra":
        stats.totalPurchases += value
        stats.purchasesCount++
        break
      case "despesa":
        stats.totalExpenses += value
        stats.expensesCount++
        break
      default:
        break
    }
  })

  stats.totalProfit = stats.totalSales - stats.totalPurchases - stats.totalExpenses
  stats.profitMargin = stats.totalSales > 0 ? (stats.totalProfit / stats.totalSales) * 100 : 0

  return stats
}