"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { formatCurrency, getMaterialName } from "../../utils/reportUtils"
import { useState } from "react"
import { ArrowUpDown } from "lucide-react"

const COLORS = ["#16a34a", "#2563eb", "#ea580c", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1"]

export default function MaterialAnalysis({ summaryData }) {
  const { materialStats } = summaryData
  const [sortConfig, setSortConfig] = useState({ key: "lucro", direction: "desc" })

  // Convert to array and sort
  const materialsArray = Object.entries(materialStats).map(([material, stats]) => ({
    material,
    nome: getMaterialName(material),
    ...stats,
  }))

  const sortedMaterials = [...materialsArray].sort((a, b) => {
    if (sortConfig.direction === "asc") {
      return a[sortConfig.key] - b[sortConfig.key]
    }
    return b[sortConfig.key] - a[sortConfig.key]
  })

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === "desc" ? "asc" : "desc",
    })
  }

  // Prepare pie chart data (top 8 materials by revenue)
  const pieData = sortedMaterials
    .sort((a, b) => b.vendas - a.vendas)
    .slice(0, 8)
    .map((item) => ({
      name: item.nome,
      value: item.vendas,
    }))

  return (
    <div className="space-y-6">
      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Contribuição por Material (Receita)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Detalhada por Material</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort("vendas")}>
                  <div className="flex items-center justify-end gap-1">
                    Total Vendido <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort("compras")}>
                  <div className="flex items-center justify-end gap-1">
                    Total Comprado <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort("lucro")}>
                  <div className="flex items-center justify-end gap-1">
                    Lucro <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort("margem")}>
                  <div className="flex items-center justify-end gap-1">
                    Margem <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Quantidade (kg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMaterials.map((item) => (
                <TableRow key={item.material}>
                  <TableCell className="font-medium">{item.nome}</TableCell>
                  <TableCell className="text-right text-green-600 font-semibold">
                    {formatCurrency(item.vendas)}
                  </TableCell>
                  <TableCell className="text-right text-orange-600">{formatCurrency(item.compras)}</TableCell>
                  <TableCell
                    className={`text-right font-semibold ${item.lucro >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatCurrency(item.lucro)}
                  </TableCell>
                  <TableCell className="text-right">{item.margem}%</TableCell>
                  <TableCell className="text-right">{item.quantidade.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
