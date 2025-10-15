"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Calendar, TrendingUp, TrendingDown, BarChart3, Target, DollarSign, Activity } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

const DailyReport = ({ transactions }) => {
  const [viewMode, setViewMode] = useState("cards") // cards, table, chart
  const [sortBy, setSortBy] = useState("date") // date, vendas, compras, lucro, transacoes

  const dailyData = useMemo(() => {
    const dataByDay = {}

    transactions.forEach((t) => {
      const date = formatDate(t.data)
      if (!dataByDay[date]) {
        dataByDay[date] = {
          vendas: 0,
          compras: 0,
          despesas: 0,
          transacoes: 0,
          transacoesVenda: 0,
          transacoesCompra: 0,
          transacoesDespesa: 0,
          materiais: new Set(),
        }
      }

      if (t.tipo === "venda") {
        dataByDay[date].vendas += t.valorTotal
        dataByDay[date].transacoesVenda++
      } else if (t.tipo === "compra") {
        dataByDay[date].compras += t.valorTotal
        dataByDay[date].transacoesCompra++
      } else if (t.tipo === "despesa") {
        dataByDay[date].despesas += t.valorTotal
        dataByDay[date].transacoesDespesa++
      }

      dataByDay[date].transacoes++
      if (t.material) {
        dataByDay[date].materiais.add(t.material)
      }
    })

    Object.keys(dataByDay).forEach((date) => {
      const data = dataByDay[date]
      data.lucroOperacional = data.vendas - data.compras
      data.lucroLiquido = data.vendas - data.compras - data.despesas
      data.margem = data.vendas > 0 ? (data.lucroLiquido / data.vendas) * 100 : 0
      data.ticketMedio = data.transacoes > 0 ? (data.vendas + data.compras + data.despesas) / data.transacoes : 0
      data.materiaisCount = data.materiais.size
      data.eficiencia = data.transacoes > 0 ? data.lucroLiquido / data.transacoes : 0
    })

    const sortedEntries = Object.entries(dataByDay)

    if (sortBy === "date") {
      return sortedEntries.sort(
        (a, b) => new Date(b[0].split("/").reverse().join("-")) - new Date(a[0].split("/").reverse().join("-")),
      )
    } else {
      return sortedEntries.sort((a, b) => b[1][sortBy] - a[1][sortBy])
    }
  }, [transactions, sortBy])

  const periodStats = useMemo(() => {
    const allData = dailyData.map(([, data]) => data)
    const totalDias = allData.length
    const diasComLucro = allData.filter((d) => d.lucroLiquido > 0).length
    const melhorDia = allData.reduce((max, day) => (day.lucroLiquido > max.lucroLiquido ? day : max), {
      lucroLiquido: Number.NEGATIVE_INFINITY,
    })
    const piorDia = allData.reduce((min, day) => (day.lucroLiquido < min.lucroLiquido ? day : min), {
      lucroLiquido: Number.POSITIVE_INFINITY,
    })

    return {
      totalDias,
      diasComLucro,
      percentualLucro: totalDias > 0 ? (diasComLucro / totalDias) * 100 : 0,
      melhorDia: melhorDia.lucroLiquido !== Number.NEGATIVE_INFINITY ? melhorDia : null,
      piorDia: piorDia.lucroLiquido !== Number.POSITIVE_INFINITY ? piorDia : null,
      mediaVendasDia: totalDias > 0 ? allData.reduce((sum, d) => sum + d.vendas, 0) / totalDias : 0,
      mediaLucroDia: totalDias > 0 ? allData.reduce((sum, d) => sum + d.lucroLiquido, 0) / totalDias : 0,
    }
  }, [dailyData])

  return (
    <Card className="p-6 shadow-lg border-0 bg-white">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center mb-4 lg:mb-0">
          <Calendar className="h-6 w-6 mr-2 text-blue-600" />📅 Análise de Performance Diária
        </h3>

        <div className="flex flex-wrap gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">📅 Por Data</option>
            <option value="lucroLiquido">💰 Por Lucro</option>
            <option value="vendas">📈 Por Vendas</option>
            <option value="transacoes">📊 Por Volume</option>
            <option value="margem">📋 Por Margem</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <div className="text-center">
          <Activity className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Dias Analisados</p>
          <p className="text-xl font-bold text-blue-600">{periodStats.totalDias}</p>
        </div>
        <div className="text-center">
          <Target className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Taxa de Sucesso</p>
          <p className="text-xl font-bold text-green-600">{periodStats.percentualLucro.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">{periodStats.diasComLucro} dias lucrativos</p>
        </div>
        <div className="text-center">
          <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Média Vendas/Dia</p>
          <p className="text-xl font-bold text-purple-600">{formatCurrency(periodStats.mediaVendasDia)}</p>
        </div>
        <div className="text-center">
          <DollarSign className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Média Lucro/Dia</p>
          <p className={`text-xl font-bold ${periodStats.mediaLucroDia >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(periodStats.mediaLucroDia)}
          </p>
        </div>
      </div>

      {dailyData.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-500 mb-2">Nenhum dado diário encontrado</p>
          <p className="text-sm text-gray-400">Adicione transações para visualizar a análise diária</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dailyData.map(([date, data]) => (
            <div
              key={date}
              className="p-6 border-2 rounded-xl bg-gradient-to-r from-white to-gray-50 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-900 flex items-center">
                  📅 {date}
                  {data.lucroLiquido > 0 && <span className="ml-2 text-green-500">✅</span>}
                  {data.lucroLiquido < 0 && <span className="ml-2 text-red-500">❌</span>}
                  {data.lucroLiquido === 0 && <span className="ml-2 text-yellow-500">⚖️</span>}
                </h4>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{data.transacoes} transações</p>
                  <p className="text-xs text-gray-500">{data.materiaisCount} materiais</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                  <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-green-700 font-medium">💰 Vendas</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(data.vendas)}</p>
                  <p className="text-xs text-gray-500">{data.transacoesVenda} transações</p>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <TrendingDown className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-blue-700 font-medium">🛒 Compras</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(data.compras)}</p>
                  <p className="text-xs text-gray-500">{data.transacoesCompra} transações</p>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100">
                  <BarChart3 className="h-5 w-5 text-red-600 mx-auto mb-1" />
                  <p className="text-xs text-red-700 font-medium">💸 Despesas</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(data.despesas)}</p>
                  <p className="text-xs text-gray-500">{data.transacoesDespesa} lançamentos</p>
                </div>

                <div
                  className={`text-center p-4 rounded-lg border ${
                    data.lucroLiquido >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-orange-50 border-orange-100"
                  }`}
                >
                  <Target
                    className={`h-5 w-5 mx-auto mb-1 ${
                      data.lucroLiquido >= 0 ? "text-emerald-600" : "text-orange-600"
                    }`}
                  />
                  <p
                    className={`text-xs font-medium ${data.lucroLiquido >= 0 ? "text-emerald-700" : "text-orange-700"}`}
                  >
                    🎯 Lucro Líquido
                  </p>
                  <p className={`text-lg font-bold ${data.lucroLiquido >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
                    {formatCurrency(data.lucroLiquido)}
                  </p>
                  <p className="text-xs text-gray-500">Margem: {data.margem.toFixed(1)}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">💵 Ticket Médio</p>
                  <p className="font-semibold text-gray-800">{formatCurrency(data.ticketMedio)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">⚡ Eficiência</p>
                  <p className={`font-semibold ${data.eficiencia >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(data.eficiencia)}/transação
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">🏭 Diversificação</p>
                  <p className="font-semibold text-gray-800">{data.materiaisCount} materiais</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default DailyReport
