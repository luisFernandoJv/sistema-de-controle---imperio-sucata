"use client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Filter, RotateCcw, Search, Calendar, DollarSign } from "lucide-react"

const ReportFilters = ({ filters, setFilters }) => {
  const materials = [
    { value: "", label: "🔍 Todos os materiais" },
    { value: "ferro", label: "🔩 Ferro" },
    { value: "aluminio", label: "⚪ Alumínio" },
    { value: "cobre", label: "🟤 Cobre" },
    { value: "bronze", label: "🟤 Bronze" },
    { value: "latinha", label: "🥤 Latinha" },
    { value: "panela", label: "🍳 Panela" },
    { value: "bloco2", label: "🧱 Bloco 2°" },
    { value: "chapa", label: "📄 Chapa" },
    { value: "perfil pintado", label: "🎨 Perfil pintado" },
    { value: "bloco", label: "🧱 Bloco" },
    { value: "metal", label: "⚙️ Metal" },
    { value: "inox", label: "✨ Inox" },
    { value: "bateria", label: "🔋 Bateria" },
    { value: "motor_gel", label: "⚡ Motor Gel" },
    { value: "roda", label: "🛞 Roda" },
    { value: "papelao", label: "📦 Papelão" },
    { value: "rad_metal", label: "📡 Rad. Metal" },
    { value: "rad_cobre", label: "📡 Rad. Cobre" },
    { value: "rad_chapa", label: "📡 Rad. Chapa" },
    { value: "tela", label: "🖥️ Tela" },
    { value: "antimonio", label: "⚗️ Antimônio" },
    { value: "cabo_ai", label: "🔌 Cabo AI" },
    { value: "tubo_limpo", label: "🚿 Tubo Limpo" },
    { value: "despesa", label: "💸 Despesas" },
  ]

  const tipos = [
    { value: "", label: "📊 Todos os tipos" },
    { value: "compra", label: "🛒 Compras" },
    { value: "venda", label: "💰 Vendas" },
    { value: "despesa", label: "💸 Despesas" },
  ]

  const formasPagamento = [
    { value: "", label: "💳 Todas as formas" },
    { value: "dinheiro", label: "💵 Dinheiro" },
    { value: "pix", label: "📱 PIX" },
  ]

  const periodos = [
    { value: "todos", label: "📅 Todos os períodos" },
    { value: "hoje", label: "📅 Hoje" },
    { value: "semana", label: "📊 Esta semana" },
    { value: "mes", label: "📈 Este mês" },
    { value: "trimestre", label: "📋 Este trimestre" },
    { value: "ano", label: "🗓️ Este ano" },
  ]

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      material: "",
      tipo: "",
      formaPagamento: "",
      cliente: "",
      valorMin: "",
      valorMax: "",
      periodo: "todos",
    })
  }

  const applyPeriodFilter = (periodo) => {
    const today = new Date()
    let startDate = ""
    let endDate = ""

    switch (periodo) {
      case "hoje":
        startDate = today.toISOString().split("T")[0]
        endDate = today.toISOString().split("T")[0]
        break
      case "semana":
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()))
        startDate = weekStart.toISOString().split("T")[0]
        endDate = new Date().toISOString().split("T")[0]
        break
      case "mes":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        startDate = monthStart.toISOString().split("T")[0]
        endDate = monthEnd.toISOString().split("T")[0]
        break
      case "trimestre":
        const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
        startDate = quarterStart.toISOString().split("T")[0]
        endDate = new Date().toISOString().split("T")[0]
        break
      case "ano":
        const yearStart = new Date(today.getFullYear(), 0, 1)
        startDate = yearStart.toISOString().split("T")[0]
        endDate = new Date().toISOString().split("T")[0]
        break
      default:
        startDate = ""
        endDate = ""
    }

    setFilters((prev) => ({
      ...prev,
      periodo,
      startDate,
      endDate,
    }))
  }

  return (
    <Card className="p-4 sm:p-6 no-print shadow-lg border-2 border-blue-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <Filter className="h-6 w-6 mr-2 text-blue-600" />
          🎛️ Filtros Avançados do Relatório
        </h2>
        <Button
          onClick={clearFilters}
          variant="outline"
          size="sm"
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-blue-200 bg-transparent"
        >
          <RotateCcw className="h-4 w-4 mr-2" />🔄 Limpar Tudo
        </Button>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
          <Calendar className="h-4 w-4 mr-2" />⚡ Filtros Rápidos por Período
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {periodos.map((periodo) => (
            <Button
              key={periodo.value}
              onClick={() => applyPeriodFilter(periodo.value)}
              size="sm"
              variant={filters.periodo === periodo.value ? "default" : "outline"}
              className={`text-xs transition-all ${
                filters.periodo === periodo.value ? "bg-blue-600 text-white" : "hover:bg-blue-100 border-blue-300"
              }`}
            >
              {periodo.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {/* Filtros de Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label className="text-base font-medium flex items-center mb-2">
              <Calendar className="h-4 w-4 mr-2 text-gray-600" />📅 Data Inicial
            </Label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="text-base h-12 border-gray-300 focus:border-blue-500"
            />
          </div>

          <div>
            <Label className="text-base font-medium flex items-center mb-2">
              <Calendar className="h-4 w-4 mr-2 text-gray-600" />📅 Data Final
            </Label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="text-base h-12 border-gray-300 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Filtros de Categoria */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-base font-medium mb-2 block">🏭 Material</Label>
            <select
              value={filters.material}
              onChange={(e) => handleFilterChange("material", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-base h-12 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              {materials.map((material) => (
                <option key={material.value} value={material.value}>
                  {material.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-base font-medium mb-2 block">📊 Tipo de Transação</Label>
            <select
              value={filters.tipo}
              onChange={(e) => handleFilterChange("tipo", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-base h-12 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              {tipos.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-base font-medium mb-2 block">💳 Forma de Pagamento</Label>
            <select
              value={filters.formaPagamento || ""}
              onChange={(e) => handleFilterChange("formaPagamento", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-base h-12 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              {formasPagamento.map((forma) => (
                <option key={forma.value} value={forma.value}>
                  {forma.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div>
            <Label className="text-base font-medium flex items-center mb-2">
              <Search className="h-4 w-4 mr-2 text-green-600" />👤 Cliente/Fornecedor
            </Label>
            <Input
              type="text"
              placeholder="Digite o nome..."
              value={filters.cliente || ""}
              onChange={(e) => handleFilterChange("cliente", e.target.value)}
              className="text-base h-12 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
            />
          </div>

          <div>
            <Label className="text-base font-medium flex items-center mb-2">
              <DollarSign className="h-4 w-4 mr-2 text-green-600" />💰 Valor Mínimo (R$)
            </Label>
            <Input
              type="number"
              placeholder="0,00"
              step="0.01"
              min="0"
              value={filters.valorMin || ""}
              onChange={(e) => handleFilterChange("valorMin", e.target.value)}
              className="text-base h-12 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
            />
          </div>

          <div>
            <Label className="text-base font-medium flex items-center mb-2">
              <DollarSign className="h-4 w-4 mr-2 text-green-600" />💰 Valor Máximo (R$)
            </Label>
            <Input
              type="number"
              placeholder="999999,99"
              step="0.01"
              min="0"
              value={filters.valorMax || ""}
              onChange={(e) => handleFilterChange("valorMax", e.target.value)}
              className="text-base h-12 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <span className="text-sm font-medium text-yellow-800">🔍 Filtros Ativos:</span>
          {Object.entries(filters).map(([key, value]) => {
            if (value && value !== "todos" && value !== "") {
              const labels = {
                startDate: `📅 De: ${new Date(value).toLocaleDateString("pt-BR")}`,
                endDate: `📅 Até: ${new Date(value).toLocaleDateString("pt-BR")}`,
                material: `🏭 ${materials.find((m) => m.value === value)?.label || value}`,
                tipo: `📊 ${tipos.find((t) => t.value === value)?.label || value}`,
                formaPagamento: `💳 ${formasPagamento.find((f) => f.value === value)?.label || value}`,
                cliente: `👤 ${value}`,
                valorMin: `💰 Min: R$ ${value}`,
                valorMax: `💰 Max: R$ ${value}`,
                periodo: `⏰ ${periodos.find((p) => p.value === value)?.label || value}`,
              }

              return (
                <span
                  key={key}
                  className="inline-flex items-center px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full"
                >
                  {labels[key] || `${key}: ${value}`}
                </span>
              )
            }
            return null
          })}
          {Object.values(filters).every((v) => !v || v === "todos" || v === "") && (
            <span className="text-sm text-yellow-600 italic">Nenhum filtro aplicado</span>
          )}
        </div>
      </div>
    </Card>
  )
}

export default ReportFilters
