"use client"

import { useState, useEffect } from "react"
import { Edit3, Trash2, Save, X, Plus, Filter, Download } from "lucide-react"
import { useData } from "../contexts/DataContext"

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>{children}</div>
)

const Button = ({
  children,
  variant = "default",
  size = "default",
  className = "",
  disabled = false,
  onClick,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white hover:bg-gray-50",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    ghost: "hover:bg-gray-100",
  }
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-xs",
    icon: "h-8 w-8",
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

const Input = ({ className = "", ...props }) => (
  <input
    className={`flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
)

const Label = ({ children, htmlFor, className = "" }) => (
  <label
    htmlFor={htmlFor}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
  >
    {children}
  </label>
)

const Select = ({ children, value, onValueChange, className = "" }) => {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={`flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </select>
  )
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("pt-BR")
}

const formatDateForInput = (dateString) => {
  const date = new Date(dateString)
  return date.toISOString().split("T")[0]
}

const useToast = () => {
  const toast = ({ title, description, variant = "default", className = "" }) => {
    const toastEl = document.createElement("div")
    const bgColor =
      variant === "destructive"
        ? "bg-red-100 border-red-500 text-red-800"
        : className || "bg-green-100 border-green-500 text-green-800"

    toastEl.innerHTML = `
      <div class="fixed top-4 right-4 z-50 p-4 rounded-lg border ${bgColor} shadow-lg max-w-sm">
        <div class="font-semibold">${title}</div>
        <div class="text-sm mt-1">${description}</div>
      </div>
    `

    document.body.appendChild(toastEl)
    setTimeout(() => {
      document.body.removeChild(toastEl)
    }, 4000)
  }

  return { toast }
}

const TransactionManager = () => {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useData()
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    material: "",
    tipo: "",
  })
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const { toast } = useToast()

  const materials = [
    "ferro",
    "aluminio",
    "cobre",
    "latinha",
    "panela",
    "bloco2",
    "chapa",
    "perfil pintado",
    "perfil natural",
    "bloco",
    "metal",
    "inox",
    "bateria",
    "motor_gel",
    "roda",
    "papelao",
    "rad_metal",
    "rad_cobre",
    "rad_chapa",
    "tela",
    "antimonio",
    "cabo_ai",
    "tubo_limpo",
  ]

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

    if (filters.material) {
      filtered = filtered.filter((t) => t.material === filters.material)
    }

    if (filters.tipo) {
      filtered = filtered.filter((t) => t.tipo === filters.tipo)
    }

    setFilteredTransactions(filtered.sort((a, b) => new Date(b.data) - new Date(a.data)))
  }, [transactions, filters])

  const handleEdit = (transaction) => {
    setEditingTransaction({
      ...transaction,
      data: formatDateForInput(transaction.data),
    })
  }

  const handleSaveEdit = async () => {
    if (!editingTransaction) return

    try {
      const updatedTransaction = {
        ...editingTransaction,
        quantidade: Number.parseFloat(editingTransaction.quantidade),
        precoUnitario: Number.parseFloat(editingTransaction.precoUnitario),
        valorTotal:
          Number.parseFloat(editingTransaction.quantidade) * Number.parseFloat(editingTransaction.precoUnitario),
        data: new Date(editingTransaction.data).toISOString(),
      }

      await updateTransaction(editingTransaction.id, updatedTransaction)
      setEditingTransaction(null)

      toast({
        title: "Transação Atualizada!",
        description: "As alterações foram salvas com sucesso.",
        className: "bg-green-100 border-green-500 text-green-800",
      })
    } catch (error) {
      toast({
        title: "Erro ao Atualizar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (transactionId) => {
    if (!confirm("Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      await deleteTransaction(transactionId)

      toast({
        title: "Transação Excluída!",
        description: "A transação foi removida com sucesso.",
        className: "bg-green-100 border-green-500 text-green-800",
      })
    } catch (error) {
      toast({
        title: "Erro ao Excluir",
        description: "Não foi possível excluir a transação.",
        variant: "destructive",
      })
    }
  }

  const handleAddTransaction = () => {
    setShowAddForm(true)
    setEditingTransaction({
      tipo: "compra",
      material: "ferro",
      quantidade: "",
      precoUnitario: "",
      vendedor: "",
      observacoes: "",
      data: new Date().toISOString().split("T")[0],
    })
  }

  const handleSaveNew = async () => {
    if (!editingTransaction) return

    if (!editingTransaction.quantidade || !editingTransaction.precoUnitario) {
      toast({
        title: "Campos Obrigatórios",
        description: "Preencha quantidade e preço por kg.",
        variant: "destructive",
      })
      return
    }

    try {
      const newTransaction = {
        ...editingTransaction,
        quantidade: Number.parseFloat(editingTransaction.quantidade),
        precoUnitario: Number.parseFloat(editingTransaction.precoUnitario),
        valorTotal:
          Number.parseFloat(editingTransaction.quantidade) * Number.parseFloat(editingTransaction.precoUnitario),
        data: new Date(editingTransaction.data).toISOString(),
      }

      await addTransaction(newTransaction)
      setEditingTransaction(null)
      setShowAddForm(false)

      toast({
        title: "Transação Adicionada!",
        description: "Nova transação registrada com sucesso.",
        className: "bg-green-100 border-green-500 text-green-800",
      })
    } catch (error) {
      toast({
        title: "Erro ao Adicionar",
        description: "Não foi possível salvar a transação.",
        variant: "destructive",
      })
    }
  }

  const exportToCSV = () => {
    const headers = [
      "Data",
      "Tipo",
      "Material",
      "Quantidade (kg)",
      "Preço/kg",
      "Total",
      "Vendedor/Cliente",
      "Observações",
    ]
    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map((t) =>
        [
          formatDate(t.data),
          t.tipo,
          t.material,
          t.quantidade,
          t.precoUnitario,
          t.valorTotal,
          t.vendedor || "",
          t.observacoes || "",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `transacoes_${new Date().toISOString().split("T")[0]}.csv`
    link.click()

    toast({
      title: "Exportação Concluída!",
      description: `${filteredTransactions.length} transações exportadas.`,
      className: "bg-green-100 border-green-500 text-green-800",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Transações</h1>
          <p className="text-gray-600">Edite, exclua e organize suas transações</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={handleAddTransaction}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filtros
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="startDate">Data Inicial</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="endDate">Data Final</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="materialFilter">Material</Label>
            <Select
              value={filters.material}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, material: value }))}
            >
              <option value="">Todos os materiais</option>
              {materials.map((material) => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="tipoFilter">Tipo</Label>
            <Select value={filters.tipo} onValueChange={(value) => setFilters((prev) => ({ ...prev, tipo: value }))}>
              <option value="">Todos os tipos</option>
              <option value="compra">Compra</option>
              <option value="venda">Venda</option>
              <option value="despesa">Despesa</option>
            </Select>
          </div>
        </div>
      </Card>

      {(editingTransaction || showAddForm) && (
        <Card className="p-6 border-blue-200 bg-blue-50">
          <h3 className="text-lg font-semibold mb-4">{showAddForm ? "Nova Transação" : "Editar Transação"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="editData">Data da Transação</Label>
              <Input
                id="editData"
                type="date"
                value={editingTransaction.data}
                onChange={(e) => setEditingTransaction((prev) => ({ ...prev, data: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editTipo">Tipo</Label>
              <Select
                value={editingTransaction.tipo}
                onValueChange={(value) => setEditingTransaction((prev) => ({ ...prev, tipo: value }))}
              >
                <option value="compra">Compra</option>
                <option value="venda">Venda</option>
                <option value="despesa">Despesa</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="editMaterial">Material</Label>
              <Select
                value={editingTransaction.material}
                onValueChange={(value) => setEditingTransaction((prev) => ({ ...prev, material: value }))}
              >
                {materials.map((material) => (
                  <option key={material} value={material}>
                    {material}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="editQuantidade">Quantidade (kg)</Label>
              <Input
                id="editQuantidade"
                type="number"
                step="0.01"
                value={editingTransaction.quantidade}
                onChange={(e) => setEditingTransaction((prev) => ({ ...prev, quantidade: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editPreco">Preço por kg (R$)</Label>
              <Input
                id="editPreco"
                type="number"
                step="0.01"
                value={editingTransaction.precoUnitario}
                onChange={(e) => setEditingTransaction((prev) => ({ ...prev, precoUnitario: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editVendedor">Vendedor/Cliente</Label>
              <Input
                id="editVendedor"
                value={editingTransaction.vendedor || ""}
                onChange={(e) => setEditingTransaction((prev) => ({ ...prev, vendedor: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <Label htmlFor="editObservacoes">Observações</Label>
              <Input
                id="editObservacoes"
                value={editingTransaction.observacoes || ""}
                onChange={(e) => setEditingTransaction((prev) => ({ ...prev, observacoes: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-between items-center mt-6">
            <div className="text-lg font-semibold">
              Total:{" "}
              {formatCurrency(
                (Number.parseFloat(editingTransaction.quantidade) || 0) *
                  (Number.parseFloat(editingTransaction.precoUnitario) || 0),
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingTransaction(null)
                  setShowAddForm(false)
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={showAddForm ? handleSaveNew : handleSaveEdit}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Transações ({filteredTransactions.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço/kg
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(transaction.data)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.tipo === "venda"
                          ? "bg-green-100 text-green-800"
                          : transaction.tipo === "compra"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {transaction.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.material}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.quantidade}kg</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(transaction.precoUnitario)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <span
                      className={
                        transaction.tipo === "venda"
                          ? "text-green-600"
                          : transaction.tipo === "compra"
                            ? "text-blue-600"
                            : "text-red-600"
                      }
                    >
                      {formatCurrency(transaction.valorTotal)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(transaction)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma transação encontrada com os filtros aplicados.</p>
          </div>
        )}
      </Card>
    </div>
  )
}

export default TransactionManager
