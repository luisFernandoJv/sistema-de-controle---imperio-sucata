"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, TrendingDown, Package, Target, Award } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

const MaterialsReport = ({ transactions }) => {
  const [sortBy, setSortBy] = useState("lucro") // lucro, vendas, compras, margem
  const [sortDirection, setSortDirection] = useState("desc")

  const materialStats = useMemo(() => {
    const stats = {}

    transactions.forEach((t) => {
      if (t.tipo === "despesa") return // Excluindo despesas do relatório de materiais

      if (!stats[t.material]) {
        stats[t.material] = {
          vendas: 0,
          compras: 0,
          quantidadeVendida: 0,
          quantidadeComprada: 0,
          transacoesVenda: 0,
          transacoesCompra: 0,
          precoMedioVenda: 0,
          precoMedioCompra: 0,
        }
      }

      if (t.tipo === "venda") {
        stats[t.material].vendas += t.valorTotal
        stats[t.material].quantidadeVendida += t.quantidade
        stats[t.material].transacoesVenda++
      } else if (t.tipo === "compra") {
        stats[t.material].compras += t.valorTotal
        stats[t.material].quantidadeComprada += t.quantidade
        stats[t.material].transacoesCompra++
      }
    })

    Object.keys(stats).forEach((material) => {
      const data = stats[material]
      data.lucro = data.vendas - data.compras
      data.margem = data.vendas > 0 ? (data.lucro / data.vendas) * 100 : 0
      data.precoMedioVenda = data.quantidadeVendida > 0 ? data.vendas / data.quantidadeVendida : 0
      data.precoMedioCompra = data.quantidadeComprada > 0 ? data.compras / data.quantidadeComprada : 0
      data.giro = data.quantidadeVendida + data.quantidadeComprada
      data.roi = data.compras > 0 ? (data.lucro / data.compras) * 100 : 0
    })

    return stats
  }, [transactions])

  const sortedMaterials = useMemo(() => {
    return Object.entries(materialStats).sort((a, b) => {
      const aValue = a[1][sortBy]
      const bValue = b[1][sortBy]

      if (sortDirection === "desc") {
        return bValue - aValue
      } else {
        return aValue - bValue
      }
    })
  }, [materialStats, sortBy, sortDirection])

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc")
    } else {
      setSortBy(field)
      setSortDirection("desc")
    }
  }

  const overallStats = useMemo(() => {
    const materials = Object.values(materialStats)
    const totalVendas = materials.reduce((sum, m) => sum + m.vendas, 0)
    const totalCompras = materials.reduce((sum, m) => sum + m.compras, 0)
    const totalLucro = totalVendas - totalCompras

    return {
      totalMateriais: materials.length,
      totalVendas,
      totalCompras,
      totalLucro,
      margemGeral: totalVendas > 0 ? (totalLucro / totalVendas) * 100 : 0,
      materialMaisLucrativo:
        materials.length > 0
          ? Object.entries(materialStats).reduce(
              (max, [name, data]) => (data.lucro > max.lucro ? { name, ...data } : max),
              { name: "", lucro: Number.NEGATIVE_INFINITY },
            )
          : null,
    }
  }, [materialStats])

  return (
    <Card className="p-6 shadow-lg border-0 bg-white">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center mb-4 lg:mb-0">
          <BarChart3 className="h-6 w-6 mr-2 text-purple-600" />🏭 Análise Detalhada por Material
        </h3>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={sortBy === "lucro" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSort("lucro")}
            className="text-xs"
          >
            💰 Por Lucro
          </Button>
          <Button
            variant={sortBy === "vendas" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSort("vendas")}
            className="text-xs"
          >
            📈 Por Vendas
          </Button>
          <Button
            variant={sortBy === "margem" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSort("margem")}
            className="text-xs"
          >
            📊 Por Margem
          </Button>
          <Button
            variant={sortBy === "giro" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSort("giro")}
            className="text-xs"
          >
            🔄 Por Giro
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
        <div className="text-center">
          <Package className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Total de Materiais</p>
          <p className="text-xl font-bold text-purple-600">{overallStats.totalMateriais}</p>
        </div>
        <div className="text-center">
          <Target className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Margem Geral</p>
          <p className="text-xl font-bold text-green-600">{overallStats.margemGeral.toFixed(1)}%</p>
        </div>
        <div className="text-center">
          <Award className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Mais Lucrativo</p>
          <p className="text-sm font-bold text-yellow-600 capitalize">
            {overallStats.materialMaisLucrativo?.name || "N/A"}
          </p>
          <p className="text-xs text-gray-500">
            {overallStats.materialMaisLucrativo ? formatCurrency(overallStats.materialMaisLucrativo.lucro) : ""}
          </p>
        </div>
        <div className="text-center">
          <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Lucro Total</p>
          <p className={`text-xl font-bold ${overallStats.totalLucro >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(overallStats.totalLucro)}
          </p>
        </div>
      </div>

      {sortedMaterials.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-500 mb-2">Nenhum material encontrado</p>
          <p className="text-sm text-gray-400">Adicione transações de compra e venda para visualizar a análise</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedMaterials.map(([material, data]) => (
            <div
              key={material}
              className="p-6 border-2 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-900 capitalize flex items-center">🏭 {material}</h4>
                <div className="flex items-center gap-2">
                  {data.margem >= 30 && <span className="text-green-500 text-xl">🚀</span>}
                  {data.margem >= 15 && data.margem < 30 && <span className="text-yellow-500 text-xl">⚡</span>}
                  {data.margem < 15 && data.margem >= 0 && <span className="text-orange-500 text-xl">⚠️</span>}
                  {data.margem < 0 && <span className="text-red-500 text-xl">🔻</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-xs text-green-700 font-medium">💰 Lucro</p>
                  <p className={`text-lg font-bold ${data.lucro >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(data.lucro)}
                  </p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-700 font-medium">📊 Margem</p>
                  <p className={`text-lg font-bold ${data.margem >= 0 ? "text-blue-600" : "text-red-600"}`}>
                    {data.margem.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-2 bg-green-25 rounded">
                  <span className="text-gray-600 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                    Vendas:
                  </span>
                  <span className="font-semibold text-green-600">{formatCurrency(data.vendas)}</span>
                </div>

                <div className="flex justify-between items-center p-2 bg-blue-25 rounded">
                  <span className="text-gray-600 flex items-center">
                    <TrendingDown className="h-4 w-4 mr-1 text-blue-600" />
                    Compras:
                  </span>
                  <span className="font-semibold text-blue-600">{formatCurrency(data.compras)}</span>
                </div>

                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">⚖️ Kg Vendidos:</span>
                    <span className="font-medium">{data.quantidadeVendida.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">⚖️ Kg Comprados:</span>
                    <span className="font-medium">{data.quantidadeComprada.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">💵 Preço Médio Venda:</span>
                    <span className="font-medium">{formatCurrency(data.precoMedioVenda)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">💵 Preço Médio Compra:</span>
                    <span className="font-medium">{formatCurrency(data.precoMedioCompra)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-500">🎯 ROI:</span>
                    <span className={`font-semibold ${data.roi >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {data.roi.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">📊 Transações:</span>
                    <span className="font-medium">
                      {data.transacoesVenda + data.transacoesCompra}
                      <span className="text-gray-400 ml-1">
                        ({data.transacoesVenda}V/{data.transacoesCompra}C)
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default MaterialsReport
