import jsPDF from "jspdf"
import "jspdf-autotable"
import * as XLSX from "xlsx"

const PDF_CONFIG = {
  colors: {
    primary: [46, 125, 50], // Green
    secondary: [52, 73, 94],
    success: [34, 197, 94],
    warning: [245, 158, 11],
    danger: [239, 68, 68],
    info: [59, 130, 246],
    light: [248, 249, 250],
    dark: [31, 41, 55],
  },
}

function createProfessionalHeader(doc, title, subtitle, startDate, endDate) {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Green header background
  doc.setFillColor(...PDF_CONFIG.colors.primary)
  doc.rect(0, 0, pageWidth, 45, "F")

  // Company name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("IMPÉRIO SUCATA", pageWidth / 2, 15, { align: "center" })

  // Report title
  doc.setFontSize(14)
  doc.setFont("helvetica", "normal")
  doc.text(title, pageWidth / 2, 25, { align: "center" })

  // Subtitle with period
  doc.setFontSize(10)
  const periodText = `Período: ${new Date(startDate).toLocaleDateString("pt-BR")} até ${new Date(endDate).toLocaleDateString("pt-BR")}`
  doc.text(periodText, pageWidth / 2, 33, { align: "center" })

  // Generation date
  doc.setFontSize(9)
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, pageWidth / 2, 40, { align: "center" })

  return 55 // Return Y position for next content
}

function createProfessionalFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages()
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Footer line
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20)

    // Footer text
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Página ${i} de ${pageCount}`, 20, pageHeight - 12)
    doc.text("Sistema Império Sucata", pageWidth / 2, pageHeight - 12, { align: "center" })
    doc.text(new Date().toLocaleDateString("pt-BR"), pageWidth - 20, pageHeight - 12, { align: "right" })

    doc.setFontSize(7)
    doc.text("Relatório confidencial - Todos os direitos reservados", pageWidth / 2, pageHeight - 6, {
      align: "center",
    })
  }
}

export async function generateFinancialPDF(reportData, options = {}) {
  const { startDate, endDate } = options

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  let yPos = createProfessionalHeader(
    doc,
    "RELATÓRIO FINANCEIRO",
    "Análise Detalhada de Receitas e Despesas",
    startDate,
    endDate,
  )

  const summaryData = [
    { label: "Total Vendas", value: reportData.totalVendas || 0, color: PDF_CONFIG.colors.success },
    { label: "Total Compras", value: reportData.totalCompras || 0, color: PDF_CONFIG.colors.info },
    { label: "Total Despesas", value: reportData.totalDespesas || 0, color: PDF_CONFIG.colors.danger },
    {
      label: "Lucro Líquido",
      value: reportData.totalLucro || 0,
      color: (reportData.totalLucro || 0) >= 0 ? PDF_CONFIG.colors.success : PDF_CONFIG.colors.danger,
    },
  ]

  const boxWidth = 45
  const boxHeight = 28
  const spacing = 5

  summaryData.forEach((item, index) => {
    const x = 10 + index * (boxWidth + spacing)

    // Box border
    doc.setDrawColor(...item.color)
    doc.setLineWidth(1)
    doc.rect(x, yPos, boxWidth, boxHeight)

    // Label
    doc.setFontSize(9)
    doc.setTextColor(80, 80, 80)
    doc.setFont("helvetica", "normal")
    doc.text(item.label, x + boxWidth / 2, yPos + 10, { align: "center" })

    // Value
    doc.setFontSize(11)
    doc.setTextColor(...item.color)
    doc.setFont("helvetica", "bold")
    doc.text(`R$ ${item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, x + boxWidth / 2, yPos + 20, {
      align: "center",
    })
  })

  yPos += boxHeight + 20

  doc.setFontSize(12)
  doc.setTextColor(...PDF_CONFIG.colors.primary)
  doc.setFont("helvetica", "bold")
  doc.text("MOVIMENTAÇÃO DIÁRIA", 20, yPos)
  yPos += 10

  if (reportData.dailyData && reportData.dailyData.length > 0) {
    const tableData = reportData.dailyData.map((day) => [
      new Date(day.date).toLocaleDateString("pt-BR"),
      (day.transacoes || 0).toString(),
      `R$ ${(day.vendas || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      `R$ ${(day.compras || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      `R$ ${(day.despesas || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      `R$ ${(day.lucro || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    ])

    doc.autoTable({
      startY: yPos,
      head: [["Data", "Transações", "Vendas", "Compras", "Despesas", "Lucro"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: PDF_CONFIG.colors.primary,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 8,
        cellPadding: 4,
        textColor: [50, 50, 50],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 25 },
        1: { halign: "center", cellWidth: 25 },
        2: { halign: "right", textColor: PDF_CONFIG.colors.success, cellWidth: 30 },
        3: { halign: "right", textColor: PDF_CONFIG.colors.info, cellWidth: 30 },
        4: { halign: "right", textColor: PDF_CONFIG.colors.danger, cellWidth: 30 },
        5: { halign: "right", fontStyle: "bold", cellWidth: 30 },
      },
      didParseCell: (data) => {
        // Color the profit column based on value
        if (data.column.index === 5 && data.section === "body") {
          const value = Number.parseFloat(data.cell.text[0].replace("R$ ", "").replace(".", "").replace(",", "."))
          data.cell.styles.textColor = value >= 0 ? PDF_CONFIG.colors.success : PDF_CONFIG.colors.danger
        }
      },
    })
  }

  createProfessionalFooter(doc)

  const monthYear = new Date(startDate).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  doc.save(`imperio_sucata_financeiro_${monthYear.replace(" ", "_")}.pdf`)
}

export async function generateMaterialPDF(reportData, options = {}) {
  const { startDate, endDate } = options

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  let yPos = createProfessionalHeader(
    doc,
    "RELATÓRIO POR MATERIAL",
    "Análise Detalhada por Tipo de Material",
    startDate,
    endDate,
  )

  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(`Total de Materiais: ${Object.keys(reportData.materialStats || {}).length}`, 20, yPos)
  doc.text(`Total de Transações: ${reportData.totalTransacoes || 0}`, pageWidth / 2, yPos, { align: "center" })
  doc.text(
    `Lucro Total: R$ ${(reportData.totalLucro || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    pageWidth - 20,
    yPos,
    { align: "right" },
  )

  yPos += 15

  doc.setFontSize(12)
  doc.setTextColor(...PDF_CONFIG.colors.primary)
  doc.setFont("helvetica", "bold")
  doc.text("ANÁLISE POR MATERIAL", 20, yPos)
  yPos += 10

  if (reportData.materialStats) {
    const tableData = Object.entries(reportData.materialStats)
      .sort(([, a], [, b]) => (b.lucro || 0) - (a.lucro || 0))
      .map(([material, stats]) => [
        material.toUpperCase(),
        `${(stats.quantidade || 0).toFixed(1)} kg`,
        `R$ ${(stats.vendas || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        `R$ ${(stats.compras || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        `R$ ${(stats.lucro || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        `${(stats.margem || 0).toFixed(1)}%`,
      ])

    doc.autoTable({
      startY: yPos,
      head: [["Material", "Quantidade", "Vendas", "Compras", "Lucro", "Margem"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: PDF_CONFIG.colors.primary,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 8,
        cellPadding: 4,
        textColor: [50, 50, 50],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { halign: "right", cellWidth: 25 },
        2: { halign: "right", textColor: PDF_CONFIG.colors.success, cellWidth: 30 },
        3: { halign: "right", textColor: PDF_CONFIG.colors.info, cellWidth: 30 },
        4: { halign: "right", fontStyle: "bold", cellWidth: 30 },
        5: { halign: "center", cellWidth: 20 },
      },
      didParseCell: (data) => {
        // Color the profit column based on value
        if (data.column.index === 4 && data.section === "body") {
          const value = Number.parseFloat(data.cell.text[0].replace("R$ ", "").replace(".", "").replace(",", "."))
          data.cell.styles.textColor = value >= 0 ? PDF_CONFIG.colors.success : PDF_CONFIG.colors.danger
        }
      },
    })
  }

  createProfessionalFooter(doc)

  const monthYear = new Date(startDate).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  doc.save(`imperio_sucata_materiais_${monthYear.replace(" ", "_")}.pdf`)
}

export async function generateDailyPDF(reportData, options = {}) {
  const { startDate, endDate } = options

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  let yPos = createProfessionalHeader(
    doc,
    "RELATÓRIO DIÁRIO DETALHADO",
    "Movimentação Completa Dia a Dia",
    startDate,
    endDate,
  )

  const totalDays = reportData.dailyData?.length || 0
  const avgDailyProfit = totalDays > 0 ? (reportData.totalLucro || 0) / totalDays : 0

  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(`Total de Dias: ${totalDays}`, 20, yPos)
  doc.text(
    `Média Diária: R$ ${avgDailyProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    pageWidth / 2,
    yPos,
    { align: "center" },
  )
  doc.text(`Total Transações: ${reportData.totalTransacoes || 0}`, pageWidth - 20, yPos, { align: "right" })

  yPos += 15

  doc.setFontSize(12)
  doc.setTextColor(...PDF_CONFIG.colors.primary)
  doc.setFont("helvetica", "bold")
  doc.text("DETALHAMENTO DIÁRIO", 20, yPos)
  yPos += 10

  if (reportData.dailyData && reportData.dailyData.length > 0) {
    const tableData = reportData.dailyData.map((day) => {
      const dayOfWeek = new Date(day.date).toLocaleDateString("pt-BR", { weekday: "short" })
      return [
        new Date(day.date).toLocaleDateString("pt-BR"),
        dayOfWeek.toUpperCase(),
        (day.transacoes || 0).toString(),
        `R$ ${(day.vendas || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        `R$ ${(day.compras || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        `R$ ${(day.despesas || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        `R$ ${(day.lucro || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      ]
    })

    doc.autoTable({
      startY: yPos,
      head: [["Data", "Dia", "Trans.", "Vendas", "Compras", "Despesas", "Lucro"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: PDF_CONFIG.colors.primary,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 8,
        cellPadding: 4,
        textColor: [50, 50, 50],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 25 },
        1: { halign: "center", cellWidth: 15 },
        2: { halign: "center", cellWidth: 20 },
        3: { halign: "right", textColor: PDF_CONFIG.colors.success, cellWidth: 28 },
        4: { halign: "right", textColor: PDF_CONFIG.colors.info, cellWidth: 28 },
        5: { halign: "right", textColor: PDF_CONFIG.colors.danger, cellWidth: 28 },
        6: { halign: "right", fontStyle: "bold", cellWidth: 28 },
      },
      didParseCell: (data) => {
        // Highlight weekends
        if (data.column.index === 1 && data.section === "body") {
          const dayText = data.cell.text[0]
          if (dayText === "SÁB" || dayText === "DOM") {
            data.cell.styles.fillColor = [255, 243, 205]
          }
        }
        // Color the profit column based on value
        if (data.column.index === 6 && data.section === "body") {
          const value = Number.parseFloat(data.cell.text[0].replace("R$ ", "").replace(".", "").replace(",", "."))
          data.cell.styles.textColor = value >= 0 ? PDF_CONFIG.colors.success : PDF_CONFIG.colors.danger
        }
      },
    })
  }

  createProfessionalFooter(doc)

  const monthYear = new Date(startDate).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  doc.save(`imperio_sucata_diario_${monthYear.replace(" ", "_")}.pdf`)
}

export async function exportToExcel(reportData, options = {}) {
  const { startDate, endDate, reportType } = options

  const workbook = XLSX.utils.book_new()

  // Tab 1: Summary
  const summaryData = [
    ["IMPÉRIO SUCATA - Relatório Consolidado"],
    [`Período: ${startDate} até ${endDate}`],
    [`Gerado em: ${new Date().toLocaleString("pt-BR")}`],
    [],
    ["Métrica", "Valor"],
    ["Total Vendas", reportData.totalSales || 0],
    ["Total Compras", reportData.totalPurchases || 0],
    ["Total Despesas", reportData.totalExpenses || 0],
    ["Lucro Líquido", reportData.profit || 0],
    ["Margem de Lucro", `${((reportData.profit / reportData.totalSales) * 100 || 0).toFixed(2)}%`],
    ["Total de Transações", reportData.totalTransactions || 0],
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumo")

  // Tab 2: Daily Data
  if (reportData.dailyData && reportData.dailyData.length > 0) {
    const dailyData = [
      ["Data", "Transações", "Vendas", "Compras", "Despesas", "Lucro"],
      ...reportData.dailyData.map((day) => [
        new Date(day.date).toLocaleDateString("pt-BR"),
        day.transactionCount || 0,
        day.sales || 0,
        day.purchases || 0,
        day.expenses || 0,
        day.profit || 0,
      ]),
    ]

    const dailySheet = XLSX.utils.aoa_to_sheet(dailyData)
    XLSX.utils.book_append_sheet(workbook, dailySheet, "Dados Diários")
  }

  // Tab 3: Material Stats
  if (reportData.materialStats) {
    const materialData = [
      ["Material", "Quantidade (kg)", "Vendas", "Compras", "Lucro", "Margem (%)"],
      ...Object.entries(reportData.materialStats)
        .sort(([, a], [, b]) => (b.profit || 0) - (a.profit || 0))
        .map(([material, stats]) => [
          material,
          stats.quantity || 0,
          stats.sales || 0,
          stats.purchases || 0,
          stats.profit || 0,
          stats.margin || 0,
        ]),
    ]

    const materialSheet = XLSX.utils.aoa_to_sheet(materialData)
    XLSX.utils.book_append_sheet(workbook, materialSheet, "Por Material")
  }

  // Tab 4: Payment Methods
  if (reportData.paymentStats) {
    const totalPayments = Object.values(reportData.paymentStats).reduce((sum, stats) => sum + (stats.total || 0), 0)

    const paymentData = [
      ["Forma de Pagamento", "Quantidade", "Valor Total", "Percentual (%)"],
      ...Object.entries(reportData.paymentStats)
        .sort(([, a], [, b]) => (b.total || 0) - (a.total || 0))
        .map(([method, stats]) => {
          // Normalize payment method name
          let normalizedMethod = method.toLowerCase()
          if (normalizedMethod === "pix") {
            normalizedMethod = "PIX"
          } else if (normalizedMethod === "dinheiro" || normalizedMethod === "" || normalizedMethod === "n/i") {
            normalizedMethod = "DINHEIRO"
          } else {
            normalizedMethod = method.toUpperCase()
          }

          return [
            normalizedMethod,
            stats.count || 0,
            stats.total || 0,
            totalPayments > 0 ? ((stats.total / totalPayments) * 100).toFixed(2) + "%" : "0%",
          ]
        }),
    ]

    const paymentSheet = XLSX.utils.aoa_to_sheet(paymentData)
    XLSX.utils.book_append_sheet(workbook, paymentSheet, "Formas de Pagamento")
  }

  // Save file
  XLSX.writeFile(workbook, `relatorio_completo_${startDate}_${endDate}.xlsx`)
}
