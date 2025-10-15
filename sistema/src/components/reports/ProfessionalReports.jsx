"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Calendar, FileDown, FileText, TrendingUp, BarChart3, RefreshCw } from "lucide-react"
import { useData } from "@/contexts/DataContext"
import { generateFinancialPDF, generateMaterialPDF, generateDailyPDF, exportToExcel } from "@/utils/reportGenerators"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function ProfessionalReports() {
  const { fetchDailyReports, fetchMonthlyReport, fetchYearlyReport } = useData()
  const { toast } = useToast()

  const [reportType, setReportType] = useState("financial")
  const [period, setPeriod] = useState("month")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState(null)

  useEffect(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    setStartDate(format(firstDay, "yyyy-MM-dd"))
    setEndDate(format(lastDay, "yyyy-MM-dd"))
  }, [])

  useEffect(() => {
    if (period !== "custom") {
      loadReportData()
    }
  }, [period])

  const loadReportData = async () => {
    setLoading(true)
    try {
      let rawData
      let transformedData

      if (period === "custom" && startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)

        if (end < start) {
          toast({
            title: "⚠️ Data inválida",
            description: "A data final deve ser posterior à data inicial",
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        // Fetch daily reports for custom range - OPTIMIZED: reads from daily_reports collection
        rawData = await fetchDailyReports(startDate, endDate)
        transformedData = transformDailyReportsToSummary(rawData)

        toast({
          title: "✅ Dados carregados",
          description: `${rawData.length} relatórios diários carregados (${rawData.length} leituras otimizadas)`,
          className: "bg-green-100 border-green-500 text-green-800",
        })
      } else if (period === "month") {
        // Fetch monthly report - OPTIMIZED: aggregates daily_reports
        const date = new Date()
        rawData = await fetchMonthlyReport(date.getFullYear(), date.getMonth() + 1)
        transformedData = transformMonthlyReportToSummary(rawData)

        toast({
          title: "✅ Relatório mensal carregado",
          description: `Dados agregados de ${rawData.dailyBreakdown?.length || 0} dias`,
          className: "bg-green-100 border-green-500 text-green-800",
        })
      } else if (period === "year") {
        // Fetch yearly report - OPTIMIZED: aggregates daily_reports
        const date = new Date()
        rawData = await fetchYearlyReport(date.getFullYear())
        transformedData = transformYearlyReportToSummary(rawData)

        toast({
          title: "✅ Relatório anual carregado",
          description: `Dados agregados de ${Object.keys(rawData.monthlyBreakdown || {}).length} meses`,
          className: "bg-green-100 border-green-500 text-green-800",
        })
      }

      setReportData(transformedData)
    } catch (error) {
      console.error("[v0] Erro ao carregar dados:", error)
      toast({
        title: "❌ Erro ao carregar dados",
        description: error.message || "Não foi possível carregar os dados agregados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const transformDailyReportsToSummary = (dailyReports) => {
    const summary = {
      totalSales: 0,
      totalPurchases: 0,
      totalExpenses: 0,
      profit: 0,
      dailyData: [],
      materialStats: {},
      paymentStats: {},
    }

    dailyReports.forEach((report) => {
      summary.totalSales += report.totalSales || 0
      summary.totalPurchases += report.totalPurchases || 0
      summary.totalExpenses += report.totalExpenses || 0
      summary.profit += report.totalProfit || 0

      // Add to daily data array
      summary.dailyData.push({
        date: report.date,
        sales: report.totalSales || 0,
        purchases: report.totalPurchases || 0,
        expenses: report.totalExpenses || 0,
        profit: report.totalProfit || 0,
        transactionCount: report.totalTransactions || 0,
      })

      // Aggregate material stats
      if (report.materialStats) {
        Object.entries(report.materialStats).forEach(([material, stats]) => {
          if (!summary.materialStats[material]) {
            summary.materialStats[material] = {
              quantity: 0,
              sales: 0,
              purchases: 0,
              profit: 0,
              margin: 0,
            }
          }
          summary.materialStats[material].quantity += stats.quantidade || 0
          summary.materialStats[material].sales += stats.vendas || 0
          summary.materialStats[material].purchases += stats.compras || 0
          summary.materialStats[material].profit += stats.lucro || 0
        })
      }

      // Aggregate payment stats
      if (report.paymentStats) {
        Object.entries(report.paymentStats).forEach(([method, stats]) => {
          if (!summary.paymentStats[method]) {
            summary.paymentStats[method] = { count: 0, total: 0 }
          }
          summary.paymentStats[method].count += stats.count || 0
          summary.paymentStats[method].total += stats.total || 0
        })
      }
    })

    // Calculate margins for materials
    Object.keys(summary.materialStats).forEach((material) => {
      const stats = summary.materialStats[material]
      if (stats.sales > 0) {
        stats.margin = ((stats.profit / stats.sales) * 100).toFixed(2)
      }
    })

    return summary
  }

  const transformMonthlyReportToSummary = (monthlyReport) => {
    const summary = {
      totalSales: monthlyReport.totalSales || 0,
      totalPurchases: monthlyReport.totalPurchases || 0,
      totalExpenses: monthlyReport.totalExpenses || 0,
      profit: monthlyReport.totalProfit || 0,
      dailyData: [],
      materialStats: {},
      paymentStats: {},
    }

    // Transform daily breakdown
    if (monthlyReport.dailyBreakdown) {
      monthlyReport.dailyBreakdown.forEach((report) => {
        summary.dailyData.push({
          date: report.date,
          sales: report.totalSales || 0,
          purchases: report.totalPurchases || 0,
          expenses: report.totalExpenses || 0,
          profit: report.totalProfit || 0,
          transactionCount: report.totalTransactions || 0,
        })
      })
    }

    // Transform material stats
    if (monthlyReport.materialStats) {
      Object.entries(monthlyReport.materialStats).forEach(([material, stats]) => {
        summary.materialStats[material] = {
          quantity: stats.quantidade || 0,
          sales: stats.vendas || 0,
          purchases: stats.compras || 0,
          profit: stats.lucro || 0,
          margin: stats.vendas > 0 ? (((stats.lucro || 0) / stats.vendas) * 100).toFixed(2) : 0,
        }
      })
    }

    return summary
  }

  const transformYearlyReportToSummary = (yearlyReport) => {
    const summary = {
      totalSales: yearlyReport.totalSales || 0,
      totalPurchases: yearlyReport.totalPurchases || 0,
      totalExpenses: yearlyReport.totalExpenses || 0,
      profit: yearlyReport.totalProfit || 0,
      dailyData: [],
      materialStats: {},
      paymentStats: {},
    }

    // Transform monthly breakdown to daily-like data
    if (yearlyReport.monthlyBreakdown) {
      Object.entries(yearlyReport.monthlyBreakdown).forEach(([month, data]) => {
        summary.dailyData.push({
          date: new Date(yearlyReport.year, Number.parseInt(month) - 1, 1),
          sales: data.totalSales || 0,
          purchases: data.totalPurchases || 0,
          expenses: data.totalExpenses || 0,
          profit: data.totalProfit || 0,
          transactionCount: data.totalTransactions || 0,
        })
      })
    }

    // Transform material stats
    if (yearlyReport.materialStats) {
      Object.entries(yearlyReport.materialStats).forEach(([material, stats]) => {
        summary.materialStats[material] = {
          quantity: stats.quantidade || 0,
          sales: stats.vendas || 0,
          purchases: stats.compras || 0,
          profit: stats.lucro || 0,
          margin: stats.vendas > 0 ? (((stats.lucro || 0) / stats.vendas) * 100).toFixed(2) : 0,
        }
      })
    }

    return summary
  }

  const handleGeneratePDF = async () => {
    if (!reportData) {
      toast({
        title: "⚠️ Sem dados",
        description: "Carregue os dados primeiro",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      if (reportType === "financial") {
        await generateFinancialPDF(reportData, { startDate, endDate })
      } else if (reportType === "material") {
        await generateMaterialPDF(reportData, { startDate, endDate })
      } else if (reportType === "daily") {
        await generateDailyPDF(reportData, { startDate, endDate })
      }

      toast({
        title: "✅ PDF gerado",
        description: "Relatório exportado com sucesso",
        className: "bg-green-100 border-green-500 text-green-800",
      })
    } catch (error) {
      console.error("[v0] Erro ao gerar PDF:", error)
      toast({
        title: "❌ Erro ao gerar PDF",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = async () => {
    if (!reportData) {
      toast({
        title: "⚠️ Sem dados",
        description: "Carregue os dados primeiro",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await exportToExcel(reportData, { startDate, endDate, reportType })

      toast({
        title: "✅ Excel exportado",
        description: "Planilha com múltiplas abas criada com sucesso",
        className: "bg-green-100 border-green-500 text-green-800",
      })
    } catch (error) {
      console.error("[v0] Erro ao exportar Excel:", error)
      toast({
        title: "❌ Erro ao exportar Excel",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Card className="p-6 shadow-lg border-2 border-blue-100">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <BarChart3 className="h-8 w-8 mr-3 text-blue-600" />
            Relatórios Profissionais
          </h2>
          <p className="text-gray-600">
            ⚡ Sistema otimizado com dados agregados - Consumo mínimo de leituras no Firestore
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Relatório</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="financial">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Financeiro
                  </div>
                </SelectItem>
                <SelectItem value="material">
                  <div className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Por Material
                  </div>
                </SelectItem>
                <SelectItem value="daily">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Diário
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="year">Este Ano</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {period === "custom" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </>
          )}
        </div>

        {period === "custom" && (
          <div className="mb-6">
            <Button onClick={loadReportData} disabled={loading || !startDate || !endDate} className="w-full md:w-auto">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Carregando..." : "Carregar Dados"}
            </Button>
          </div>
        )}

        {reportData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4 bg-green-50 border-green-200">
                <p className="text-sm text-gray-600">Total Vendas</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {(reportData.totalSales || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </Card>

              <Card className="p-4 bg-blue-50 border-blue-200">
                <p className="text-sm text-gray-600">Total Compras</p>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {(reportData.totalPurchases || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </Card>

              <Card className="p-4 bg-red-50 border-red-200">
                <p className="text-sm text-gray-600">Total Despesas</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {(reportData.totalExpenses || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </Card>

              <Card className="p-4 bg-purple-50 border-purple-200">
                <p className="text-sm text-gray-600">Lucro Líquido</p>
                <p
                  className={`text-2xl font-bold ${(reportData.profit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  R$ {(reportData.profit || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleGeneratePDF}
                disabled={loading}
                className="flex-1 h-12 bg-purple-600 hover:bg-purple-700"
              >
                <FileDown className="h-5 w-5 mr-2" />
                Exportar PDF
              </Button>

              <Button
                onClick={handleExportExcel}
                disabled={loading}
                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700"
              >
                <FileText className="h-5 w-5 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </>
        )}
      </Card>

      {reportData && reportData.dailyData && reportData.dailyData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">📊 Resumo Diário</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Data</th>
                  <th className="text-right p-2">Transações</th>
                  <th className="text-right p-2">Vendas</th>
                  <th className="text-right p-2">Compras</th>
                  <th className="text-right p-2">Despesas</th>
                  <th className="text-right p-2">Lucro</th>
                </tr>
              </thead>
              <tbody>
                {reportData.dailyData.map((day, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2">{format(new Date(day.date), "dd/MM/yyyy", { locale: ptBR })}</td>
                    <td className="text-right p-2 text-gray-600">{day.transactionCount || 0}</td>
                    <td className="text-right p-2 text-green-600">R$ {(day.sales || 0).toFixed(2)}</td>
                    <td className="text-right p-2 text-blue-600">R$ {(day.purchases || 0).toFixed(2)}</td>
                    <td className="text-right p-2 text-red-600">R$ {(day.expenses || 0).toFixed(2)}</td>
                    <td
                      className={`text-right p-2 font-bold ${(day.profit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      R$ {(day.profit || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
