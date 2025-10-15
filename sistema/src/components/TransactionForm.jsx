"use client"

import { useState, useEffect } from "react"
import {
  Scale,
  Package,
  Save,
  Calculator,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Edit3,
  Trash2,
  Calendar,
  User,
  X,
} from "lucide-react"
import { DatePicker } from "./ui/date-picker"
import { useData } from "../contexts/DataContext"

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>{children}</div>
)

const Button = ({
  children,
  variant = "default",
  className = "",
  disabled = false,
  type = "button",
  onClick,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white hover:bg-gray-50",
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} px-4 py-2 ${className}`}
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

const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

const useToast = () => {
  const toast = ({ title, description, variant = "default", className = "" }) => {
    const toastEl = document.createElement("div")
    const bgColor =
      variant === "destructive"
        ? "bg-red-100 border-red-500 text-red-800"
        : className || "bg-blue-100 border-blue-500 text-blue-800"

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

// Hook personalizado para gerenciar nomes salvos
const useSavedNames = () => {
  const [savedNames, setSavedNames] = useState([])

  // Carregar nomes salvos do localStorage
  useEffect(() => {
    const loadSavedNames = () => {
      try {
        const saved = localStorage.getItem('recycling_saved_names')
        if (saved) {
          const names = JSON.parse(saved)
          setSavedNames(names)
        }
      } catch (error) {
        console.error('Erro ao carregar nomes salvos:', error)
      }
    }

    loadSavedNames()
  }, [])

  // Salvar novo nome
  const saveName = (name) => {
    if (!name || name.trim() === '') return

    const trimmedName = name.trim()
    setSavedNames(prev => {
      // Evitar duplicatas (case insensitive)
      const normalizedNames = prev.map(n => n.toLowerCase())
      if (normalizedNames.includes(trimmedName.toLowerCase())) {
        return prev
      }

      const newNames = [trimmedName, ...prev].slice(0, 20) // Limitar a 20 nomes
      try {
        localStorage.setItem('recycling_saved_names', JSON.stringify(newNames))
      } catch (error) {
        console.error('Erro ao salvar nomes:', error)
      }
      return newNames
    })
  }

  // Remover nome
  const removeName = (nameToRemove) => {
    setSavedNames(prev => {
      const newNames = prev.filter(name => name !== nameToRemove)
      try {
        localStorage.setItem('recycling_saved_names', JSON.stringify(newNames))
      } catch (error) {
        console.error('Erro ao remover nome:', error)
      }
      return newNames
    })
  }

  return {
    savedNames,
    saveName,
    removeName
  }
}

const TransactionForm = ({ onSuccess, initialType = "compra", editingTransaction = null, onCancelEdit = null }) => {
  const { addTransaction, editTransaction, deleteTransaction } = useData()
  const [formData, setFormData] = useState({
    tipo: initialType,
    material: "ferro",
    quantidade: "",
    precoUnitario: "",
    vendedor: "",
    observacoes: "",
    data: new Date(),
    formaPagamento: "dinheiro", // dinheiro ou pix
    numeroTransacao: "", // para PIX
  })

  const [inventory, setInventory] = useState({})
  const [valorTotal, setValorTotal] = useState(0)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showNameSuggestions, setShowNameSuggestions] = useState(false)
  
  const { toast } = useToast()
  const { savedNames, saveName, removeName } = useSavedNames()

  useEffect(() => {
    if (editingTransaction) {
      setIsEditing(true)
      setFormData({
        tipo: editingTransaction.tipo || editingTransaction.type,
        material: editingTransaction.material,
        quantidade: (editingTransaction.quantidade || editingTransaction.weight || "").toString(),
        precoUnitario: (editingTransaction.precoUnitario || editingTransaction.pricePerKg || "").toString(),
        vendedor: editingTransaction.vendedor || "",
        observacoes: editingTransaction.observacoes || "",
        data: editingTransaction.data ? new Date(editingTransaction.data) : new Date(),
        formaPagamento: editingTransaction.formaPagamento || "dinheiro",
        numeroTransacao: editingTransaction.numeroTransacao || "",
      })
    }
  }, [editingTransaction])

  const loadInventory = async () => {
    try {
      const { getInventory } = await import("../lib/firebaseService")
      const inventoryData = await getInventory()
      setInventory(inventoryData)
      return inventoryData
    } catch (error) {
      console.error("Erro ao carregar inventário do Firebase:", error)
      const inventoryData = JSON.parse(localStorage.getItem("recycling_inventory") || "{}")
      setInventory(inventoryData)
      return inventoryData
    }
  }

  const updatePrice = (type, material, inv) => {
    if (inv[material]) {
      const price = type === "compra" ? inv[material].precoCompra : inv[material].precoVenda
      setFormData((prev) => ({
        ...prev,
        precoUnitario: price.toString(),
      }))
    }
  }

  useEffect(() => {
    loadInventory().then((inv) => {
      updatePrice(formData.tipo, formData.material, inv)
    })
  }, [formData.tipo, formData.material])

  useEffect(() => {
    const quantidade = Number.parseFloat(formData.quantidade) || 0
    const preco = Number.parseFloat(formData.precoUnitario) || 0
    setValorTotal(quantidade * preco)
  }, [formData.quantidade, formData.precoUnitario])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Mostrar sugestões quando o campo vendedor for focado ou quando começar a digitar
    if (field === 'vendedor') {
      if (value.length > 0) {
        setShowNameSuggestions(true)
      } else {
        setShowNameSuggestions(false)
      }
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (onCancelEdit) {
      onCancelEdit()
    }
    resetForm()
  }

  const handleDeleteTransaction = async () => {
    if (!editingTransaction?.id) return

    try {
      setSaving(true)
      await deleteTransaction(editingTransaction.id)

      toast({
        title: "✅ Transação Excluída!",
        description: "A transação foi removida com sucesso.",
        className: "bg-green-100 border-green-500 text-green-800",
      })

      setShowDeleteConfirm(false)
      if (onCancelEdit) {
        onCancelEdit()
      }
      resetForm()
    } catch (error) {
      console.error("[v0] Erro ao excluir transação:", error)
      toast({
        title: "❌ Erro ao Excluir",
        description: "Não foi possível excluir a transação. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      tipo: "compra",
      material: "ferro",
      quantidade: "",
      precoUnitario: "",
      vendedor: "",
      observacoes: "",
      data: new Date(),
      formaPagamento: "dinheiro",
      numeroTransacao: "",
    })
    setIsEditing(false)
    setShowNameSuggestions(false)
    loadInventory().then((inv) => {
      updatePrice("compra", "ferro", inv)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    console.log("[v0] Form submit triggered", { formData, isEditing })

    if (!formData.quantidade || !formData.precoUnitario) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, preencha os campos de quantidade e preço por kg.",
        variant: "destructive",
      })
      return
    }

    if (!formData.data) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, selecione uma data para a transação.",
        variant: "destructive",
      })
      return
    }

    const quantidade = Number.parseFloat(formData.quantidade)
    const precoUnitario = Number.parseFloat(formData.precoUnitario)

    if (quantidade <= 0 || precoUnitario <= 0) {
      toast({
        title: "Erro de Validação",
        description: "Quantidade e preço devem ser maiores que zero.",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      const transactionDate = formData.data instanceof Date ? formData.data : new Date(formData.data)

      // Garantir que a data tenha hora, minuto e segundo zerados para consistência
      transactionDate.setHours(12, 0, 0, 0)

      const transaction = {
        ...formData,
        quantidade,
        precoUnitario,
        valorTotal,
        data: transactionDate,
      }

      console.log("[v0] Submitting transaction with date:", transactionDate.toISOString())

      // Salvar o nome do vendedor/cliente se não estiver vazio
      if (formData.vendedor && formData.vendedor.trim() !== '') {
        saveName(formData.vendedor.trim())
      }

      if (isEditing && editingTransaction?.id) {
        await editTransaction(editingTransaction.id, transaction)

        toast({
          title: "✅ Transação Atualizada!",
          description:
            "As alterações foram salvas. O estoque e relatórios serão sincronizados automaticamente pelas Cloud Functions.",
          className: "bg-green-100 border-green-500 text-green-800",
        })

        if (onCancelEdit) {
          onCancelEdit()
        }
      } else {
        await addTransaction(transaction)

        toast({
          title: "✅ Sucesso!",
          description: `${formData.tipo === "compra" ? "Compra" : formData.tipo === "venda" ? "Venda" : "Despesa"} registrada! O estoque e relatórios serão atualizados automaticamente.`,
          className: "bg-green-100 border-green-500 text-green-800",
        })
      }

      await loadInventory()

      if (!isEditing) {
        setFormData((prev) => ({
          ...prev,
          quantidade: "",
          precoUnitario: "",
          vendedor: "",
          observacoes: "",
          data: new Date(),
          formaPagamento: "dinheiro",
          numeroTransacao: "",
        }))

        const inventoryData = await loadInventory()
        updatePrice(formData.tipo, formData.material, inventoryData)
      } else {
        resetForm()
      }
    } catch (error) {
      console.error("[v0] Erro ao salvar:", error)
      toast({
        title: "❌ Erro ao Salvar",
        description: "Verifique sua conexão e tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
      setShowNameSuggestions(false)
    }
  }

  const handleSaveAndContinue = async (e) => {
    e.preventDefault()

    // Salvar transação atual
    await handleSubmit(e)

    // Manter tipo e data, limpar apenas quantidade, preço e observações
    setFormData((prev) => ({
      ...prev,
      quantidade: "",
      precoUnitario: "",
      observacoes: "",
      vendedor: "",
      numeroTransacao: "",
      // Manter: tipo, material, data, formaPagamento
    }))

    // Focar no campo quantidade
    setTimeout(() => {
      document.getElementById("quantidade")?.focus()
    }, 100)
  }

  // Selecionar nome das sugestões
  const handleSelectName = (name) => {
    setFormData(prev => ({ ...prev, vendedor: name }))
    setShowNameSuggestions(false)
  }

  // Filtrar sugestões baseadas no texto digitado
  const filteredSuggestions = savedNames.filter(name =>
    name.toLowerCase().includes(formData.vendedor.toLowerCase())
  ).slice(0, 5) // Mostrar apenas 5 sugestões

  const materials = [
    { value: "ferro", label: "Ferro", color: "bg-gray-600" },
    { value: "aluminio", label: "Alumínio", color: "bg-blue-600" },
    { value: "cobre", label: "Cobre", color: "bg-orange-600" },
    { value: "latinha", label: "Latinha", color: "bg-green-600" },
    { value: "panela", label: "Panela", color: "bg-purple-600" },
    { value: "bloco2", label: "Bloco 2°", color: "bg-red-600" },
    { value: "chapa", label: "Chapa", color: "bg-yellow-600" },
    { value: "perfil pintado", label: "Perfil pintado", color: "bg-indigo-600" },
    { value: "perfil natural", label: "Perfil natural", color: "bg-indigo-600" },
    { value: "bloco", label: "Bloco", color: "bg-pink-600" },
    { value: "metal", label: "Metal", color: "bg-gray-700" },
    { value: "inox", label: "Inox", color: "bg-blue-700" },
    { value: "bateria", label: "Bateria", color: "bg-green-700" },
    { value: "motor_gel", label: "Motor Gel", color: "bg-purple-700" },
    { value: "roda", label: "Roda", color: "bg-black" },
    { value: "papelao", label: "Papelão", color: "bg-yellow-700" },
    { value: "rad_metal", label: "Rad. Metal", color: "bg-rose-600" },
    { value: "rad_cobre", label: "Rad. Cobre", color: "bg-orange-700" },
    { value: "rad_chapa", label: "Rad. Chapa", color: "bg-violet-600" },
    { value: "tela", label: "Tela", color: "bg-lime-600" },
    { value: "antimonio", label: "Antimônio", color: "bg-fuchsia-600" },
    { value: "cabo_ai", label: "Cabo AI", color: "bg-sky-600" },
    { value: "tubo_limpo", label: "Tubo Limpo", color: "bg-green-700" },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          {isEditing ? "✏️ Editar Transação" : "➕ Nova Transação"}
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          {isEditing
            ? "Modifique os dados da transação selecionada"
            : "Registre compras e vendas de materiais recicláveis"}
        </p>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🗑️ Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleDeleteTransaction}
                disabled={saving}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {saving ? "Excluindo..." : "Sim, Excluir"}
              </Button>
              <Button onClick={() => setShowDeleteConfirm(false)} variant="outline" className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seções anteriores permanecem iguais */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Scale className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-600" />
            1. Tipo de Transação
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Button
              type="button"
              variant={formData.tipo === "compra" ? "default" : "outline"}
              onClick={() => handleInputChange("tipo", "compra")}
              className="h-20 sm:h-24 flex-col space-y-1 sm:space-y-2 transition-all duration-300"
            >
              <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="text-base sm:text-lg font-semibold">Compra</span>
              <span className="text-xs sm:text-sm opacity-75">Entrada de material</span>
            </Button>

            <Button
              type="button"
              variant={formData.tipo === "venda" ? "default" : "outline"}
              onClick={() => handleInputChange("tipo", "venda")}
              className="h-20 sm:h-24 flex-col space-y-1 sm:space-y-2 transition-all duration-300"
            >
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="text-base sm:text-lg font-semibold">Venda</span>
              <span className="text-xs sm:text-sm opacity-75">Saída de material</span>
            </Button>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-purple-600" />
            2. Data da Transação
          </h2>

          <div className="max-w-xs">
            <Label htmlFor="data" className="text-base sm:text-lg font-medium mb-2 block">
              📅 Selecionar Data
            </Label>
            <DatePicker
              selected={formData.data}
              onSelect={(date) => {
                console.log("[v0] Date selected:", date)
                handleInputChange("data", date)
              }}
              placeholder="Escolher data"
              className="w-full"
            />
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Calculator className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-green-600" />
            3. Forma de Pagamento
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
            <Button
              type="button"
              variant={formData.formaPagamento === "dinheiro" ? "default" : "outline"}
              onClick={() => {
                handleInputChange("formaPagamento", "dinheiro")
                handleInputChange("numeroTransacao", "")
              }}
              className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 transition-all duration-300"
            >
              <span className="text-2xl">💵</span>
              <span className="text-base sm:text-lg font-semibold">Dinheiro</span>
            </Button>

            <Button
              type="button"
              variant={formData.formaPagamento === "pix" ? "default" : "outline"}
              onClick={() => handleInputChange("formaPagamento", "pix")}
              className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 transition-all duration-300"
            >
              <span className="text-2xl">📱</span>
              <span className="text-base sm:text-lg font-semibold">PIX</span>
            </Button>
          </div>

          {formData.formaPagamento === "pix" && (
            <div className="space-y-2">
              <Label htmlFor="numeroTransacao" className="text-base font-medium">
                🔢 Número da Transação PIX (Opcional)
              </Label>
              <Input
                id="numeroTransacao"
                type="text"
                value={formData.numeroTransacao}
                onChange={(e) => handleInputChange("numeroTransacao", e.target.value)}
                className="text-base h-12"
                placeholder="Ex: E12345678901234567890123456789012345"
              />
              <p className="text-xs text-gray-500">💡 Dica: Você pode encontrar este número no comprovante do PIX</p>
            </div>
          )}
        </Card>

        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-green-600" />
            4. Detalhes do Material
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="material" className="text-base sm:text-lg font-medium">
                Material
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                {materials.map((material) => (
                  <Button
                    key={material.value}
                    type="button"
                    variant={formData.material === material.value ? "default" : "outline"}
                    onClick={() => handleInputChange("material", material.value)}
                    className={`h-10 sm:h-12 text-xs sm:text-sm transition-all duration-300 ${
                      formData.material === material.value ? `${material.color} text-white` : ""
                    }`}
                  >
                    {material.label}
                  </Button>
                ))}
              </div>
              {inventory[formData.material] && (
                <p className="text-xs sm:text-sm text-gray-600 mt-2 p-2 bg-blue-50 rounded">
                  📦 Estoque atual:{" "}
                  <span className="font-semibold">{inventory[formData.material].quantidade.toFixed(2)}kg</span>
                </p>
              )}
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="quantidade" className="text-base sm:text-lg font-medium">
                  Quantidade (kg)
                </Label>
                <Input
                  id="quantidade"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.quantidade}
                  onChange={(e) => handleInputChange("quantidade", e.target.value)}
                  className="text-base sm:text-lg h-12 sm:h-14"
                  placeholder="Ex: 10.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="precoUnitario" className="text-base sm:text-lg font-medium">
                  Preço por kg (R$)
                </Label>
                <Input
                  id="precoUnitario"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precoUnitario}
                  onChange={(e) => handleInputChange("precoUnitario", e.target.value)}
                  className="text-base sm:text-lg h-12 sm:h-14"
                  placeholder="Ex: 2.50"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6">
            <div className="space-y-2 relative">
              <Label htmlFor="vendedor" className="text-base sm:text-lg font-medium">
                {formData.tipo === "compra" ? "Vendedor" : "Cliente"} (Opcional)
              </Label>
              <div className="relative">
                <Input
                  id="vendedor"
                  type="text"
                  value={formData.vendedor}
                  onChange={(e) => handleInputChange("vendedor", e.target.value)}
                  onFocus={() => formData.vendedor && setShowNameSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowNameSuggestions(false), 200)}
                  className="text-base sm:text-lg h-12 sm:h-14 pr-10"
                  placeholder={formData.tipo === "compra" ? "Nome do vendedor" : "Nome do cliente"}
                />
                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>

              {/* Sugestões de nomes */}
              {showNameSuggestions && savedNames.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-y-auto">
                  <div className="p-2 border-b border-gray-100 bg-gray-50">
                    <p className="text-xs font-medium text-gray-600 flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      Nomes salvos ({savedNames.length})
                    </p>
                  </div>
                  {filteredSuggestions.map((name, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onMouseDown={() => handleSelectName(name)}
                    >
                      <span className="text-sm font-medium text-gray-700">{name}</span>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          removeName(name)
                        }}
                        className="text-gray-400 hover:text-red-500 p-1 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {filteredSuggestions.length === 0 && formData.vendedor && (
                    <div className="p-3 text-center text-sm text-gray-500">
                      Nenhum nome encontrado
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes" className="text-base sm:text-lg font-medium">
                Observações (Opcional)
              </Label>
              <Input
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleInputChange("observacoes", e.target.value)}
                className="text-base sm:text-lg h-12 sm:h-14"
                placeholder="Detalhes adicionais"
              />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Calculator className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-purple-600" />
            5. Resumo da Transação
          </h2>

          <div className="bg-slate-100 p-4 sm:p-6 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Quantidade</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{formData.quantidade || "0.00"} kg</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Preço/kg</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(Number.parseFloat(formData.precoUnitario) || 0)}
                </p>
              </div>
              <div
                className={`p-3 sm:p-4 rounded-lg text-center ${formData.tipo === "venda" ? "bg-green-100" : "bg-red-100"}`}
              >
                <p className="text-xs sm:text-sm text-gray-600">Valor Total</p>
                <p
                  className={`text-2xl sm:text-3xl font-bold ${formData.tipo === "venda" ? "text-green-600" : "text-red-600"}`}
                >
                  {formatCurrency(valorTotal)}
                </p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Forma de Pagamento</p>
                <p className="text-lg sm:text-xl font-bold text-blue-600">
                  {formData.formaPagamento === "pix" ? "📱 PIX" : "💵 Dinheiro"}
                </p>
                {formData.formaPagamento === "pix" && formData.numeroTransacao && (
                  <p className="text-xs text-gray-500 mt-1 truncate">{formData.numeroTransacao.substring(0, 15)}...</p>
                )}
              </div>
            </div>

            {formData.tipo === "venda" && inventory[formData.material] && (
              <div className="border-t pt-4 mt-4 text-center">
                <p className="text-xs sm:text-sm text-gray-600">Margem de Lucro Estimada</p>
                <p className="text-lg sm:text-xl font-bold text-green-600">
                  {formatCurrency(
                    (Number.parseFloat(formData.precoUnitario) || 0) - inventory[formData.material].precoCompra,
                  )}{" "}
                  / kg
                </p>
              </div>
            )}
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {isEditing ? (
            <>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 h-14 sm:h-16 text-base sm:text-lg transition-transform hover:scale-105"
              >
                <Edit3 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                {saving ? "Salvando..." : "💾 Salvar Alterações"}
              </Button>

              <Button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 hover:bg-red-700 h-14 sm:h-16 text-base sm:text-lg sm:w-auto w-full"
              >
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                🗑️ Excluir
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                className="h-14 sm:h-16 bg-transparent sm:w-auto w-full text-base sm:text-lg"
              >
                <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />❌ Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 h-14 sm:h-16 text-base sm:text-lg transition-transform hover:scale-105"
              >
                <Save className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                {saving ? "Salvando..." : "💾 Salvar Transação"}
              </Button>

              <Button
                type="button"
                onClick={handleSaveAndContinue}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 h-14 sm:h-16 text-base sm:text-lg"
              >
                <Save className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />💾 Salvar e Continuar
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-14 sm:h-16 bg-transparent sm:w-auto w-full text-base sm:text-lg"
                onClick={resetForm}
              >
                <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />🔄 Limpar
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}

export default TransactionForm