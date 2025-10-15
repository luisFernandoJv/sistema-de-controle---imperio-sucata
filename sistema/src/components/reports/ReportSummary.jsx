"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, FileText, BarChart3, Calculator, Percent, Target } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

const StatCard = ({ icon: Icon, title, value, subtitle, color, bgColor, trend }) => (
  <div
    className={`relative p-6 ${bgColor} rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100`}
  >
    <div className="flex items-center justify-between mb-3">
      <Icon className={`h-8 w-8 ${color}`} />
      {trend && (
        <div
          className={`text-xs px-2 py-1 rounded-full ${trend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
        >
          {trend > 0 ? "+" : ""}
          {trend.toFixed(1)}%
        </div>
      )}
    </div>
    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
    <p className={`text-2xl font-bold ${color} mb-1`}>{value}</p>
    {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
  </div>
)

const AdvancedMetrics = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
      <div className="flex items-center mb-2">
        <Percent className="h-5 w-5 text-blue-600 mr-2" />
        <span className="font-semibold text-blue-800">Margem de Lucro</span>
      </div>
      <p className="text-2xl font-bold text-blue-600">{stats.margemLucro.toFixed(1)}%</p>
      <p className="text-xs text-blue-600 mt-1">
        {stats.margemLucro >= 30 ? "Excelente margem" : stats.margemLucro >= 15 ? "Boa margem" : "Margem baixa"}
      </p>
    </div>

    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100">
      <div className="flex items-center mb-2">
        <Calculator className="h-5 w-5 text-purple-600 mr-2" />
        <span className="font-semibold text-purple-800">Ticket Médio</span>
      </div>
      <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.ticketMedio)}</p>
      <p className="text-xs text-purple-600 mt-1">Por transação</p>
    </div>

    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-100">
      <div className="flex items-center mb-2">
        <Target className="h-5 w-5 text-orange-600 mr-2" />
        <span className="font-semibold text-orange-800">ROI</span>
      </div>
      <p className="text-2xl font-bold text-orange-600">{stats.roi.toFixed(1)}%</p>
      <p className="text-xs text-orange-600 mt-1">Retorno sobre investimento</p>
    </div>
  </div>
)

const ReportSummary = ({ transactions }) => {
  const stats = useMemo(() => {
    const vendas = transactions.filter((t) => t.tipo === "venda")
    const compras = transactions.filter((t) => t.tipo === "compra")
    const despesas = transactions.filter((t) => t.tipo === "despesa")

    const totalVendas = vendas.reduce((sum, t) => sum + t.valorTotal, 0)
    const totalCompras = compras.reduce((sum, t) => sum + t.valorTotal, 0)
    const totalDespesas = despesas.reduce((sum, t) => sum + t.valorTotal, 0)

    const lucroTotal = totalVendas - totalCompras - totalDespesas
    const margemLucro = totalVendas > 0 ? (lucroTotal / totalVendas) * 100 : 0
    const ticketMedio = transactions.length > 0 ? (totalVendas + totalCompras) / transactions.length : 0
    const roi = totalCompras > 0 ? (lucroTotal / totalCompras) * 100 : 0

    return {
      totalVendas,
      totalCompras,
      totalDespesas,
      lucroTotal,
      margemLucro,
      ticketMedio,
      roi,
      totalTransacoes: transactions.length,
      totalVendasCount: vendas.length,
      totalComprasCount: compras.length,
      totalDespesasCount: despesas.length,
    }
  }, [transactions])

  return (
    <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="h-7 w-7 mr-3 text-green-600" />📊 Dashboard Executivo
        </h2>
        <div className="text-sm text-gray-500">Período analisado: {transactions.length} transações</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          icon={TrendingUp}
          title="💰 Receita Total"
          value={formatCurrency(stats.totalVendas)}
          subtitle={`${stats.totalVendasCount} vendas realizadas`}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard
          icon={TrendingDown}
          title="🛒 Investimento"
          value={formatCurrency(stats.totalCompras)}
          subtitle={`${stats.totalComprasCount} compras realizadas`}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={FileText}
          title="💸 Despesas"
          value={formatCurrency(stats.totalDespesas)}
          subtitle={`${stats.totalDespesasCount} despesas registradas`}
          color="text-red-600"
          bgColor="bg-red-50"
        />
        <StatCard
          icon={DollarSign}
          title="🎯 Lucro Líquido"
          value={formatCurrency(stats.lucroTotal)}
          subtitle={stats.lucroTotal >= 0 ? "Resultado positivo" : "Resultado negativo"}
          color={stats.lucroTotal >= 0 ? "text-green-600" : "text-red-600"}
          bgColor={stats.lucroTotal >= 0 ? "bg-green-50" : "bg-red-50"}
        />
      </div>

      <AdvancedMetrics stats={stats} />

      <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
          <Target className="h-5 w-5 mr-2 text-blue-600" />📈 Indicadores de Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Status Financeiro:</span>
            <span className={`font-semibold ${stats.lucroTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
              {stats.lucroTotal >= 0 ? "✅ Lucrativo" : "⚠️ Prejuízo"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Eficiência:</span>
            <span
              className={`font-semibold ${stats.margemLucro >= 20 ? "text-green-600" : stats.margemLucro >= 10 ? "text-yellow-600" : "text-red-600"}`}
            >
              {stats.margemLucro >= 20 ? "🚀 Alta" : stats.margemLucro >= 10 ? "⚡ Média" : "🔄 Baixa"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Volume de Negócios:</span>
            <span
              className={`font-semibold ${stats.totalTransacoes >= 50 ? "text-green-600" : stats.totalTransacoes >= 20 ? "text-yellow-600" : "text-blue-600"}`}
            >
              {stats.totalTransacoes >= 50 ? "📈 Alto" : stats.totalTransacoes >= 20 ? "📊 Médio" : "📋 Baixo"}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default ReportSummary
