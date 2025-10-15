const {onDocumentWritten} = require("firebase-functions/v2/firestore");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onCall} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");
const admin = require("firebase-admin");
const JsPDF = require("jspdf"); // Renomeado para começar com maiúscula
require("jspdf-autotable");
const XLSX = require("xlsx");

admin.initializeApp();
const db = admin.firestore();

// FUNÇÕES AUXILIARES PARA GERAÇÃO DE PDF PROFISSIONAL
// =================================================================================================

const PDF_CONFIG = {
  margins: {top: 25, right: 20, bottom: 25, left: 20},
  colors: {
    primary: [34, 197, 94], // Verde Império
    secondary: [31, 41, 55], // Cinza Escuro
    text: [55, 65, 81],
    success: [22, 163, 74],
    danger: [220, 38, 38],
  },
  fonts: {
    title: {size: 20, style: "bold"},
    subtitle: {size: 12, style: "normal"},
    heading: {size: 14, style: "bold"},
    body: {size: 10, style: "normal"},
  },
};

/**
 * Desenha o cabeçalho em todas as páginas do documento.
 * @param {JsPDF} doc O documento PDF.
 * @param {string} title O título do relatório.
 */
function drawHeader(doc, title) {
  const pageWidth = doc.internal.pageSize.width;
  doc.setFontSize(PDF_CONFIG.fonts.title.size);
  doc.setFont("helvetica", PDF_CONFIG.fonts.title.style);
  doc.setTextColor(...PDF_CONFIG.colors.primary);
  doc.text("🏭 Império Sucata", PDF_CONFIG.margins.left, 20);

  doc.setFontSize(PDF_CONFIG.fonts.subtitle.size);
  doc.setFont("helvetica", PDF_CONFIG.fonts.subtitle.style);
  doc.setTextColor(...PDF_CONFIG.colors.secondary);
  doc.text(title, pageWidth - PDF_CONFIG.margins.right, 20, {align: "right"});

  doc.setDrawColor(...PDF_CONFIG.colors.primary);
  doc.setLineWidth(0.5);
  doc.line(PDF_CONFIG.margins.left, 28, pageWidth - PDF_CONFIG.margins.right, 28);
}

/**
 * Desenha o rodapé com número da página em todas as páginas.
 * @param {JsPDF} doc O documento PDF.
 */
function drawFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...PDF_CONFIG.colors.text);
    const text = `Página ${i} de ${pageCount} | Relatório Império Sucata`;
    doc.text(text, pageWidth / 2, pageHeight - 15, {align: "center"});
  }
}

/**
 * Desenha um resumo executivo com os principais KPIs.
 * @param {JsPDF} doc O documento PDF.
 * @param {object} stats Os dados agregados do relatório.
 * @param {number} yPos A posição Y inicial para desenhar.
 * @return {number} A nova posição Y após desenhar a seção.
 */
function drawExecutiveSummary(doc, stats, yPos) {
  doc.setFontSize(PDF_CONFIG.fonts.heading.size);
  doc.setFont("helvetica", PDF_CONFIG.fonts.heading.style);
  doc.setTextColor(...PDF_CONFIG.colors.secondary);
  doc.text("Resumo Executivo", PDF_CONFIG.margins.left, yPos);
  yPos += 10;

  const kpis = [
    {label: "Receita (Vendas)", value: `R$ ${stats.totalSales.toFixed(2)}`, color: PDF_CONFIG.colors.success},
    {label: "Custos (Compras)", value: `R$ ${stats.totalPurchases.toFixed(2)}`, color: PDF_CONFIG.colors.danger},
    {
      label: "Lucro Bruto",
      value: `R$ ${(stats.totalSales - stats.totalPurchases).toFixed(2)}`,
      color: stats.totalSales - stats.totalPurchases >= 0 ? PDF_CONFIG.colors.success : PDF_CONFIG.colors.danger,
    },
    {label: "Nº de Transações", value: stats.totalTransactions, color: PDF_CONFIG.colors.secondary},
  ];

  const boxWidth = (doc.internal.pageSize.width - PDF_CONFIG.margins.left * 2 - 10 * (kpis.length - 1)) / kpis.length;

  kpis.forEach((kpi, index) => {
    const x = PDF_CONFIG.margins.left + index * (boxWidth + 10);
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 249, 250);
    doc.rect(x, yPos, boxWidth, 25, "FD");

    doc.setFontSize(8);
    doc.setTextColor(...PDF_CONFIG.colors.text);
    doc.text(kpi.label, x + boxWidth / 2, yPos + 7, {align: "center"});

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...kpi.color);
    doc.text(String(kpi.value), x + boxWidth / 2, yPos + 18, {align: "center"});
  });

  return yPos + 25 + 15; // Retorna a próxima posição Y
}

exports.updateInventoryAndStatsOnChange = onDocumentWritten(
    "transactions/{transactionId}",
    async (event) => {
      const inventoryRef = db.doc("inventory/current");
      const statsRef = db.doc("reports/live_summary");

      const beforeData = event.data.before.data();
      const afterData = event.data.after.data();

      if (afterData && !afterData.formaPagamento) {
        afterData.formaPagamento = "dinheiro"; // Default to cash
        await event.data.after.ref.update({formaPagamento: "dinheiro"});
      }

      const batch = db.batch();
      const statsDoc = await statsRef.get();
      const statsData = statsDoc.data() || {};
      const now = new Date();
      const lastUpdate = statsData.updatedAt ? statsData.updatedAt.toDate() : null;
      const resetOps = {};

      if (!lastUpdate || lastUpdate.toDateString() !== now.toDateString()) {
        resetOps.transacoesHoje = 0;
        resetOps.vendasHoje = 0;
        resetOps.comprasHoje = 0;
      }
      if (!lastUpdate || lastUpdate.getMonth() !== now.getMonth()) {
        resetOps.totalVendasMes = 0;
        resetOps.totalComprasMes = 0;
        resetOps.totalDespesasMes = 0;
      }
      if (Object.keys(resetOps).length > 0) {
        batch.set(statsRef, resetOps, {merge: true});
      }

      if (!event.data.before.exists && event.data.after.exists) {
        const {material, quantidade, tipo, valorTotal} = afterData;
        const invIncrement = tipo === "compra" ? quantidade : -quantidade;
        batch.set(
            inventoryRef,
            {[material]: {quantidade: admin.firestore.FieldValue.increment(invIncrement)}},
            {merge: true},
        );

        if (tipo === "venda") {
          batch.set(
              statsRef,
              {
                totalVendasMes: admin.firestore.FieldValue.increment(valorTotal),
                vendasHoje: admin.firestore.FieldValue.increment(valorTotal),
              },
              {merge: true},
          );
        } else if (tipo === "compra") {
          batch.set(
              statsRef,
              {
                totalComprasMes: admin.firestore.FieldValue.increment(valorTotal),
                comprasHoje: admin.firestore.FieldValue.increment(valorTotal),
              },
              {merge: true},
          );
        } else if (tipo === "despesa") {
          batch.set(
              statsRef,
              {totalDespesasMes: admin.firestore.FieldValue.increment(valorTotal)},
              {merge: true},
          );
        }
        batch.set(
            statsRef,
            {transacoesHoje: admin.firestore.FieldValue.increment(1)},
            {merge: true},
        );
      }

      if (event.data.before.exists && !event.data.after.exists) {
        const {material, quantidade, tipo, valorTotal} = beforeData;
        const invIncrement = tipo === "compra" ? -quantidade : quantidade;
        batch.set(
            inventoryRef,
            {[material]: {quantidade: admin.firestore.FieldValue.increment(invIncrement)}},
            {merge: true},
        );

        if (tipo === "venda") {
          batch.set(
              statsRef,
              {
                totalVendasMes: admin.firestore.FieldValue.increment(-valorTotal),
                vendasHoje: admin.firestore.FieldValue.increment(-valorTotal),
              },
              {merge: true},
          );
        } else if (tipo === "compra") {
          batch.set(
              statsRef,
              {
                totalComprasMes: admin.firestore.FieldValue.increment(-valorTotal),
                comprasHoje: admin.firestore.FieldValue.increment(-valorTotal),
              },
              {merge: true},
          );
        } else if (tipo === "despesa") {
          batch.set(
              statsRef,
              {totalDespesasMes: admin.firestore.FieldValue.increment(-valorTotal)},
              {merge: true},
          );
        }
        batch.set(
            statsRef,
            {transacoesHoje: admin.firestore.FieldValue.increment(-1)},
            {merge: true},
        );
      }

      if (event.data.before.exists && event.data.after.exists) {
        const oldInvIncrement =
          beforeData.tipo === "compra" ? -beforeData.quantidade : beforeData.quantidade;
        batch.set(
            inventoryRef,
            {[beforeData.material]: {quantidade: admin.firestore.FieldValue.increment(oldInvIncrement)}},
            {merge: true},
        );
        const newInvIncrement =
          afterData.tipo === "compra" ? afterData.quantidade : -afterData.quantidade;
        batch.set(
            inventoryRef,
            {[afterData.material]: {quantidade: admin.firestore.FieldValue.increment(newInvIncrement)}},
            {merge: true},
        );

        const salesChange =
          (afterData.tipo === "venda" ? afterData.valorTotal : 0) -
          (beforeData.tipo === "venda" ? beforeData.valorTotal : 0);
        const purchasesChange =
          (afterData.tipo === "compra" ? afterData.valorTotal : 0) -
          (beforeData.tipo === "compra" ? beforeData.valorTotal : 0);
        const expensesChange =
          (afterData.tipo === "despesa" ? afterData.valorTotal : 0) -
          (beforeData.tipo === "despesa" ? beforeData.valorTotal : 0);

        batch.set(
            statsRef,
            {
              totalVendasMes: admin.firestore.FieldValue.increment(salesChange),
              totalComprasMes: admin.firestore.FieldValue.increment(purchasesChange),
              totalDespesasMes: admin.firestore.FieldValue.increment(expensesChange),
            },
            {merge: true},
        );
      }

      batch.set(
          statsRef,
          {updatedAt: admin.firestore.FieldValue.serverTimestamp()},
          {merge: true},
      );

      return batch.commit();
    });

exports.generateHistoricalDailyReport = onSchedule(
    {schedule: "0 0 * * *", timeZone: "America/Sao_Paulo"},
    async (_event) => {
      logger.info("Iniciando geração de relatório histórico diário completo...");
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateString = yesterday.toISOString().split("T")[0];

      const start = new Date(yesterday.setHours(0, 0, 0, 0));
      const end = new Date(yesterday.setHours(23, 59, 59, 999));

      const snapshot = await db.collection("transactions")
          .where("data", ">=", start)
          .where("data", "<=", end)
          .get();
      const transactions = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));

      const stats = {
        date: admin.firestore.Timestamp.fromDate(start),
        dateString: dateString,
        totalSales: 0,
        totalPurchases: 0,
        totalExpenses: 0,
        totalProfit: 0,
        totalTransactions: transactions.length,
        salesCount: 0,
        purchasesCount: 0,
        expensesCount: 0,
        materialStats: {},
        paymentStats: {},
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      transactions.forEach((t) => {
        const valorTotal = t.valorTotal || 0;
        const material = t.material || "outros";
        const formaPagamento = (t.formaPagamento || "dinheiro").toLowerCase();
        const quantidade = t.quantidade || 0;

        // Aggregate by transaction type
        if (t.tipo === "venda") {
          stats.totalSales += valorTotal;
          stats.salesCount++;
        } else if (t.tipo === "compra") {
          stats.totalPurchases += valorTotal;
          stats.purchasesCount++;
        } else if (t.tipo === "despesa") {
          stats.totalExpenses += valorTotal;
          stats.expensesCount++;
        }

        if (!stats.materialStats[material]) {
          stats.materialStats[material] = {
            vendas: 0,
            compras: 0,
            quantidade: 0,
            lucro: 0,
            transacoes: 0,
          };
        }

        if (t.tipo === "venda") {
          stats.materialStats[material].vendas += valorTotal;
          stats.materialStats[material].quantidade += quantidade;
        } else if (t.tipo === "compra") {
          stats.materialStats[material].compras += valorTotal;
          stats.materialStats[material].quantidade += quantidade;
        }
        stats.materialStats[material].transacoes++;
        stats.materialStats[material].lucro =
          stats.materialStats[material].vendas - stats.materialStats[material].compras;

        if (!stats.paymentStats[formaPagamento]) {
          stats.paymentStats[formaPagamento] = {
            count: 0,
            total: 0,
          };
        }
        stats.paymentStats[formaPagamento].count++;
        stats.paymentStats[formaPagamento].total += valorTotal;
      });

      // Calculate profit
      stats.totalProfit = stats.totalSales - stats.totalPurchases - stats.totalExpenses;

      await db.collection("daily_reports").doc(dateString).set(stats);
      logger.info(`Relatório histórico completo gerado para ${dateString} com ${transactions.length} transações`);
    },
);

exports.getAggregatedReports = onCall(async (request) => {
  const {startDate, endDate} = request.data;
  if (!startDate || !endDate) {
    throw new Error("As datas são obrigatórias.");
  }
  const reportsSnapshot = await db
      .collection("daily_reports")
      .where(admin.firestore.FieldPath.documentId(), ">=", startDate)
      .where(admin.firestore.FieldPath.documentId(), "<=", endDate)
      .get();
  const reports = reportsSnapshot.docs.map((doc) => doc.data());
  return {reports: reports};
});

exports.generateReportFile = onCall(async (request) => {
  const {format, filters} = request.data;
  const bucket = admin.storage().bucket();
  const {HttpsError} = require("firebase-functions/v2/https");

  if (!format || !["pdf", "excel"].includes(format)) {
    throw new HttpsError("invalid-argument", "Formato inválido. Use 'pdf' ou 'excel'.");
  }

  try {
    logger.info(`Gerando relatório ${format} com filtros:`, filters);

    // 1. BUSCA DE DADOS OTIMIZADA
    // Primeiro, buscamos os dados agregados dos 'daily_reports' para os resumos.
    let aggregatedQuery = db.collection("daily_reports");
    if (filters && filters.startDate) {
      aggregatedQuery = aggregatedQuery.where(
          admin.firestore.FieldPath.documentId(),
          ">=",
          filters.startDate.split("T")[0],
      );
    }
    if (filters && filters.endDate) {
      aggregatedQuery = aggregatedQuery.where(
          admin.firestore.FieldPath.documentId(),
          "<=",
          filters.endDate.split("T")[0],
      );
    }
    const aggregatedSnapshot = await aggregatedQuery.get();
    const dailyReports = aggregatedSnapshot.docs.map((doc) => doc.data());

    // Agrega os dados diários em um resumo total
    const summaryStats = dailyReports.reduce(
        (acc, report) => {
          acc.totalSales += report.totalSales || 0;
          acc.totalPurchases += report.totalPurchases || 0;
          acc.totalExpenses += report.totalExpenses || 0;
          acc.totalTransactions += report.totalTransactions || 0;
          return acc;
        },
        {totalSales: 0, totalPurchases: 0, totalExpenses: 0, totalTransactions: 0},
    );

    // Segundo, buscamos as transações detalhadas para a tabela, aplicando todos os filtros.
    let detailedQuery = db.collection("transactions");
    if (filters && filters.startDate) {
      detailedQuery = detailedQuery.where("data", ">=", new Date(filters.startDate));
    }
    if (filters && filters.endDate) {
      detailedQuery = detailedQuery.where("data", "<=", new Date(filters.endDate));
    }
    if (filters && filters.material) {
      detailedQuery = detailedQuery.where("material", "==", filters.material);
    }
    if (filters && filters.tipo) {
      detailedQuery = detailedQuery.where("tipo", "==", filters.tipo);
    }

    const detailedSnapshot = await detailedQuery.orderBy("data", "desc").get();
    const transactions = detailedSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));

    if (transactions.length === 0) {
      throw new HttpsError("not-found", "Nenhuma transação encontrada para os filtros selecionados.");
    }

    // ======================================================================
    // 2. GERAÇÃO DO PDF PROFISSIONAL
    // ======================================================================
    if (format === "pdf") {
      const doc = new JsPDF();
      let yPos = 40; // Posição Y inicial

      const reportTitle = "Relatório Financeiro Detalhado";

      drawHeader(doc, reportTitle);

      yPos = drawExecutiveSummary(doc, summaryStats, yPos);

      // Tabela de Transações Detalhadas
      doc.setFontSize(PDF_CONFIG.fonts.heading.size);
      doc.text("Detalhamento de Transações", PDF_CONFIG.margins.left, yPos);
      yPos += 10;

      const tableData = transactions.map((t) => [
        new Date(t.data.toDate()).toLocaleDateString("pt-BR"),
        t.tipo,
        t.material || "N/A",
        `${(t.quantidade || 0).toFixed(2)} kg`,
        `R$ ${(t.valorTotal || 0).toFixed(2)}`,
        t.vendedor || "-",
      ]);

      doc.autoTable({
        startY: yPos,
        head: [["Data", "Tipo", "Material", "Qtd.", "Valor Total", "Pessoa"]],
        body: tableData,
        theme: "grid",
        headStyles: {fillColor: PDF_CONFIG.colors.primary},
        margin: {left: PDF_CONFIG.margins.left, right: PDF_CONFIG.margins.right},
      });

      drawFooter(doc);

      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
      const fileName = `relatorios/relatorio_${Date.now()}.pdf`;
      const file = bucket.file(fileName);
      await file.save(pdfBuffer, {metadata: {contentType: "application/pdf"}});

      const [url] = await file.getSignedUrl({action: "read", expires: Date.now() + 3600000});
      return {success: true, downloadUrl: url};
    } else if (format === "excel") {
      // ======================================================================
      // 3. GERAÇÃO DO EXCEL
      // ======================================================================
      const workbook = XLSX.utils.book_new();
      const sheetData = transactions.map((t) => ({
        "Data": new Date(t.data.toDate()).toLocaleDateString("pt-BR"),
        "Tipo": t.tipo,
        "Material": t.material,
        "Quantidade (kg)": t.quantidade,
        "Preço/kg": t.precoUnitario,
        "Valor Total": t.valorTotal,
        "Cliente": t.vendedor || "",
        "Pagamento": t.formaPagamento || "dinheiro",
      }));
      const ws = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbook, ws, "Transações");

      const excelBuffer = XLSX.write(workbook, {type: "buffer", bookType: "xlsx"});
      const fileName = `relatorios/relatorio_${Date.now()}.xlsx`;
      const file = bucket.file(fileName);
      await file.save(excelBuffer, {
        metadata: {contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
      });

      const [url] = await file.getSignedUrl({action: "read", expires: Date.now() + 3600000});
      return {success: true, downloadUrl: url};
    }
  } catch (error) {
    logger.error("❌ Erro ao gerar relatório:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Ocorreu um erro inesperado ao gerar o relatório.");
  }
});

exports.getAggregatedReport = onCall(async (request) => {
  const {startDate, endDate, material} = request.data;

  if (!startDate || !endDate) {
    throw new Error("As datas de início e fim são obrigatórias.");
  }

  try {
    logger.info("Gerando relatório agregado:", {startDate, endDate, material});

    // Buscar relatórios diários no período
    const query = db
        .collection("daily_reports")
        .where(admin.firestore.FieldPath.documentId(), ">=", startDate)
        .where(admin.firestore.FieldPath.documentId(), "<=", endDate);

    const snapshot = await query.get();
    const dailyReports = snapshot.docs.map((doc) => doc.data());

    // Agregar dados
    const aggregated = {
      totalSales: 0,
      totalPurchases: 0,
      totalExpenses: 0,
      totalProfit: 0,
      totalTransactions: 0,
      salesCount: 0,
      purchasesCount: 0,
      expensesCount: 0,
      materialStats: {},
      paymentStats: {},
      dailyBreakdown: [],
    };

    dailyReports.forEach((report) => {
      aggregated.totalSales += report.totalSales || 0;
      aggregated.totalPurchases += report.totalPurchases || 0;
      aggregated.totalExpenses += report.totalExpenses || 0;
      aggregated.totalProfit += report.totalProfit || 0;
      aggregated.totalTransactions += report.totalTransactions || 0;
      aggregated.salesCount += report.salesCount || 0;
      aggregated.purchasesCount += report.purchasesCount || 0;
      aggregated.expensesCount += report.expensesCount || 0;

      // Agregar estatísticas por material
      Object.entries(report.materialStats || {}).forEach(([mat, stats]) => {
        if (!aggregated.materialStats[mat]) {
          aggregated.materialStats[mat] = {
            vendas: 0,
            compras: 0,
            quantidade: 0,
            lucro: 0,
            transacoes: 0,
          };
        }
        aggregated.materialStats[mat].vendas += stats.vendas || 0;
        aggregated.materialStats[mat].compras += stats.compras || 0;
        aggregated.materialStats[mat].quantidade += stats.quantidade || 0;
        aggregated.materialStats[mat].lucro += stats.lucro || 0;
        aggregated.materialStats[mat].transacoes += stats.transacoes || 0;
      });

      // Agregar estatísticas de pagamento
      Object.entries(report.paymentStats || {}).forEach(([method, stats]) => {
        if (!aggregated.paymentStats[method]) {
          aggregated.paymentStats[method] = {count: 0, total: 0};
        }
        aggregated.paymentStats[method].count += stats.count || 0;
        aggregated.paymentStats[method].total += stats.total || 0;
      });

      aggregated.dailyBreakdown.push({
        date: report.dateString,
        totalSales: report.totalSales,
        totalPurchases: report.totalPurchases,
        totalProfit: report.totalProfit,
        transactions: report.totalTransactions,
      });
    });

    // Filtrar por material se especificado
    if (material && aggregated.materialStats[material]) {
      aggregated.materialStats = {[material]: aggregated.materialStats[material]};
    }

    logger.info(`Relatório agregado gerado com sucesso: ${aggregated.totalTransactions} transações`);
    return aggregated;
  } catch (error) {
    logger.error("Erro ao gerar relatório agregado:", error);
    throw new Error(`Erro ao gerar relatório: ${error.message}`);
  }
});

exports.resetDailyStats = onSchedule(
    {schedule: "0 0 * * *", timeZone: "America/Sao_Paulo"},
    async (_event) => {
      logger.info("Resetando estatísticas diárias...");

      const statsRef = db.doc("reports/live_summary");

      await statsRef.set(
          {
            transacoesHoje: 0,
            vendasHoje: 0,
            comprasHoje: 0,
            lastDailyReset: admin.firestore.FieldValue.serverTimestamp(),
          },
          {merge: true},
      );

      logger.info("Estatísticas diárias resetadas com sucesso");
    });

exports.resetMonthlyStats = onSchedule(
    {schedule: "0 0 1 * *", timeZone: "America/Sao_Paulo"},
    async (_event) => {
      logger.info("Resetando estatísticas mensais...");

      const statsRef = db.doc("reports/live_summary");

      await statsRef.set(
          {
            totalVendasMes: 0,
            totalComprasMes: 0,
            totalDespesasMes: 0,
            lastMonthlyReset: admin.firestore.FieldValue.serverTimestamp(),
          },
          {merge: true},
      );

      logger.info("Estatísticas mensais resetadas com sucesso");
    });

exports.checkLowStock = onSchedule(
    {schedule: "0 8 * * *", timeZone: "America/Sao_Paulo"},
    async (_event) => {
      logger.info("Verificando estoque baixo...");

      const inventoryRef = db.doc("inventory/current");
      const inventorySnap = await inventoryRef.get();

      if (!inventorySnap.exists) {
        logger.warn("Inventário não encontrado");
        return;
      }

      const inventory = inventorySnap.data();
      const lowStockItems = [];

      // Níveis mínimos padrão por material
      const minLevels = {
        "ferro": 100,
        "aluminio": 80,
        "cobre": 50,
        "latinha": 200,
        "panela": 25,
        "bloco2": 15,
        "chapa": 50,
        "perfil pintado": 30,
        "perfil natural": 30,
        "bloco": 20,
        "metal": 60,
        "inox": 30,
        "bateria": 40,
        "motor_gel": 10,
        "roda": 15,
        "papelao": 100,
        "rad_metal": 35,
        "rad_cobre": 30,
        "rad_chapa": 25,
        "tela": 50,
        "antimonio": 10,
        "cabo_ai": 40,
        "tubo_limpo": 20,
      };

      Object.entries(inventory).forEach(([material, data]) => {
        const minLevel = minLevels[material] || 10;
        if (data.quantidade <= minLevel) {
          lowStockItems.push({
            material,
            quantidade: data.quantidade,
            minLevel,
            nivel: data.quantidade < minLevel / 2 ? "critico" : "baixo",
          });
        }
      });

      if (lowStockItems.length > 0) {
        // Criar notificação
        const notificationRef = db.collection("notifications").doc();
        await notificationRef.set({
          type: "low_stock",
          title: "Alerta de Estoque Baixo",
          message: `${lowStockItems.length} ${lowStockItems.length === 1 ? "material está" : "materiais estão"} com estoque baixo`,
          items: lowStockItems,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info(`Criada notificação de estoque baixo para ${lowStockItems.length} materiais`);
      } else {
        logger.info("Todos os materiais estão com estoque adequado");
      }
    });

exports.getLastTransactionPrice = onCall(async (request) => {
  const {material, tipo} = request.data;

  if (!material || !tipo) {
    throw new Error("Material e tipo são obrigatórios");
  }

  try {
    const snapshot = await db
        .collection("transactions")
        .where("material", "==", material)
        .where("tipo", "==", tipo)
        .orderBy("data", "desc")
        .limit(1)
        .get();

    if (snapshot.empty) {
      return {success: false, message: "Nenhuma transação anterior encontrada"};
    }

    const lastTransaction = snapshot.docs[0].data();

    return {
      success: true,
      precoUnitario: lastTransaction.precoUnitario,
      data: lastTransaction.data,
    };
  } catch (error) {
    logger.error("Erro ao buscar último preço:", error);
    throw new Error(`Erro ao buscar último preço: ${error.message}`);
  }
});
