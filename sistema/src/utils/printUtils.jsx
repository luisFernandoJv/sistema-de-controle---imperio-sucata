// src/utils/printUtils.jsx
import jsPDF from "jspdf"
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDate, getMaterialName } from "./reportUtils"

// =============================================
// FUNÇÕES DE CÁLCULO DE ESTATÍSTICAS AVANÇADAS
// =============================================

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
      materialAnalysis: {},
      paymentAnalysis: {},
      dailyAnalysis: {},
      clientAnalysis: {},
      supplierAnalysis: {},
    }
  }

  const stats = {
    totalSales: 0,
    salesCount: 0,
    totalPurchases: 0,
    purchasesCount: 0,
    totalExpenses: 0,
    expensesCount: 0,
    totalProfit: 0,
    profitMargin: 0,
    materialAnalysis: {},
    paymentAnalysis: {},
    dailyAnalysis: {},
    clientAnalysis: {},
    supplierAnalysis: {},
    topMaterials: [],
    topClients: [],
    topSuppliers: [],
    performanceMetrics: {},
  }

  // Processa cada transação
  transactions.forEach((t) => {
    const value = t.valorTotal || 0
    const material = t.material || 'Outros'
    const client = t.cliente || t.vendedor || 'Não informado'
    const supplier = t.fornecedor || 'Não informado'
    const payment = t.formaPagamento || 'dinheiro'
    const date = new Date(t.data).toISOString().split('T')[0]
    const quantity = t.quantidade || 0

    // Estatísticas por tipo
    switch (t.tipo) {
      case "venda":
        stats.totalSales += value
        stats.salesCount++
        
        // Análise de clientes
        if (!stats.clientAnalysis[client]) {
          stats.clientAnalysis[client] = { total: 0, transactions: 0, quantity: 0 }
        }
        stats.clientAnalysis[client].total += value
        stats.clientAnalysis[client].transactions++
        stats.clientAnalysis[client].quantity += quantity
        break
        
      case "compra":
        stats.totalPurchases += value
        stats.purchasesCount++
        
        // Análise de fornecedores
        if (!stats.supplierAnalysis[supplier]) {
          stats.supplierAnalysis[supplier] = { total: 0, transactions: 0, quantity: 0 }
        }
        stats.supplierAnalysis[supplier].total += value
        stats.supplierAnalysis[supplier].transactions++
        stats.supplierAnalysis[supplier].quantity += quantity
        break
        
      case "despesa":
        stats.totalExpenses += value
        stats.expensesCount++
        break
    }

    // Análise detalhada por material
    if (!stats.materialAnalysis[material]) {
      stats.materialAnalysis[material] = {
        vendas: 0,
        compras: 0,
        quantidadeVendas: 0,
        quantidadeCompras: 0,
        lucro: 0,
        transacoes: 0,
        precoMedioVenda: 0,
        precoMedioCompra: 0,
        margemLucro: 0,
        roi: 0
      }
    }

    if (t.tipo === 'venda') {
      stats.materialAnalysis[material].vendas += value
      stats.materialAnalysis[material].quantidadeVendas += quantity
    } else if (t.tipo === 'compra') {
      stats.materialAnalysis[material].compras += value
      stats.materialAnalysis[material].quantidadeCompras += quantity
    }
    
    stats.materialAnalysis[material].transacoes++
    
    // Atualiza preços médios
    if (stats.materialAnalysis[material].quantidadeVendas > 0) {
      stats.materialAnalysis[material].precoMedioVenda = 
        stats.materialAnalysis[material].vendas / stats.materialAnalysis[material].quantidadeVendas
    }
    if (stats.materialAnalysis[material].quantidadeCompras > 0) {
      stats.materialAnalysis[material].precoMedioCompra = 
        stats.materialAnalysis[material].compras / stats.materialAnalysis[material].quantidadeCompras
    }
    
    // Calcula lucro e margens
    stats.materialAnalysis[material].lucro = 
      stats.materialAnalysis[material].vendas - stats.materialAnalysis[material].compras
      
    stats.materialAnalysis[material].margemLucro = 
      stats.materialAnalysis[material].vendas > 0 ? 
      (stats.materialAnalysis[material].lucro / stats.materialAnalysis[material].vendas) * 100 : 0
      
    stats.materialAnalysis[material].roi = 
      stats.materialAnalysis[material].compras > 0 ? 
      (stats.materialAnalysis[material].lucro / stats.materialAnalysis[material].compras) * 100 : 0

    // Análise de pagamento
    if (!stats.paymentAnalysis[payment]) {
      stats.paymentAnalysis[payment] = { count: 0, total: 0, sales: 0, purchases: 0 }
    }
    stats.paymentAnalysis[payment].count++
    stats.paymentAnalysis[payment].total += value
    if (t.tipo === 'venda') stats.paymentAnalysis[payment].sales += value
    if (t.tipo === 'compra') stats.paymentAnalysis[payment].purchases += value

    // Análise diária
    if (!stats.dailyAnalysis[date]) {
      stats.dailyAnalysis[date] = {
        vendas: 0,
        compras: 0,
        despesas: 0,
        transacoes: 0,
        lucro: 0
      }
    }
    
    if (t.tipo === 'venda') stats.dailyAnalysis[date].vendas += value
    if (t.tipo === 'compra') stats.dailyAnalysis[date].compras += value
    if (t.tipo === 'despesa') stats.dailyAnalysis[date].despesas += value
    stats.dailyAnalysis[date].transacoes++
    stats.dailyAnalysis[date].lucro = stats.dailyAnalysis[date].vendas - stats.dailyAnalysis[date].compras - stats.dailyAnalysis[date].despesas
  })

  // Cálculos finais
  stats.totalProfit = stats.totalSales - stats.totalPurchases - stats.totalExpenses
  stats.profitMargin = stats.totalSales > 0 ? (stats.totalProfit / stats.totalSales) * 100 : 0

  // Top materiais por lucro
  stats.topMaterials = Object.entries(stats.materialAnalysis)
    .map(([material, data]) => ({
      material,
      ...data
    }))
    .sort((a, b) => b.lucro - a.lucro)
    .slice(0, 15)

  // Top clientes
  stats.topClients = Object.entries(stats.clientAnalysis)
    .map(([client, data]) => ({
      client,
      ...data,
      ticketMedio: data.transactions > 0 ? data.total / data.transactions : 0
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // Top fornecedores
  stats.topSuppliers = Object.entries(stats.supplierAnalysis)
    .map(([supplier, data]) => ({
      supplier,
      ...data,
      custoMedio: data.transactions > 0 ? data.total / data.transactions : 0
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // Métricas de performance
  stats.performanceMetrics = {
    ticketMedioVenda: stats.salesCount > 0 ? stats.totalSales / stats.salesCount : 0,
    ticketMedioCompra: stats.purchasesCount > 0 ? stats.totalPurchases / stats.purchasesCount : 0,
    rotatividadeEstoque: stats.totalPurchases > 0 ? stats.totalSales / stats.totalPurchases : 0,
    diasVendaMedia: stats.salesCount > 0 ? transactions.length / stats.salesCount : 0
  }

  return stats
}

// =============================================
// FUNÇÕES DE EXPORTAÇÃO
// =============================================

export const exportToCSV = (transactions, filename) => {
  if (!transactions || transactions.length === 0) {
    alert('Nenhum dado para exportar')
    return
  }

  try {
    const headers = [
      'Data', 'Tipo', 'Material', 'Quantidade', 
      'Preço Unitário', 'Valor Total', 'Forma Pagamento', 
      'Cliente/Fornecedor', 'Observações'
    ]
    
    const csvData = transactions.map(t => [
      formatDate(t.data),
      t.tipo,
      t.material || '',
      t.quantidade || 0,
      t.precoUnitario || 0,
      t.valorTotal || 0,
      t.formaPagamento || 'dinheiro',
      t.cliente || t.fornecedor || t.vendedor || '',
      t.observacoes || ''
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Erro ao exportar CSV:', error)
    alert('Erro ao exportar CSV: ' + error.message)
  }
}

export const exportToExcel = (transactions, filename) => {
  if (!transactions || transactions.length === 0) {
    alert('Nenhum dado para exportar')
    return
  }

  try {
    exportToCSV(transactions, filename.replace('.xlsx', '.csv'))
  } catch (error) {
    console.error('Erro ao exportar Excel:', error)
    alert('Erro ao exportar Excel: ' + error.message)
  }
}

// =============================================
// FUNÇÕES AUXILIARES PARA PDF - MELHORADAS
// =============================================

/**
 * Adiciona cabeçalho profissional ao PDF
 */
const addHeader = (doc, title, period, totalTransactions) => {
  const pageWidth = doc.internal.pageSize.width
  
  // Logo e título
  doc.setFontSize(18)
  doc.setTextColor(37, 99, 235)
  doc.text("IMPÉRIO SUCATA", 20, 20)
  
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text(title.toUpperCase(), 20, 32)
  
  // Informações do período
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`Período: ${period}`, 20, 42)
  doc.text(`Transações: ${totalTransactions}`, 20, 48)
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - 20, 42, { align: "right" })
  
  // Linha separadora
  doc.setDrawColor(200, 200, 200)
  doc.line(20, 53, pageWidth - 20, 53)
}

/**
 * Adiciona KPIs em destaque com layout melhorado
 */
const addKPISection = (doc, stats, yPos) => {
  const pageWidth = doc.internal.pageSize.width
  const kpiWidth = (pageWidth - 50) / 4
  let currentY = yPos

  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text("VISÃO GERAL DO PERÍODO", 20, currentY)
  currentY += 8

  const kpis = [
    { 
      label: "RECEITA TOTAL", 
      value: formatCurrency(stats.totalSales || 0),
      sublabel: `${stats.salesCount} vendas`,
      color: [22, 163, 74],
      icon: ""
    },
    { 
      label: "CUSTO AQUISIÇÃO", 
      value: formatCurrency(stats.totalPurchases || 0),
      sublabel: `${stats.purchasesCount} compras`,
      color: [234, 88, 12],
      icon: ""
    },
    { 
      label: "DESPESAS", 
      value: formatCurrency(stats.totalExpenses || 0),
      sublabel: `${stats.expensesCount} despesas`,
      color: [220, 38, 38],
      icon: ""
    },
    { 
      label: "LUCRO LÍQUIDO", 
      value: formatCurrency(stats.totalProfit || 0),
      sublabel: `Margem: ${(stats.profitMargin || 0).toFixed(1)}%`,
      color: stats.totalProfit >= 0 ? [22, 163, 74] : [220, 38, 38],
      icon: stats.totalProfit >= 0 ? "" : ""
    }
  ]

  kpis.forEach((kpi, index) => {
    const x = 20 + index * (kpiWidth + 2)
    
    // Fundo do KPI
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, currentY, kpiWidth, 22, 2, 2, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(x, currentY, kpiWidth, 22, 2, 2, 'S')
    
    // Ícone
    doc.setFontSize(10)
    doc.setTextColor(...kpi.color)
    doc.text(kpi.icon, x + 5, currentY + 8)
    
    // Label
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.text(kpi.label, x + 12, currentY + 7)
    
    // Valor principal
    doc.setFontSize(9)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(...kpi.color)
    const valueX = x + (kpiWidth / 2)
    doc.text(kpi.value, valueX, currentY + 14, { align: "center" })
    
    // Sublabel
    doc.setFontSize(6)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(kpi.sublabel, valueX, currentY + 18, { align: "center" })
  })

  return currentY + 30
}

/**
 * Análise comparativa de materiais com preços de compra e venda
 */
const addMaterialAnalysis = (doc, stats, yPos) => {
  let currentY = yPos

  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text("ANÁLISE COMPARATIVA POR MATERIAL - TOP 15", 20, currentY)
  currentY += 8

  if (stats.topMaterials && stats.topMaterials.length > 0) {
    const tableData = stats.topMaterials.map((item, index) => [
      { content: (index + 1).toString(), styles: { fontStyle: 'bold', fontSize: 7 } },
      { 
        content: getMaterialName(item.material).substring(0, 20), 
        styles: { fontSize: 7 } 
      },
      { 
        content: formatCurrency(item.precoMedioCompra || 0), 
        styles: { halign: 'right', fontSize: 7, textColor: [234, 88, 12] } 
      },
      { 
        content: formatCurrency(item.precoMedioVenda || 0), 
        styles: { halign: 'right', fontSize: 7, textColor: [22, 163, 74] } 
      },
      { 
        content: formatCurrency(item.vendas || 0), 
        styles: { halign: 'right', fontSize: 7 } 
      },
      { 
        content: formatCurrency(item.compras || 0), 
        styles: { halign: 'right', fontSize: 7 } 
      },
      { 
        content: formatCurrency(item.lucro || 0), 
        styles: { 
          halign: 'right', 
          fontSize: 7, 
          fontStyle: 'bold',
          textColor: item.lucro >= 0 ? [22, 163, 74] : [220, 38, 38] 
        } 
      },
      { 
        content: `${(item.margemLucro || 0).toFixed(1)}%`, 
        styles: { 
          halign: 'right', 
          fontSize: 7,
          textColor: item.margemLucro >= 0 ? [22, 163, 74] : [220, 38, 38] 
        } 
      },
      { 
        content: `${((item.quantidadeVendas || 0) + (item.quantidadeCompras || 0)).toFixed(0)} kg`, 
        styles: { halign: 'right', fontSize: 7 } 
      }
    ])

    autoTable(doc, {
      startY: currentY,
      head: [[
        '#', 'Material', 'Preço Compra', 'Preço Venda', 'Total Vendas', 'Total Compras', 
        'Lucro', 'Margem', 'Quantidade'
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7
      },
      styles: { 
        fontSize: 7,
        cellPadding: 1.5,
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 25 },
        2: { cellWidth: 18 },
        3: { cellWidth: 18 },
        4: { cellWidth: 18 },
        5: { cellWidth: 18 },
        6: { cellWidth: 18 },
        7: { cellWidth: 12 },
        8: { cellWidth: 15 }
      },
      margin: { left: 20, right: 20 },
    })

    currentY = doc.lastAutoTable.finalY + 8
  } else {
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text("Nenhum dado de material disponível para análise", 25, currentY)
    currentY += 12
  }

  return currentY
}

/**
 * Análise de performance com métricas avançadas
 */
const addPerformanceAnalysis = (doc, stats, yPos) => {
  let currentY = yPos

  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text("MÉTRICAS DE PERFORMANCE", 20, currentY)
  currentY += 8

  const metrics = [
    { label: "Ticket Médio de Venda", value: formatCurrency(stats.performanceMetrics.ticketMedioVenda || 0), color: [22, 163, 74] },
    { label: "Ticket Médio de Compra", value: formatCurrency(stats.performanceMetrics.ticketMedioCompra || 0), color: [234, 88, 12] },
    { label: "Rotatividade de Estoque", value: (stats.performanceMetrics.rotatividadeEstoque || 0).toFixed(2), color: [59, 130, 246] },
    { label: "Dias por Venda", value: (stats.performanceMetrics.diasVendaMedia || 0).toFixed(1), color: [139, 69, 255] },
  ]

  const metricWidth = (doc.internal.pageSize.width - 50) / 2
  let xPos = 20

  metrics.forEach((metric, index) => {
    if (index === 2) {
      xPos = 20
      currentY += 20
    }

    doc.setFillColor(248, 250, 252)
    doc.roundedRect(xPos, currentY, metricWidth, 16, 2, 2, 'F')
    
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(metric.label, xPos + 5, currentY + 6)
    
    doc.setFontSize(9)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(...metric.color)
    doc.text(metric.value, xPos + (metricWidth / 2), currentY + 12, { align: "center" })

    xPos += metricWidth + 10
  })

  return currentY + 25
}

/**
 * Análise de pagamentos detalhada
 */
const addPaymentAnalysis = (doc, stats, yPos) => {
  let currentY = yPos

  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text("ANÁLISE POR FORMA DE PAGAMENTO", 20, currentY)
  currentY += 8

  if (stats.paymentAnalysis && Object.keys(stats.paymentAnalysis).length > 0) {
    const totalVolume = stats.totalSales + stats.totalPurchases
    const paymentData = Object.entries(stats.paymentAnalysis)
      .map(([method, data]) => [
        method.toUpperCase(),
        data.count.toString(),
        formatCurrency(data.sales || 0),
        formatCurrency(data.purchases || 0),
        formatCurrency(data.total || 0),
        `${((data.total || 0) / totalVolume * 100).toFixed(1)}%`
      ])
      .sort((a, b) => parseFloat(b[4].replace('R$', '').replace('.', '').replace(',', '.')) - 
                      parseFloat(a[4].replace('R$', '').replace('.', '').replace(',', '.')))

    autoTable(doc, {
      startY: currentY,
      head: [['Forma Pagamento', 'Transações', 'Vendas', 'Compras', 'Valor Total', 'Participação']],
      body: paymentData,
      theme: 'grid',
      headStyles: { 
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7
      },
      styles: { 
        fontSize: 7,
        cellPadding: 1.5
      },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' }
      },
      margin: { left: 20, right: 20 },
    })

    currentY = doc.lastAutoTable.finalY + 8
  }

  return currentY
}

/**
 * Transações detalhadas com formatação melhorada
 */
const addDetailedTransactions = (doc, transactions, yPos) => {
  let currentY = yPos

  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text("DETALHAMENTO DAS TRANSAÇÕES", 20, currentY)
  currentY += 8

  if (transactions && transactions.length > 0) {
    const tableData = transactions.map((t) => {
      const tipo = t.tipo.toUpperCase()
      const color = tipo === 'VENDA' ? [22, 163, 74] : 
                   tipo === 'COMPRA' ? [234, 88, 12] : 
                   [220, 38, 38]
      
      return [
        { content: formatDate(t.data), styles: { fontSize: 6 } },
        { content: tipo, styles: { fontSize: 6, textColor: color, fontStyle: 'bold' } },
        { content: getMaterialName(t.material)?.substring(0, 15) || 'N/A', styles: { fontSize: 6 } },
        { content: `${(t.quantidade || 0).toFixed(1)} kg`, styles: { fontSize: 6, halign: 'right' } },
        { content: `R$ ${(t.precoUnitario || 0).toFixed(2)}`, styles: { fontSize: 6, halign: 'right' } },
        { content: `R$ ${(t.valorTotal || 0).toFixed(2)}`, styles: { fontSize: 6, halign: 'right', fontStyle: 'bold' } },
        { content: (t.formaPagamento || 'dinheiro').toUpperCase(), styles: { fontSize: 6 } },
        { content: (t.cliente || t.fornecedor || t.vendedor || '-').substring(0, 12), styles: { fontSize: 6 } },
        { content: (t.observacoes || '-').substring(0, 10), styles: { fontSize: 6 } }
      ]
    })

    autoTable(doc, {
      startY: currentY,
      head: [[
        'Data', 'Tipo', 'Material', 'Qtd', 'Preço/kg', 'Valor Total', 'Pagamento', 'Pessoa', 'Obs'
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [55, 65, 81],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 6
      },
      styles: { 
        fontSize: 6,
        cellPadding: 1,
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 12 },
        2: { cellWidth: 20 },
        3: { cellWidth: 12 },
        4: { cellWidth: 15 },
        5: { cellWidth: 18 },
        6: { cellWidth: 15 },
        7: { cellWidth: 18 },
        8: { cellWidth: 12 }
      },
      margin: { left: 20, right: 20 },
      pageBreak: 'auto',
    })

    currentY = doc.lastAutoTable.finalY + 8
  }

  return currentY
}

/**
 * Adiciona rodapé profissional
 */
const addFooter = (doc, pageNumber, totalPages) => {
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text(`Página ${pageNumber} de ${totalPages}`, 105, pageHeight - 8, { align: "center" })
  doc.text("Império Sucata - Relatório Gerencial Avançado", 20, pageHeight - 8)
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, doc.internal.pageSize.width - 20, pageHeight - 8, { align: "right" })
}

// =============================================
// FUNÇÃO PRINCIPAL PARA GERAÇÃO DE PDF
// =============================================

export const generateAdvancedPDF = async (reportData, options = {}) => {
  const {
    type = "completo",
    title = "RELATÓRIO COMPLETO",
    includeSummary = true,
    includeDetails = true,
    includePaymentAnalysis = true,
    includeMaterialAnalysis = true,
    includePerformanceAnalysis = true,
    pageOrientation = "portrait",
    colorMode = "color"
  } = options

  try {
    const doc = new jsPDF({
      orientation: pageOrientation,
      unit: 'mm',
      format: 'a4'
    })

    const period = `${reportData.period.start} - ${reportData.period.end}`
    const totalTransactions = reportData.transactions?.length || 0
    let yPos = 65

    // Cabeçalho profissional
    addHeader(doc, title, period, totalTransactions)

    // KPIs em destaque
    if (includeSummary && reportData.stats) {
      yPos = addKPISection(doc, reportData.stats, yPos)
    }

    // Análise de performance
    if (includePerformanceAnalysis && reportData.stats) {
      yPos = addPerformanceAnalysis(doc, reportData.stats, yPos)
    }

    // Análise de materiais (sempre incluir se houver dados)
    if (reportData.stats?.topMaterials?.length > 0) {
      if (yPos > 200) {
        doc.addPage()
        yPos = 20
      }
      yPos = addMaterialAnalysis(doc, reportData.stats, yPos)
    }

    // Análise de pagamentos
    if (includePaymentAnalysis && reportData.stats) {
      if (yPos > 220) {
        doc.addPage()
        yPos = 20
      }
      yPos = addPaymentAnalysis(doc, reportData.stats, yPos)
    }

    // Transações detalhadas
    if (includeDetails && reportData.transactions && reportData.transactions.length > 0) {
      if (yPos > 180) {
        doc.addPage()
        yPos = 20
      }
      addDetailedTransactions(doc, reportData.transactions, yPos)
    }

    // Rodapé em todas as páginas
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      addFooter(doc, i, pageCount)
    }

    // Salvar o PDF
    const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().getTime()}.pdf`
    doc.save(filename)
    
    return true
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    throw new Error(`Falha ao gerar PDF: ${error.message}`)
  }
}

// =============================================
// FUNÇÕES ESPECÍFICAS PARA TIPOS DE RELATÓRIO
// =============================================

export const generateFinancialPDF = async (summaryData, filters) => {
  const reportData = {
    transactions: [],
    stats: summaryData,
    period: {
      start: formatDate(filters.startDate),
      end: formatDate(filters.endDate)
    }
  }
  return generateAdvancedPDF(reportData, { 
    title: "RELATÓRIO FINANCEIRO DETALHADO",
    includeDetails: false,
    includePerformanceAnalysis: true
  })
}

export const generateMaterialPDF = async (summaryData, filters) => {
  const reportData = {
    transactions: [],
    stats: summaryData,
    period: {
      start: formatDate(filters.startDate),
      end: formatDate(filters.endDate)
    }
  }
  return generateAdvancedPDF(reportData, { 
    title: "ANÁLISE ESTRATÉGICA POR MATERIAL",
    includePaymentAnalysis: false,
    includePerformanceAnalysis: false,
    includeMaterialAnalysis: true
  })
}

export const generateDailyPDF = async (summaryData, filters) => {
  const reportData = {
    transactions: [],
    stats: summaryData,
    period: {
      start: formatDate(filters.startDate),
      end: formatDate(filters.endDate)
    }
  }
  return generateAdvancedPDF(reportData, { 
    title: "RELATÓRIO DIÁRIO EXECUTIVO",
    includeDetails: true,
    includePerformanceAnalysis: true
  })
}