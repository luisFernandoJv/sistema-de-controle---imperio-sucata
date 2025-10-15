import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Receipt } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { formatCurrency, formatDate } from "../../utils/reportUtils"

export default function FinancialSummary({ summaryData, period }) {
  const { totalVendas, totalCompras, totalDespesas, totalLucro, dailyData } = summaryData

  const profitMargin = totalVendas > 0 ? ((totalLucro / totalVendas) * 100).toFixed(2) : 0
  const isProfitable = totalLucro >= 0

  // Prepare chart data
  const chartData = dailyData.map((day) => ({
    data: formatDate(day.date),
    Vendas: day.vendas,
    Compras: day.compras,
    Lucro: day.lucro,
  }))

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita de Vendas</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalVendas)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total de vendas no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo de Compras</CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalCompras)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total de compras no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <Receipt className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDespesas)}</div>
            <p className="text-xs text-muted-foreground mt-1">Despesas operacionais</p>
          </CardContent>
        </Card>

        <Card className={isProfitable ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isProfitable ? "Lucro" : "Prejuízo"}</CardTitle>
            {isProfitable ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isProfitable ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(totalLucro)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Margem: {profitMargin}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Financeira - {period}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="Vendas" fill="#16a34a" />
              <Bar dataKey="Compras" fill="#ea580c" />
              <Bar dataKey="Lucro" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
