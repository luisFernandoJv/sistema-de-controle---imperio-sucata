// Utilitários para exportação e impressão de relatórios profissionais

// Função para exportar dados para CSV
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    console.warn("Nenhum dado para exportar");
    return;
  }

  const headers = [
    "Data",
    "Tipo",
    "Material",
    "Quantidade (kg)",
    "Preço/kg (R$)",
    "Valor Total (R$)",
    "Cliente/Fornecedor",
  ];

  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      [
        new Date(row.data).toLocaleDateString("pt-BR"),
        row.tipo === "compra" ? "Compra" : "Venda",
        row.material,
        row.quantidade.toFixed(2),
        row.preco.toFixed(2),
        row.valorTotal.toFixed(2),
        row.cliente || row.fornecedor || "N/A",
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Função para gerar PDF profissional usando jsPDF
export const generateProfessionalPDF = async (transactions, filters = {}) => {
  try {
    // Importação dinâmica do jsPDF
    const { jsPDF } = await import("jspdf");
    await import("jspdf-autotable");

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Cabeçalho da empresa
    doc.setFontSize(20);
    doc.setTextColor(34, 139, 34); // Verde profissional
    doc.text("IMPÉRIO SUCATA", pageWidth / 2, 25, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Sistema de Gestão de Reciclagem", pageWidth / 2, 35, { align: "center" });

    // Linha separadora
    doc.setDrawColor(34, 139, 34);
    doc.setLineWidth(0.5);
    doc.line(20, 40, pageWidth - 20, 40);

    // Informações do relatório
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("RELATÓRIO DE TRANSAÇÕES", pageWidth / 2, 55, { align: "center" });

    // Período do relatório
    let yPosition = 70;
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);

    if (filters.startDate || filters.endDate) {
      const startDate = filters.startDate ? new Date(filters.startDate).toLocaleDateString("pt-BR") : "Início";
      const endDate = filters.endDate ? new Date(filters.endDate).toLocaleDateString("pt-BR") : "Hoje";
      doc.text(`Período: ${startDate} até ${endDate}`, 20, yPosition);
      yPosition += 10;
    }

    if (filters.material) {
      doc.text(`Material: ${filters.material}`, 20, yPosition);
      yPosition += 10;
    }

    if (filters.tipo) {
      doc.text(`Tipo: ${filters.tipo === "compra" ? "Compras" : "Vendas"}`, 20, yPosition);
      yPosition += 10;
    }

    doc.text(
      `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
      20,
      yPosition
    );
    yPosition += 15;

    // Resumo executivo
    const totalVendas = transactions.filter((t) => t.tipo === "venda").reduce((sum, t) => sum + t.valorTotal, 0);
    const totalCompras = transactions.filter((t) => t.tipo === "compra").reduce((sum, t) => sum + t.valorTotal, 0);
    const lucro = totalVendas - totalCompras;

    doc.setFillColor(248, 249, 250);
    doc.rect(20, yPosition, pageWidth - 40, 25, "F");

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("RESUMO EXECUTIVO", 25, yPosition + 8);

    doc.setFontSize(10);
    doc.text(`Total de Vendas: R$ ${totalVendas.toFixed(2)}`, 25, yPosition + 16);
    doc.text(`Total de Compras: R$ ${totalCompras.toFixed(2)}`, 25, yPosition + 22);

    doc.setTextColor(lucro >= 0 ? [34, 139, 34] : [220, 20, 60]);
    doc.text(`Lucro: R$ ${lucro.toFixed(2)}`, pageWidth - 80, yPosition + 16);
    doc.text(`Total de Transações: ${transactions.length}`, pageWidth - 80, yPosition + 22);

    yPosition += 35;

    // Tabela de transações
    const tableData = transactions.map((transaction) => [
      new Date(transaction.data).toLocaleDateString("pt-BR"),
      transaction.tipo === "compra" ? "Compra" : "Venda",
      transaction.material,
      `${transaction.quantidade.toFixed(2)} kg`,
      `R$ ${transaction.preco.toFixed(2)}`,
      `R$ ${transaction.valorTotal.toFixed(2)}`,
      transaction.cliente || transaction.fornecedor || "N/A",
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [["Data", "Tipo", "Material", "Quantidade", "Preço/kg", "Valor Total", "Cliente/Fornecedor"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [34, 139, 34],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [50, 50, 50],
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Data
        1: { cellWidth: 20 }, // Tipo
        2: { cellWidth: 25 }, // Material
        3: { cellWidth: 25 }, // Quantidade
        4: { cellWidth: 25 }, // Preço
        5: { cellWidth: 30 }, // Valor Total
        6: { cellWidth: 35 }, // Cliente/Fornecedor
      },
      margin: { left: 20, right: 20 },
      didDrawPage: (data) => {
        // Rodapé
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Império Sucata - Sistema de Gestão de Reciclagem", pageWidth / 2, pageHeight - 10, { align: "center" });
      },
    });

    // Salvar o PDF
    const fileName = `relatorio_imperio_sucata_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    throw error;
  }
};

// Função para calcular estatísticas do relatório
export const calculateReportStats = (transactions) => {
  const stats = {
    totalTransactions: transactions.length,
    totalSales: 0,
    totalPurchases: 0,
    totalProfit: 0,
    materialBreakdown: {},
    dailyBreakdown: {},
  };

  transactions.forEach((transaction) => {
    const date = new Date(transaction.data).toLocaleDateString("pt-BR");

    if (transaction.tipo === "venda") {
      stats.totalSales += transaction.valorTotal;
    } else {
      stats.totalPurchases += transaction.valorTotal;
    }

    // Breakdown por material
    if (!stats.materialBreakdown[transaction.material]) {
      stats.materialBreakdown[transaction.material] = {
        sales: 0,
        purchases: 0,
        quantity: 0,
        transactions: 0,
      };
    }

    const material = stats.materialBreakdown[transaction.material];
    if (transaction.tipo === "venda") {
      material.sales += transaction.valorTotal;
    } else {
      material.purchases += transaction.valorTotal;
    }
    material.quantity += transaction.quantidade;
    material.transactions++;

    // Breakdown diário
    if (!stats.dailyBreakdown[date]) {
      stats.dailyBreakdown[date] = {
        sales: 0,
        purchases: 0,
        transactions: 0,
      };
    }

    const daily = stats.dailyBreakdown[date];
    if (transaction.tipo === "venda") {
      daily.sales += transaction.valorTotal;
    } else {
      daily.purchases += transaction.valorTotal;
    }
    daily.transactions++;
  });

  stats.totalProfit = stats.totalSales - stats.totalPurchases;

  return stats;
};
