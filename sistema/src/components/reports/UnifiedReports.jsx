"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Printer, FileText, RefreshCw, FileSpreadsheet, Filter } from "lucide-react"
import { useData } from "@/contexts/DataContext"
import { exportToCSV, generateAdvancedPDF, calculateReportStats } from "@/utils/printUtils"
import { getClients, getSuppliers } from "@/lib/firebaseService"

const UnifiedReports = () => {
  const { transactions = [], refreshData } = useData()
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    reportType: "all",
    material: "",
    paymentMethod: "",
    minValue: "",
    maxValue: "",
  })
  const [reportStats, setReportStats] = useState(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [clientes, setClientes] = useState([])
  const [fornecedores, setFornecedores] = useState([])
  const [clientSupplierStats, setClientSupplierStats] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    const loadClientsAndSuppliers = async () => {
      try {
        const [clientsData, suppliersData] = await Promise.all([getClients(), getSuppliers()])
        setClientes(clientsData)
        setFornecedores(suppliersData)
      } catch (error) {
        console.error("[v0] Erro ao carregar clientes e fornecedores:", error)
      }
    }
    loadClientsAndSuppliers()
  }, [])

  useEffect(() => {
    let filtered = [...transactions]

    if (filters.startDate) {
      const start = new Date(filters.startDate)
      start.setHours(0, 0, 0, 0)
      filtered = filtered.filter((t) => new Date(t.data) >= start)
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate)
      end.setHours(23, 59, 59, 999)
      filtered = filtered.filter((t) => new Date(t.data) <= end)
    }

    if (filters.reportType !== "all") {
      filtered = filtered.filter((t) => t.tipo === filters.reportType)
    }

    if (filters.material) {
      filtered = filtered.filter((t) => t.material?.toLowerCase().includes(filters.material.toLowerCase()))
    }

    if (filters.paymentMethod) {
      filtered = filtered.filter((t) => t.formaPagamento === filters.paymentMethod)
    }

    if (filters.minValue) {
      filtered = filtered.filter((t) => (t.valorTotal || 0) >= Number.parseFloat(filters.minValue))
    }

    if (filters.maxValue) {
      filtered = filtered.filter((t) => (t.valorTotal || 0) <= Number.parseFloat(filters.maxValue))
    }

    setFilteredTransactions(filtered.sort((a, b) => new Date(b.data) - new Date(a.data)))
  }, [transactions, filters])

  useEffect(() => {
    if (filteredTransactions.length > 0) {
      const stats = calculateReportStats(filteredTransactions)
      setReportStats(stats)

      calculateClientSupplierStats(filteredTransactions)
    } else {
      setReportStats(null)
      setClientSupplierStats(null)
    }
  }, [filteredTransactions, clientes, fornecedores])

  const calculateClientSupplierStats = (transactions) => {
    const clientStats = {}
    const supplierStats = {}

    transactions.forEach((t) => {
      if (t.tipo === "venda" && (t.clienteId || t.vendedor)) {
        const key = t.clienteId || t.vendedor
        const clientName = t.clienteId
          ? clientes.find((c) => c.id === t.clienteId)?.nome || t.vendedor || "Cliente Desconhecido"
          : t.vendedor || "Cliente Desconhecido"

        if (!clientStats[key]) {
          clientStats[key] = {
            nome: clientName,
            totalVendas: 0,
            quantidadeTransacoes: 0,
            ticketMedio: 0,
          }
        }
        clientStats[key].totalVendas += t.valorTotal || 0
        clientStats[key].quantidadeTransacoes++
      }

      if (t.tipo === "compra" && (t.fornecedorId || t.vendedor)) {
        const key = t.fornecedorId || t.vendedor
        const supplierName = t.fornecedorId
          ? fornecedores.find((f) => f.id === t.fornecedorId)?.nome || t.vendedor || "Fornecedor Desconhecido"
          : t.vendedor || "Fornecedor Desconhecido"

        if (!supplierStats[key]) {
          supplierStats[key] = {
            nome: supplierName,
            totalCompras: 0,
            quantidadeTransacoes: 0,
            ticketMedio: 0,
          }
        }
        supplierStats[key].totalCompras += t.valorTotal || 0
        supplierStats[key].quantidadeTransacoes++
      }
    })

    // Calculate ticket médio
    Object.values(clientStats).forEach((client) => {
      client.ticketMedio = client.totalVendas / client.quantidadeTransacoes
    })

    Object.values(supplierStats).forEach((supplier) => {
      supplier.ticketMedio = supplier.totalCompras / supplier.quantidadeTransacoes
    })

    // Sort by total value
    const topClients = Object.values(clientStats)
      .sort((a, b) => b.totalVendas - a.totalVendas)
      .slice(0, 10)

    const topSuppliers = Object.values(supplierStats)
      .sort((a, b) => b.totalCompras - a.totalCompras)
      .slice(0, 10)

    setClientSupplierStats({
      topClients,
      topSuppliers,
      totalClients: Object.keys(clientStats).length,
      totalSuppliers: Object.keys(supplierStats).length,
    })
  }

  const getClientSupplierName = (transaction) => {
    if (transaction.tipo === "venda") {
      if (transaction.clienteId) {
        const cliente = clientes.find((c) => c.id === transaction.clienteId)
        return cliente?.nome || transaction.vendedor || "N/A"
      }
      return transaction.vendedor || "N/A"
    } else if (transaction.tipo === "compra") {
      if (transaction.fornecedorId) {
        const fornecedor = fornecedores.find((f) => f.id === transaction.fornecedorId)
        return fornecedor?.nome || transaction.vendedor || "N/A"
      }
      return transaction.vendedor || "N/A"
    }
    return "N/A"
  }

  const handleAdvancedPrint = async (options = {}) => {
    if (!reportStats || filteredTransactions.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há dados para gerar o relatório",
        variant: "destructive",
      })
      return
    }

    const reportData = {
      transactions: filteredTransactions,
      stats: reportStats,
      period: {
        start: filters.startDate || "Início",
        end: filters.endDate || "Hoje",
      },
    }

    try {
      await generateAdvancedPDF(reportData, {
        title: options.title || "RELATÓRIO COMPLETO",
        clientes: clientes,
        fornecedores: fornecedores,
        ...options,
      })

      toast({
        title: "PDF Gerado",
        description: "Seu relatório foi gerado com sucesso!",
        className: "bg-green-100 border-green-500 text-green-800",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handlePrintHTML = () => {
    const printContent = document.getElementById("unified-report-content")
    if (!printContent) return

    const printWindow = window.open("", "_blank")
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório - Império Sucata</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', sans-serif; 
              font-size: 11px; 
              line-height: 1.4; 
              color: #000; 
              background: white;
              padding: 20px;
            }
            .print-header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 3px solid #2563eb; 
              padding-bottom: 20px; 
            }
            .print-header h1 { 
              color: #2563eb; 
              font-size: 24px; 
              margin-bottom: 10px; 
            }
            .print-summary { 
              margin: 20px 0; 
              padding: 20px; 
              border: 2px solid #e2e8f0; 
              background-color: #f8fafc;
              border-radius: 8px;
            }
            .stats-grid { 
              display: grid; 
              grid-template-columns: repeat(4, 1fr); 
              gap: 15px; 
              margin: 20px 0; 
            }
            .stat-card { 
              text-align: center; 
              padding: 15px; 
              border: 1px solid #e2e8f0; 
              background: white;
              border-radius: 6px;
            }
            .stat-value { 
              font-size: 18px; 
              font-weight: bold; 
              color: #2563eb; 
            }
            .stat-label {
              font-size: 10px;
              color: #64748b;
              margin-top: 5px;
              text-transform: uppercase;
            }
            .print-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0; 
            }
            .print-table th, .print-table td { 
              border: 1px solid #cbd5e1; 
              padding: 8px; 
              text-align: left; 
              font-size: 10px; 
            }
            .print-table th { 
              background-color: #2563eb; 
              color: white;
              font-weight: bold; 
            }
            .print-table tr:nth-child(even) { 
              background-color: #f8fafc; 
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              color: #1e40af;
              margin: 30px 0 15px 0;
              padding-bottom: 10px;
              border-bottom: 2px solid #e2e8f0;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e2e8f0;
              text-align: center;
              color: #64748b;
              font-size: 9px;
            }
            @media print {
              body { padding: 10px; }
              .print-table { page-break-inside: auto; }
              .print-table tr { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()

    toast({
      title: "Relatório Preparado",
      description: "Seu relatório está sendo impresso.",
      className: "bg-green-100 border-green-500 text-green-800",
    })
  }

  const getReportTitle = () => {
    switch (filters.reportType) {
      case "venda":
        return "Relatório de Vendas"
      case "compra":
        return "Relatório de Compras"
      case "despesa":
        return "Relatório de Despesas"
      default:
        return "Relatório Completo"
    }
  }

  const groupTransactionsByType = () => {
    const vendas = filteredTransactions.filter((t) => t.tipo === "venda")
    const compras = filteredTransactions.filter((t) => t.tipo === "compra")
    const despesas = filteredTransactions.filter((t) => t.tipo === "despesa")
    return { vendas, compras, despesas }
  }

  const { vendas, compras, despesas } = groupTransactionsByType()

  return (
    <div className="space-y-6">
      {/* Filtros Básicos */}
      <Card className="card-professional">
        <div className="card-header-professional">
          <h2 className="text-xl font-semibold">Filtros do Relatório</h2>
        </div>
        <div className="card-content-professional">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="form-group-professional">
              <label className="form-label-professional">Data Inicial</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                className="form-input-professional"
              />
            </div>
            <div className="form-group-professional">
              <label className="form-label-professional">Data Final</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                className="form-input-professional"
              />
            </div>
            <div className="form-group-professional">
              <label className="form-label-professional">Tipo</label>
              <select
                value={filters.reportType}
                onChange={(e) => setFilters((prev) => ({ ...prev, reportType: e.target.value }))}
                className="form-input-professional"
              >
                <option value="all">Todos</option>
                <option value="venda">Vendas</option>
                <option value="compra">Compras</option>
                <option value="despesa">Despesas</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} variant="outline" className="flex-1">
                <Filter className="h-4 w-4 mr-2" />
                Filtros Avançados
              </Button>
              <Button onClick={refreshData} variant="outline">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
              <div className="form-group-professional">
                <label className="form-label-professional">Material</label>
                <input
                  type="text"
                  placeholder="Buscar material..."
                  value={filters.material}
                  onChange={(e) => setFilters((prev) => ({ ...prev, material: e.target.value }))}
                  className="form-input-professional"
                />
              </div>
              <div className="form-group-professional">
                <label className="form-label-professional">Forma Pagamento</label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) => setFilters((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                  className="form-input-professional"
                >
                  <option value="">Todas</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="pix">PIX</option>
                  <option value="cartao">Cartão</option>
                  <option value="transferencia">Transferência</option>
                </select>
              </div>
              <div className="form-group-professional">
                <label className="form-label-professional">Valor Mínimo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={filters.minValue}
                  onChange={(e) => setFilters((prev) => ({ ...prev, minValue: e.target.value }))}
                  className="form-input-professional"
                />
              </div>
              <div className="form-group-professional">
                <label className="form-label-professional">Valor Máximo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={filters.maxValue}
                  onChange={(e) => setFilters((prev) => ({ ...prev, maxValue: e.target.value }))}
                  className="form-input-professional"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="card-professional no-print">
        <div className="card-content-professional">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button onClick={handlePrintHTML} className="btn-large">
              <Printer className="h-5 w-5 mr-2" />
              Imprimir HTML
            </Button>
            <Button
              onClick={() =>
                handleAdvancedPrint({
                  title: "RELATÓRIO COMPLETO",
                  includeClientSupplierAnalysis: true,
                  includeDailyAnalysis: true,
                })
              }
              variant="secondary"
              className="btn-large"
            >
              <FileText className="h-5 w-5 mr-2" />
              PDF Completo
            </Button>
            <Button
              onClick={() =>
                handleAdvancedPrint({
                  title: "RELATÓRIO EXECUTIVO",
                  includeDetails: false,
                  includeClientSupplierAnalysis: true,
                  includeDailyAnalysis: false,
                })
              }
              variant="secondary"
              className="btn-large"
            >
              <FileText className="h-5 w-5 mr-2" />
              PDF Executivo
            </Button>
            <Button
              onClick={() =>
                exportToCSV(
                  filteredTransactions,
                  `relatorio_${filters.reportType}_${new Date().toISOString().split("T")[0]}.csv`,
                )
              }
              variant="outline"
              className="btn-large"
            >
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Conteúdo do Relatório */}
      <div id="unified-report-content">
        <div className="print-header">
          <h1>{getReportTitle()}</h1>
          <p>Império Sucata - Sistema de Gestão Profissional</p>
          <p>
            Período: {filters.startDate ? new Date(filters.startDate).toLocaleDateString("pt-BR") : "Início"} até{" "}
            {filters.endDate ? new Date(filters.endDate).toLocaleDateString("pt-BR") : "Hoje"}
          </p>
          <p>
            Gerado em: {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")}
          </p>
          <p style={{ marginTop: "10px", fontSize: "10px", color: "#64748b" }}>
            Total de transações: {filteredTransactions.length}
          </p>
        </div>

        {/* Resumo Executivo Melhorado */}
        {reportStats && (
          <div className="print-summary">
            <h3 className="section-title">Resumo Executivo</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value" style={{ color: "#16a34a" }}>
                  R$ {reportStats.totalSales?.toFixed(2) || "0.00"}
                </div>
                <div className="stat-label">Total Vendas</div>
                <div style={{ fontSize: "9px", color: "#64748b", marginTop: "5px" }}>
                  {reportStats.salesCount || 0} transações
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: "#ea580c" }}>
                  R$ {reportStats.totalPurchases?.toFixed(2) || "0.00"}
                </div>
                <div className="stat-label">Total Compras</div>
                <div style={{ fontSize: "9px", color: "#64748b", marginTop: "5px" }}>
                  {reportStats.purchasesCount || 0} transações
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: "#dc2626" }}>
                  R$ {reportStats.totalExpenses?.toFixed(2) || "0.00"}
                </div>
                <div className="stat-label">Total Despesas</div>
                <div style={{ fontSize: "9px", color: "#64748b", marginTop: "5px" }}>
                  {reportStats.expensesCount || 0} transações
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: reportStats.totalProfit >= 0 ? "#16a34a" : "#dc2626" }}>
                  R$ {reportStats.totalProfit?.toFixed(2) || "0.00"}
                </div>
                <div className="stat-label">Lucro Líquido</div>
                <div style={{ fontSize: "9px", color: "#64748b", marginTop: "5px" }}>
                  Margem: {reportStats.profitMargin?.toFixed(1) || "0.0"}%
                </div>
              </div>
            </div>

            {reportStats.performanceMetrics && (
              <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #e2e8f0" }}>
                <h4 style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "10px", color: "#1e40af" }}>
                  Métricas de Performance
                </h4>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value" style={{ fontSize: "14px" }}>
                      R$ {reportStats.performanceMetrics.ticketMedioVenda?.toFixed(2) || "0.00"}
                    </div>
                    <div className="stat-label">Ticket Médio Venda</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ fontSize: "14px" }}>
                      R$ {reportStats.performanceMetrics.ticketMedioCompra?.toFixed(2) || "0.00"}
                    </div>
                    <div className="stat-label">Ticket Médio Compra</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ fontSize: "14px" }}>
                      {reportStats.performanceMetrics.rotatividadeEstoque?.toFixed(2) || "0.00"}
                    </div>
                    <div className="stat-label">Rotatividade Estoque</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ fontSize: "14px" }}>
                      {reportStats.performanceMetrics.diasVendaMedia?.toFixed(1) || "0.0"}
                    </div>
                    <div className="stat-label">Dias por Venda</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {clientSupplierStats &&
          (clientSupplierStats.topClients.length > 0 || clientSupplierStats.topSuppliers.length > 0) && (
            <div className="print-summary" style={{ marginTop: "30px" }}>
              <h3 className="section-title">📊 Análise de Clientes e Fornecedores</h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Top Clientes */}
                {clientSupplierStats.topClients.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "10px", color: "#16a34a" }}>
                      🏆 Top 10 Clientes (Total: {clientSupplierStats.totalClients})
                    </h4>
                    <table className="print-table" style={{ fontSize: "9px" }}>
                      <thead>
                        <tr>
                          <th style={{ width: "5%" }}>#</th>
                          <th style={{ width: "45%" }}>Cliente</th>
                          <th style={{ width: "25%" }}>Total Vendas</th>
                          <th style={{ width: "10%" }}>Qtd</th>
                          <th style={{ width: "15%" }}>Ticket Médio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientSupplierStats.topClients.map((client, index) => (
                          <tr key={index}>
                            <td style={{ textAlign: "center", fontWeight: "bold" }}>{index + 1}</td>
                            <td>{client.nome}</td>
                            <td style={{ textAlign: "right", fontWeight: "bold", color: "#16a34a" }}>
                              R$ {client.totalVendas.toFixed(2)}
                            </td>
                            <td style={{ textAlign: "center" }}>{client.quantidadeTransacoes}</td>
                            <td style={{ textAlign: "right" }}>R$ {client.ticketMedio.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Top Fornecedores */}
                {clientSupplierStats.topSuppliers.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "10px", color: "#ea580c" }}>
                      🏆 Top 10 Fornecedores (Total: {clientSupplierStats.totalSuppliers})
                    </h4>
                    <table className="print-table" style={{ fontSize: "9px" }}>
                      <thead>
                        <tr>
                          <th style={{ width: "5%" }}>#</th>
                          <th style={{ width: "45%" }}>Fornecedor</th>
                          <th style={{ width: "25%" }}>Total Compras</th>
                          <th style={{ width: "10%" }}>Qtd</th>
                          <th style={{ width: "15%" }}>Ticket Médio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientSupplierStats.topSuppliers.map((supplier, index) => (
                          <tr key={index}>
                            <td style={{ textAlign: "center", fontWeight: "bold" }}>{index + 1}</td>
                            <td>{supplier.nome}</td>
                            <td style={{ textAlign: "right", fontWeight: "bold", color: "#ea580c" }}>
                              R$ {supplier.totalCompras.toFixed(2)}
                            </td>
                            <td style={{ textAlign: "center" }}>{supplier.quantidadeTransacoes}</td>
                            <td style={{ textAlign: "right" }}>R$ {supplier.ticketMedio.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Tabelas de Transações */}
        {(filters.reportType === "all" || filters.reportType === "venda") && vendas.length > 0 && (
          <div>
            <h3 className="section-title">📈 Vendas Realizadas</h3>
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: "12%" }}>Data</th>
                  <th style={{ width: "20%" }}>Material</th>
                  <th style={{ width: "10%" }}>Qtd (kg)</th>
                  <th style={{ width: "12%" }}>Preço/kg</th>
                  <th style={{ width: "12%" }}>Total</th>
                  <th style={{ width: "12%" }}>Pagamento</th>
                  <th style={{ width: "15%" }}>Cliente</th>
                  <th style={{ width: "7%" }}>Obs</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map((t, index) => (
                  <tr key={index}>
                    <td>{new Date(t.data).toLocaleDateString("pt-BR")}</td>
                    <td>{t.material || "N/A"}</td>
                    <td style={{ textAlign: "right" }}>{(t.quantidade || 0).toFixed(2)}</td>
                    <td style={{ textAlign: "right" }}>R$ {(t.precoUnitario || 0).toFixed(2)}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold" }}>R$ {(t.valorTotal || 0).toFixed(2)}</td>
                    <td>{(t.formaPagamento || "dinheiro").toUpperCase()}</td>
                    <td>{getClientSupplierName(t)}</td>
                    <td style={{ fontSize: "8px" }}>{(t.observacoes || "").substring(0, 10)}</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: "#f1f5f9", fontWeight: "bold" }}>
                  <td colSpan="4" style={{ textAlign: "right" }}>
                    TOTAL:
                  </td>
                  <td style={{ textAlign: "right" }}>
                    R$ {vendas.reduce((sum, t) => sum + (t.valorTotal || 0), 0).toFixed(2)}
                  </td>
                  <td colSpan="3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {(filters.reportType === "all" || filters.reportType === "compra") && compras.length > 0 && (
          <div style={{ marginTop: "30px" }}>
            <h3 className="section-title">📦 Compras Realizadas</h3>
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: "12%" }}>Data</th>
                  <th style={{ width: "20%" }}>Material</th>
                  <th style={{ width: "10%" }}>Qtd (kg)</th>
                  <th style={{ width: "12%" }}>Preço/kg</th>
                  <th style={{ width: "12%" }}>Total</th>
                  <th style={{ width: "12%" }}>Pagamento</th>
                  <th style={{ width: "15%" }}>Fornecedor</th>
                  <th style={{ width: "7%" }}>Obs</th>
                </tr>
              </thead>
              <tbody>
                {compras.map((t, index) => (
                  <tr key={index}>
                    <td>{new Date(t.data).toLocaleDateString("pt-BR")}</td>
                    <td>{t.material || "N/A"}</td>
                    <td style={{ textAlign: "right" }}>{(t.quantidade || 0).toFixed(2)}</td>
                    <td style={{ textAlign: "right" }}>R$ {(t.precoUnitario || 0).toFixed(2)}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold" }}>R$ {(t.valorTotal || 0).toFixed(2)}</td>
                    <td>{(t.formaPagamento || "dinheiro").toUpperCase()}</td>
                    <td>{getClientSupplierName(t)}</td>
                    <td style={{ fontSize: "8px" }}>{(t.observacoes || "").substring(0, 10)}</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: "#f1f5f9", fontWeight: "bold" }}>
                  <td colSpan="4" style={{ textAlign: "right" }}>
                    TOTAL:
                  </td>
                  <td style={{ textAlign: "right" }}>
                    R$ {compras.reduce((sum, t) => sum + (t.valorTotal || 0), 0).toFixed(2)}
                  </td>
                  <td colSpan="3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {(filters.reportType === "all" || filters.reportType === "despesa") && despesas.length > 0 && (
          <div style={{ marginTop: "30px" }}>
            <h3 className="section-title">💰 Despesas Registradas</h3>
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: "15%" }}>Data</th>
                  <th style={{ width: "25%" }}>Descrição</th>
                  <th style={{ width: "15%" }}>Categoria</th>
                  <th style={{ width: "15%" }}>Valor</th>
                  <th style={{ width: "15%" }}>Pagamento</th>
                  <th style={{ width: "15%" }}>Observações</th>
                </tr>
              </thead>
              <tbody>
                {despesas.map((t, index) => (
                  <tr key={index}>
                    <td>{new Date(t.data).toLocaleDateString("pt-BR")}</td>
                    <td>{t.descricao || t.material || "N/A"}</td>
                    <td>{t.categoria || "Geral"}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold" }}>
                      R$ {(t.valorTotal || t.valor || 0).toFixed(2)}
                    </td>
                    <td>{(t.formaPagamento || "dinheiro").toUpperCase()}</td>
                    <td style={{ fontSize: "8px" }}>{(t.observacoes || "").substring(0, 20)}</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: "#f1f5f9", fontWeight: "bold" }}>
                  <td colSpan="3" style={{ textAlign: "right" }}>
                    TOTAL:
                  </td>
                  <td style={{ textAlign: "right" }}>
                    R$ {despesas.reduce((sum, t) => sum + (t.valorTotal || t.valor || 0), 0).toFixed(2)}
                  </td>
                  <td colSpan="2"></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="footer">
          <p>
            <strong>Império Sucata</strong> - Sistema de Gestão Profissional
          </p>
          <p>Este relatório contém informações confidenciais e deve ser mantido em local seguro</p>
          <p style={{ marginTop: "5px" }}>
            Documento gerado automaticamente pelo sistema em {new Date().toLocaleString("pt-BR")}
          </p>
        </div>
      </div>
    </div>
  )
}

export default UnifiedReports
