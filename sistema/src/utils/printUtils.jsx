// src/utils/printUtils.jsx
import jsPDF from "jspdf"
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDate, getMaterialName } from "./reportUtils"

// =============================================
// CONFIGURAÇÕES DO PDF
// =============================================

const PDF_CONFIG = {
  MARGIN: {
    TOP: 20,
    LEFT: 15,
    RIGHT: 15,
    BOTTOM: 20
  },
  FONT: {
    SIZE: {
      LARGE: 16,
      MEDIUM: 12,
      SMALL: 9,
      XSMALL: 8
    }
  },
  TABLE: {
    PADDING: 3,
    LINE_WIDTH: 0.1
  },
  COLORS: {
    PRIMARY: [37, 99, 235],
    SUCCESS: [22, 163, 74],
    WARNING: [234, 88, 12],
    DANGER: [220, 38, 38],
    INFO: [59, 130, 246],
    GRAY: [100, 100, 100],
    LIGHT_GRAY: [200, 200, 200]
  }
}

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
  doc.setTextColor(...PDF_CONFIG.COLORS.PRIMARY)
  doc.text("IMPÉRIO SUCATA", PDF_CONFIG.MARGIN.LEFT, PDF_CONFIG.MARGIN.TOP)
  
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text(title.toUpperCase(), PDF_CONFIG.MARGIN.LEFT, PDF_CONFIG.MARGIN.TOP + 12)
  
  // Informações do período
  doc.setFontSize(9)
  doc.setTextColor(...PDF_CONFIG.COLORS.GRAY)
  doc.text(`Período: ${period}`, PDF_CONFIG.MARGIN.LEFT, PDF_CONFIG.MARGIN.TOP + 22)
  doc.text(`Transações: ${totalTransactions}`, PDF_CONFIG.MARGIN.LEFT, PDF_CONFIG.MARGIN.TOP + 28)
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - PDF_CONFIG.MARGIN.RIGHT, PDF_CONFIG.MARGIN.TOP + 22, { align: "right" })
  
  // Linha separadora
  doc.setDrawColor(...PDF_CONFIG.COLORS.LIGHT_GRAY)
  doc.line(PDF_CONFIG.MARGIN.LEFT, PDF_CONFIG.MARGIN.TOP + 33, pageWidth - PDF_CONFIG.MARGIN.RIGHT, PDF_CONFIG.MARGIN.TOP + 33)
  
  return PDF_CONFIG.MARGIN.TOP + 40
}

/**
 * Adiciona KPIs em destaque com layout melhorado
 */
const addKPISection = (doc, stats, yPos) => {
  const pageWidth = doc.internal.pageSize.width
  const availableWidth = pageWidth - (PDF_CONFIG.MARGIN.LEFT + PDF_CONFIG.MARGIN.RIGHT)
  const kpiWidth = (availableWidth - 15) / 4
  let currentY = yPos

  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text("VISÃO GERAL DO PERÍODO", PDF_CONFIG.MARGIN.LEFT, currentY)
  currentY += 10

  const kpis = [
    { 
      label: "RECEITA TOTAL", 
      value: formatCurrency(stats.totalSales || 0),
      sublabel: `${stats.salesCount} vendas`,
      color: PDF_CONFIG.COLORS.SUCCESS
    },
    { 
      label: "CUSTO AQUISIÇÃO", 
      value: formatCurrency(stats.totalPurchases || 0),
      sublabel: `${stats.purchasesCount} compras`,
      color: PDF_CONFIG.COLORS.WARNING
    },
    { 
      label: "DESPESAS", 
      value: formatCurrency(stats.totalExpenses || 0),
      sublabel: `${stats.expensesCount} despesas`,
      color: PDF_CONFIG.COLORS.DANGER
    },
    { 
      label: "LUCRO LÍQUIDO", 
      value: formatCurrency(stats.totalProfit || 0),
      sublabel: `Margem: ${(stats.profitMargin || 0).toFixed(1)}%`,
      color: stats.totalProfit >= 0 ? PDF_CONFIG.COLORS.SUCCESS : PDF_CONFIG.COLORS.DANGER
    }
  ]

  kpis.forEach((kpi, index) => {
    const x = PDF_CONFIG.MARGIN.LEFT + index * (kpiWidth + 5)
    
    // Fundo do KPI
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, currentY, kpiWidth, 25, 3, 3, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(x, currentY, kpiWidth, 25, 3, 3, 'S')
    
    // Label
    doc.setFontSize(8)
    doc.setTextColor(...PDF_CONFIG.COLORS.GRAY)
    doc.text(kpi.label, x + (kpiWidth / 2), currentY + 7, { align: "center" })
    
    // Valor principal
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(...kpi.color)
    doc.text(kpi.value, x + (kpiWidth / 2), currentY + 15, { align: "center" })
    
    // Sublabel
    doc.setFontSize(7)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(...PDF_CONFIG.COLORS.GRAY)
    doc.text(kpi.sublabel, x + (kpiWidth / 2), currentY + 20, { align: "center" })
  })

  return currentY + 35
}

/**
 * Análise comparativa de materiais completa
 */
const addMaterialAnalysis = (doc, stats, yPos) => {
  let currentY = yPos

  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text("ANÁLISE COMPARATIVA POR MATERIAL - TOP 15", PDF_CONFIG.MARGIN.LEFT, currentY)
  currentY += 10

  if (stats.topMaterials && stats.topMaterials.length > 0) {
    const tableData = stats.topMaterials.map((item, index) => [
      (index + 1).toString(),
      getMaterialName(item.material),
      formatCurrency(item.precoMedioCompra || 0),
      formatCurrency(item.precoMedioVenda || 0),
      formatCurrency(item.vendas || 0),
      formatCurrency(item.compras || 0),
      formatCurrency(item.lucro || 0),
      `${(item.margemLucro || 0).toFixed(1)}%`,
      `${((item.quantidadeVendas || 0) + (item.quantidadeCompras || 0)).toFixed(0)} kg`
    ])

    autoTable(doc, {
      startY: currentY,
      head: [[
        '#', 'Material', 'Preço Compra Médio', 'Preço Venda Médio', 'Total Vendas', 
        'Total Compras', 'Lucro Líquido', 'Margem %', 'Quantidade Total'
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: PDF_CONFIG.COLORS.PRIMARY,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: PDF_CONFIG.FONT.SIZE.XSMALL
      },
      bodyStyles: { 
        fontSize: PDF_CONFIG.FONT.SIZE.XSMALL,
        cellPadding: PDF_CONFIG.TABLE.PADDING,
        lineWidth: PDF_CONFIG.TABLE.LINE_WIDTH
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 30 },
        2: { cellWidth: 22, halign: 'right' },
        3: { cellWidth: 22, halign: 'right' },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 22, halign: 'right' },
        6: { 
          cellWidth: 22, 
          halign: 'right',
          fontStyle: 'bold',
          textColor: (rowIndex, column, row) => {
            const value = row[6]
            return value.includes('-') ? PDF_CONFIG.COLORS.DANGER : PDF_CONFIG.COLORS.SUCCESS
          }
        },
        7: { 
          cellWidth: 15, 
          halign: 'right',
          textColor: (rowIndex, column, row) => {
            const margin = parseFloat(row[7])
            return margin < 0 ? PDF_CONFIG.COLORS.DANGER : PDF_CONFIG.COLORS.SUCCESS
          }
        },
        8: { cellWidth: 20, halign: 'right' }
      },
      margin: { 
        left: PDF_CONFIG.MARGIN.LEFT, 
        right: PDF_CONFIG.MARGIN.RIGHT 
      },
      styles: {
        overflow: 'linebreak',
        cellWidth: 'wrap'
      }
    })

    currentY = doc.lastAutoTable.finalY + 10
  } else {
    doc.setFontSize(9)
    doc.setTextColor(...PDF_CONFIG.COLORS.GRAY)
    doc.text("Nenhum dado de material disponível para análise", PDF_CONFIG.MARGIN.LEFT + 5, currentY)
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
  doc.text("MÉTRICAS DE PERFORMANCE AVANÇADAS", PDF_CONFIG.MARGIN.LEFT, currentY)
  currentY += 10

  const metrics = [
    { 
      label: "Ticket Médio de Venda", 
      value: formatCurrency(stats.performanceMetrics.ticketMedioVenda || 0), 
      description: "Valor médio por venda",
      color: PDF_CONFIG.COLORS.SUCCESS 
    },
    { 
      label: "Ticket Médio de Compra", 
      value: formatCurrency(stats.performanceMetrics.ticketMedioCompra || 0), 
      description: "Valor médio por compra",
      color: PDF_CONFIG.COLORS.WARNING 
    },
    { 
      label: "Rotatividade de Estoque", 
      value: (stats.performanceMetrics.rotatividadeEstoque || 0).toFixed(2), 
      description: "Vendas / Compras",
      color: PDF_CONFIG.COLORS.INFO 
    },
    { 
      label: "Dias por Venda", 
      value: (stats.performanceMetrics.diasVendaMedia || 0).toFixed(1), 
      description: "Média de dias entre vendas",
      color: [139, 69, 255] 
    },
  ]

  const metricWidth = (doc.internal.pageSize.width - 50) / 2
  let xPos = PDF_CONFIG.MARGIN.LEFT

  metrics.forEach((metric, index) => {
    if (index === 2) {
      xPos = PDF_CONFIG.MARGIN.LEFT
      currentY += 25
    }

    doc.setFillColor(248, 250, 252)
    doc.roundedRect(xPos, currentY, metricWidth, 20, 2, 2, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(xPos, currentY, metricWidth, 20, 2, 2, 'S')
    
    // Label
    doc.setFontSize(8)
    doc.setTextColor(...PDF_CONFIG.COLORS.GRAY)
    doc.text(metric.label, xPos + 8, currentY + 7)
    
    // Valor
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(...metric.color)
    doc.text(metric.value, xPos + (metricWidth / 2), currentY + 14, { align: "center" })
    
    // Descrição
    doc.setFontSize(6)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(...PDF_CONFIG.COLORS.GRAY)
    doc.text(metric.description, xPos + (metricWidth / 2), currentY + 18, { align: "center" })

    xPos += metricWidth + 10
  })

  return currentY + 30
}

/**
 * Análise de pagamentos detalhada
 */
const addPaymentAnalysis = (doc, stats, yPos) => {
  let currentY = yPos

  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text("ANÁLISE DETALHADA POR FORMA DE PAGAMENTO", PDF_CONFIG.MARGIN.LEFT, currentY)
  currentY += 10

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
      head: [['Forma de Pagamento', 'Transações', 'Vendas', 'Compras', 'Valor Total', 'Participação']],
      body: paymentData,
      theme: 'grid',
      headStyles: { 
        fillColor: PDF_CONFIG.COLORS.INFO,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: PDF_CONFIG.FONT.SIZE.XSMALL
      },
      bodyStyles: { 
        fontSize: PDF_CONFIG.FONT.SIZE.XSMALL,
        cellPadding: PDF_CONFIG.TABLE.PADDING,
        lineWidth: PDF_CONFIG.TABLE.LINE_WIDTH
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 20, halign: 'right' },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
        5: { cellWidth: 20, halign: 'right' }
      },
      margin: { 
        left: PDF_CONFIG.MARGIN.LEFT, 
        right: PDF_CONFIG.MARGIN.RIGHT 
      }
    })

    currentY = doc.lastAutoTable.finalY + 10
  }

  return currentY
}

/**
 * Transações detalhadas completas
 */
const addDetailedTransactions = (doc, transactions, yPos) => {
  let currentY = yPos

  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text("DETALHAMENTO COMPLETO DAS TRANSAÇÕES", PDF_CONFIG.MARGIN.LEFT, currentY)
  currentY += 10

  if (transactions && transactions.length > 0) {
    const tableData = transactions.map((t) => {
      const tipo = t.tipo.toUpperCase()
      const tipoColor = tipo === 'Venda' ? PDF_CONFIG.COLORS.SUCCESS : 
                       tipo === 'Compra' ? PDF_CONFIG.COLORS.WARNING : 
                       PDF_CONFIG.COLORS.DANGER
      
      return [
        formatDate(t.data),
        tipo,
        getMaterialName(t.material) || 'N/A',
        `${(t.quantidade || 0).toFixed(1)} kg`,
        formatCurrency(t.precoUnitario || 0),
        formatCurrency(t.valorTotal || 0),
        (t.formaPagamento || 'dinheiro').toUpperCase(),
        t.cliente || t.fornecedor || t.vendedor || '-',
        t.observacoes || '-'
      ]
    })

    autoTable(doc, {
      startY: currentY,
      head: [[
        'Data', 'Tipo', 'Material', 'Quantidade', 'Preço Unitário', 'Valor Total', 
        'Forma Pagamento', 'Cliente/Fornecedor', 'Observações'
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [55, 65, 81],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: PDF_CONFIG.FONT.SIZE.XSMALL
      },
      bodyStyles: { 
        fontSize: PDF_CONFIG.FONT.SIZE.XSMALL,
        cellPadding: PDF_CONFIG.TABLE.PADDING,
        lineWidth: PDF_CONFIG.TABLE.LINE_WIDTH
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { 
          cellWidth: 15,
          textColor: (rowIndex, column, row) => {
            const tipo = row[1]
            return tipo === 'VENDA' ? PDF_CONFIG.COLORS.SUCCESS : 
                   tipo === 'COMPRA' ? PDF_CONFIG.COLORS.WARNING : 
                   PDF_CONFIG.COLORS.DANGER
          },
          fontStyle: 'bold'
        },
        2: { cellWidth: 25 },
        3: { cellWidth: 15, halign: 'right' },
        4: { cellWidth: 18, halign: 'right' },
        5: { cellWidth: 20, halign: 'right', fontStyle: 'bold' },
        6: { cellWidth: 18 },
        7: { cellWidth: 22 },
        8: { cellWidth: 25 }
      },
      margin: { 
        left: PDF_CONFIG.MARGIN.LEFT, 
        right: PDF_CONFIG.MARGIN.RIGHT 
      },
      pageBreak: 'auto',
      styles: {
        overflow: 'linebreak',
        cellWidth: 'wrap'
      }
    })

    currentY = doc.lastAutoTable.finalY + 10
    
    // Adicionar estatísticas das transações
    doc.setFontSize(9)
    doc.setTextColor(...PDF_CONFIG.COLORS.GRAY)
    doc.text(`Total de transações listadas: ${transactions.length}`, PDF_CONFIG.MARGIN.LEFT, currentY)
  } else {
    doc.setFontSize(9)
    doc.setTextColor(...PDF_CONFIG.COLORS.GRAY)
    doc.text("Nenhuma transação encontrada no período selecionado", PDF_CONFIG.MARGIN.LEFT + 5, currentY)
    currentY += 12
  }

  return currentY
}

/**
 * Adiciona rodapé profissional
 */
const addFooter = (doc, pageNumber, totalPages) => {
  const pageHeight = doc.internal.pageSize.height
  const pageWidth = doc.internal.pageSize.width
  
  doc.setFontSize(7)
  doc.setTextColor(...PDF_CONFIG.COLORS.GRAY)
  
  // Linha separadora
  doc.setDrawColor(...PDF_CONFIG.COLORS.LIGHT_GRAY)
  doc.line(PDF_CONFIG.MARGIN.LEFT, pageHeight - 15, pageWidth - PDF_CONFIG.MARGIN.RIGHT, pageHeight - 15)
  
  // Textos do rodapé
  doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: "center" })
  doc.text("Império Sucata - Relatório Gerencial Avançado", PDF_CONFIG.MARGIN.LEFT, pageHeight - 10)
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - PDF_CONFIG.MARGIN.RIGHT, pageHeight - 10, { align: "right" })
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
    pageOrientation = "portrait"
  } = options

  try {
    const doc = new jsPDF({
      orientation: pageOrientation,
      unit: 'mm',
      format: 'a4'
    })

    const period = `${reportData.period.start} - ${reportData.period.end}`
    const totalTransactions = reportData.transactions?.length || 0
    let yPos = addHeader(doc, title, period, totalTransactions)

    // KPIs em destaque
    if (includeSummary && reportData.stats) {
      yPos = addKPISection(doc, reportData.stats, yPos)
    }

    // Análise de performance
    if (includePerformanceAnalysis && reportData.stats) {
      yPos = addPerformanceAnalysis(doc, reportData.stats, yPos)
    }

    // Análise de materiais
    if (includeMaterialAnalysis && reportData.stats?.topMaterials?.length > 0) {
      if (yPos > 180) {
        doc.addPage()
        yPos = PDF_CONFIG.MARGIN.TOP
      }
      yPos = addMaterialAnalysis(doc, reportData.stats, yPos)
    }

    // Análise de pagamentos
    if (includePaymentAnalysis && reportData.stats) {
      if (yPos > 200) {
        doc.addPage()
        yPos = PDF_CONFIG.MARGIN.TOP
      }
      yPos = addPaymentAnalysis(doc, reportData.stats, yPos)
    }

    // Transações detalhadas
    if (includeDetails && reportData.transactions && reportData.transactions.length > 0) {
      if (yPos > 160) {
        doc.addPage()
        yPos = PDF_CONFIG.MARGIN.TOP
      }
      yPos = addDetailedTransactions(doc, reportData.transactions, yPos)
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