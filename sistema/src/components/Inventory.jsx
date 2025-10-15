"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Package,
  Edit,
  Save,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Scale,
  RefreshCw,
  Wifi,
  WifiOff,
  Search,
  Grid,
  List,
  AlertTriangle,
  Sparkles,
  Printer,
  Download,
} from "lucide-react"
import { useData } from "../contexts/DataContext"
import { toast } from "react-toastify"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "../lib/firebase"
import { printInventory, exportInventoryToCSV } from "../utils/inventoryPrintUtils"

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-md border ${className}`}>{children}</div>
)

const Button = ({ children, onClick, disabled, variant = "default", size = "default", className = "", ...props }) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-blue-500",
  }
  const sizes = {
    default: "px-3 py-2 text-sm min-h-[40px]",
    sm: "px-2 py-1.5 text-xs min-h-[32px]",
    lg: "px-4 py-3 text-base min-h-[48px]",
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

const Input = ({ type = "text", value, onChange, placeholder, className = "", ...props }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full px-3 py-2 min-h-[40px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${className}`}
    {...props}
  />
)

const Label = ({ children, className = "", htmlFor }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}>
    {children}
  </label>
)

const Inventory = () => {
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [syncing, setSyncing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("todos")
  const [viewMode, setViewMode] = useState("grid")
  const [showLowStock, setShowLowStock] = useState(false)
  const [editingMinLevel, setEditingMinLevel] = useState(null)
  const [minLevelForm, setMinLevelForm] = useState({})

  const dataContext = useData()
  const {
    inventory = {},
    firebaseConnected = false,
    syncing: globalSyncing = false,
    lastSyncTime = null,
    updateInventory,
    refreshData,
  } = dataContext || {}

  const materials = [
    // Metais Ferrosos
    { key: "ferro", name: "Ferro", category: "ferrosos", color: "bg-gray-100", icon: "⚙️", minStock: 100 },
    { key: "chapa", name: "Chapa", category: "ferrosos", color: "bg-gray-200", icon: "🔲", minStock: 50 },
    {
      key: "perfil pintado",
      name: "Perfil pintado",
      category: "ferrosos",
      color: "bg-gray-300",
      icon: "📐",
      minStock: 30,
    },
    {
      key: "perfil natural",
      name: "Perfil natural",
      category: "ferrosos",
      color: "bg-gray-300",
      icon: "🪝",
      minStock: 30,
    },
    { key: "bloco", name: "Bloco", category: "ferrosos", color: "bg-gray-400", icon: "🧱", minStock: 20 },
    { key: "bloco2", name: "Bloco 2°", category: "ferrosos", color: "bg-gray-500", icon: "🔳", minStock: 15 },
    { key: "rad_chapa", name: "Rad. Chapa", category: "ferrosos", color: "bg-gray-600", icon: "🔧", minStock: 25 },

    // Metais Não-Ferrosos
    { key: "aluminio", name: "Alumínio", category: "nao-ferrosos", color: "bg-blue-100", icon: "🔧", minStock: 80 },
    { key: "cobre", name: "Cobre", category: "nao-ferrosos", color: "bg-orange-100", icon: "🔶", minStock: 50 },
    {
      key: "rad_cobre",
      name: "Rad. Cobre",
      category: "nao-ferrosos",
      color: "bg-orange-200",
      icon: "🔥",
      minStock: 30,
    },
    {
      key: "rad_metal",
      name: "Rad. Metal",
      category: "nao-ferrosos",
      color: "bg-orange-300",
      icon: "⚡",
      minStock: 35,
    },
    { key: "latinha", name: "Latinha", category: "nao-ferrosos", color: "bg-green-100", icon: "🥤", minStock: 200 },
    { key: "inox", name: "Inox", category: "nao-ferrosos", color: "bg-silver-100", icon: "✨", minStock: 30 },
    { key: "antimonio", name: "Antimônio", category: "nao-ferrosos", color: "bg-purple-100", icon: "💎", minStock: 10 },

    // Cabos e Fios
    { key: "cabo_ai", name: "Cabo AI", category: "cabos", color: "bg-yellow-100", icon: "🔌", minStock: 40 },
    { key: "tela", name: "Tela", category: "cabos", color: "bg-yellow-200", icon: "🕸️", minStock: 50 },

    // Tubos e Estruturas
    { key: "tubo_limpo", name: "Tubo Limpo", category: "tubos", color: "bg-cyan-100", icon: "🚰", minStock: 20 },

    // Outros Materiais
    { key: "panela", name: "Panela", category: "outros", color: "bg-yellow-300", icon: "🍳", minStock: 25 },
    { key: "metal", name: "Metal", category: "outros", color: "bg-purple-200", icon: "🔩", minStock: 60 },
    { key: "bateria", name: "Bateria", category: "eletronicos", color: "bg-red-100", icon: "🔋", minStock: 40 },
    { key: "motor_gel", name: "Motor Gel", category: "eletronicos", color: "bg-indigo-100", icon: "⚡", minStock: 10 },
    { key: "roda", name: "Roda", category: "automotivo", color: "bg-black-100", icon: "🛞", minStock: 15 },
    { key: "papelao", name: "Papelão", category: "papel", color: "bg-brown-100", icon: "📦", minStock: 100 },
  ]

  const categories = [
    { key: "todos", name: "Todos os Materiais", icon: "📋" },
    { key: "ferrosos", name: "Metais Ferrosos", icon: "⚙️" },
    { key: "nao-ferrosos", name: "Metais Não-Ferrosos", icon: "🔧" },
    { key: "cabos", name: "Cabos e Fios", icon: "🔌" },
    { key: "tubos", name: "Tubos e Estruturas", icon: "🚰" },
    { key: "eletronicos", name: "Eletrônicos", icon: "🔋" },
    { key: "automotivo", name: "Automotivo", icon: "🛞" },
    { key: "papel", name: "Papel", icon: "📦" },
    { key: "outros", name: "Outros", icon: "📦" },
  ]

  const handleSave = async () => {
    try {
      setSyncing(true)
      await updateInventory(editingItem, editForm)

      setEditingItem(null)
      setEditForm({})

      // Toast simples
      alert("Preços atualizados com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar:", error)
      alert("Erro ao salvar alterações")
    } finally {
      setSyncing(false)
    }
  }

  const handleEdit = (material) => {
    setEditingItem(material)
    setEditForm(inventory[material] || { quantidade: 0, precoCompra: 0, precoVenda: 0 })
  }

  const handleCancel = () => {
    setEditingItem(null)
    setEditForm({})
  }

  const handleEditMinLevel = (material, currentMinLevel) => {
    setEditingMinLevel(material)
    setMinLevelForm({ minLevel: currentMinLevel })
  }

  const handleSaveMinLevel = async () => {
    try {
      // Salvar nível mínimo no Firestore
      const materialRef = doc(db, "inventory_config", editingMinLevel)
      await updateDoc(materialRef, {
        minLevel: Number.parseFloat(minLevelForm.minLevel),
        updatedAt: new Date(),
      })

      toast({
        title: "Nível mínimo atualizado",
        description: `Nível mínimo de ${editingMinLevel} definido para ${minLevelForm.minLevel}kg`,
        className: "bg-green-100 border-green-500 text-green-800",
      })

      setEditingMinLevel(null)
    } catch (error) {
      console.error("Erro ao salvar nível mínimo:", error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar o nível mínimo",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0)
  }

  const calculateMargin = (precoCompra, precoVenda) => {
    if (!precoCompra || precoCompra === 0) return 0
    return ((precoVenda - precoCompra) / precoCompra) * 100
  }

  const calculateProfit = (quantidade, precoCompra, precoVenda) => {
    return quantidade * (precoVenda - precoCompra)
  }

  const calculateTotalValue = (quantidade, preco) => {
    return quantidade * preco
  }

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "todos" || material.category === selectedCategory
    const item = inventory[material.key] || { quantidade: 0 }
    const matchesLowStock = !showLowStock || item.quantidade <= material.minStock

    return matchesSearch && matchesCategory && matchesLowStock
  })

  const isLowStock = (material) => {
    const item = inventory[material.key] || { quantidade: 0 }
    return item.quantidade <= material.minStock
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
          >
            Controle de Estoque
          </motion.h1>
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg px-4">
            Gerencie seu estoque e preços de materiais recicláveis
          </p>

          <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
            {firebaseConnected ? (
              <div
                className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                role="status"
                aria-label="Status da conexão"
              >
                <Wifi className="h-4 w-4" aria-hidden="true" />
                <span>Conectado</span>
              </div>
            ) : (
              <div
                className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm"
                role="status"
                aria-label="Status da conexão"
              >
                <WifiOff className="h-4 w-4" aria-hidden="true" />
                <span>Modo offline</span>
              </div>
            )}

            {globalSyncing && (
              <div
                className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                role="status"
                aria-label="Status de sincronização"
              >
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Sincronizando...</span>
              </div>
            )}

            <Button
              onClick={refreshData}
              disabled={globalSyncing}
              variant="outline"
              size="sm"
              aria-label="Atualizar dados do estoque"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${globalSyncing ? "animate-spin" : ""}`} aria-hidden="true" />
              Atualizar
            </Button>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Ações de Estoque</h3>
            <div className="flex gap-2">
              <Button
                onClick={() => printInventory(inventory, materials)}
                variant="default"
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimir Estoque
              </Button>
              <Button
                onClick={() => exportInventoryToCSV(inventory, materials)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 lg:p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Categorias de materiais">
              {categories.map((category) => (
                <Button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  variant={selectedCategory === category.key ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2 text-xs sm:text-sm lg:text-base"
                  role="tab"
                  aria-selected={selectedCategory === category.key}
                  aria-controls="materials-grid"
                >
                  <span aria-hidden="true">{category.icon}</span>
                  <span className="hidden sm:inline">{category.name}</span>
                  <span className="sm:hidden">{category.name.split(" ")[0]}</span>
                </Button>
              ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <div className="relative flex-1 sm:flex-none">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"
                    aria-hidden="true"
                  />
                  <Input
                    placeholder="Buscar material..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                    aria-label="Buscar materiais"
                  />
                </div>

                <Button
                  onClick={() => setShowLowStock(!showLowStock)}
                  variant={showLowStock ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2 justify-center"
                  aria-pressed={showLowStock}
                  aria-label={showLowStock ? "Mostrar todos os materiais" : "Mostrar apenas estoque baixo"}
                >
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Estoque Baixo</span>
                  <span className="sm:hidden">Baixo</span>
                </Button>
              </div>

              <div className="flex gap-2 justify-center" role="radiogroup" aria-label="Modo de visualização">
                <Button
                  onClick={() => setViewMode("grid")}
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  role="radio"
                  aria-checked={viewMode === "grid"}
                  aria-label="Visualização em grade"
                >
                  <Grid className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  onClick={() => setViewMode("list")}
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  role="radio"
                  aria-checked={viewMode === "list"}
                  aria-label="Visualização em lista"
                >
                  <List className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <AnimatePresence>
          <div
            id="materials-grid"
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
                : "space-y-3 sm:space-y-4"
            }
            role="tabpanel"
            aria-labelledby="category-tabs"
          >
            {filteredMaterials.map((material, index) => {
              const item = inventory[material.key] || { quantidade: 0, precoCompra: 0, precoVenda: 0 }
              const isEditing = editingItem === material.key
              const margin = calculateMargin(item.precoCompra, item.precoVenda)
              const lowStock = isLowStock(material)

              return (
                <motion.div
                  key={material.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  layout
                >
                  <Card
                    className={`p-3 sm:p-4 lg:p-6 ${material.color} border-l-4 ${
                      lowStock ? "border-l-red-500 ring-2 ring-red-200 shadow-red-100" : "border-l-blue-500"
                    } hover:shadow-2xl transition-all duration-300 ${
                      viewMode === "list" ? "flex items-center" : ""
                    } relative overflow-hidden group`}
                    role="article"
                    aria-label={`Material: ${material.name}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {lowStock && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full p-2 shadow-lg z-10"
                        role="alert"
                        aria-label="Estoque baixo"
                      >
                        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                      </motion.div>
                    )}

                    <div
                      className={`relative z-10 ${viewMode === "list" ? "flex items-center justify-between w-full gap-4" : ""}`}
                    >
                      <div
                        className={`flex items-center justify-between mb-4 ${viewMode === "list" ? "mb-0 flex-1 min-w-0" : ""}`}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                          <motion.div
                            whileHover={{ scale: 1.2 }}
                            transition={{ duration: 0.3 }}
                            className="bg-gradient-to-br from-white to-slate-50 p-2 rounded-xl shadow-md flex-shrink-0"
                          >
                            <span className="text-xl sm:text-2xl" aria-hidden="true">
                              {material.icon}
                            </span>
                          </motion.div>
                          <div className="min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent truncate">
                              {material.name}
                            </h3>
                            {lowStock && (
                              <span className="text-xs text-red-600 font-bold flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Estoque Baixo!
                              </span>
                            )}
                          </div>
                        </div>
                        {!isEditing && (
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(material.key)}
                              className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-2 border-blue-200 hover:border-blue-300 shadow-md"
                              aria-label={`Editar preços do ${material.name}`}
                            >
                              <Edit className="h-4 w-4 mr-1 sm:mr-2 text-blue-600" aria-hidden="true" />
                              <span className="hidden sm:inline font-semibold text-blue-700">Editar</span>
                            </Button>
                          </motion.div>
                        )}
                      </div>

                      {viewMode === "grid" && (
                        <>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="mb-4 sm:mb-6 p-4 sm:p-5 bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-xl shadow-lg border-2 border-slate-200"
                          >
                            <div className="flex items-center justify-center">
                              <Scale
                                className="h-6 sm:h-8 w-6 sm:w-8 text-blue-600 mr-2 sm:mr-3 flex-shrink-0"
                                aria-hidden="true"
                              />
                              <div className="text-center min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-slate-600">Estoque Atual</p>
                                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent truncate">
                                  {item.quantidade.toFixed(2)} kg
                                </p>
                                <p className="text-xs text-slate-500 font-medium mt-1">Mín: {material.minStock} kg</p>
                              </div>
                            </div>
                          </motion.div>

                          {isEditing ? (
                            <div className="space-y-4">
                              {/* Modo de Edição com melhor acessibilidade */}
                              <div className="grid grid-cols-1 gap-4">
                                <div>
                                  <Label htmlFor={`compra-${material.key}`}>Preço de Compra (R$/kg)</Label>
                                  <Input
                                    id={`compra-${material.key}`}
                                    type="number"
                                    step="0.01"
                                    value={editForm.precoCompra || ""}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, precoCompra: Number.parseFloat(e.target.value) || 0 })
                                    }
                                    aria-describedby={`compra-help-${material.key}`}
                                  />
                                  <p id={`compra-help-${material.key}`} className="sr-only">
                                    Digite o preço de compra por quilograma
                                  </p>
                                </div>
                                <div>
                                  <Label htmlFor={`venda-${material.key}`}>Preço de Venda (R$/kg)</Label>
                                  <Input
                                    id={`venda-${material.key}`}
                                    type="number"
                                    step="0.01"
                                    value={editForm.precoVenda || ""}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, precoVenda: Number.parseFloat(e.target.value) || 0 })
                                    }
                                    aria-describedby={`venda-help-${material.key}`}
                                  />
                                  <p id={`venda-help-${material.key}`} className="sr-only">
                                    Digite o preço de venda por quilograma
                                  </p>
                                </div>
                                <div>
                                  <Label htmlFor={`minLevel-${material.key}`}>Nível Mínimo de Estoque (kg)</Label>
                                  <Input
                                    id={`minLevel-${material.key}`}
                                    type="number"
                                    step="0.1"
                                    value={editForm.minLevel || material.minStock}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, minLevel: Number.parseFloat(e.target.value) || 0 })
                                    }
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Você será notificado quando o estoque atingir este nível
                                  </p>
                                </div>
                              </div>

                              <div className="flex space-x-2">
                                <Button
                                  onClick={handleSave}
                                  disabled={syncing}
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                  aria-label={`Salvar alterações para ${material.name}`}
                                >
                                  <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                                  {syncing ? "Salvando..." : "Salvar"}
                                </Button>
                                <Button variant="outline" onClick={handleCancel} aria-label="Cancelar edição">
                                  <X className="h-4 w-4" aria-hidden="true" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 gap-4">
                                <motion.div
                                  whileHover={{ scale: 1.02, x: 4 }}
                                  className="bg-gradient-to-br from-red-50 via-white to-rose-50 p-3 sm:p-4 rounded-xl shadow-md border-2 border-red-100 hover:border-red-200 transition-all"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center min-w-0">
                                      <div className="bg-gradient-to-br from-red-500 to-red-600 p-2 rounded-lg shadow-md">
                                        <TrendingDown
                                          className="h-4 sm:h-5 w-4 sm:w-5 text-white flex-shrink-0"
                                          aria-hidden="true"
                                        />
                                      </div>
                                      <span className="text-sm font-bold text-red-700 ml-2">Compra</span>
                                    </div>
                                    <span className="text-base sm:text-lg font-bold text-red-600 truncate ml-2">
                                      {formatCurrency(item.precoCompra)}
                                    </span>
                                  </div>
                                </motion.div>

                                <motion.div
                                  whileHover={{ scale: 1.02, x: 4 }}
                                  className="bg-gradient-to-br from-green-50 via-white to-emerald-50 p-3 sm:p-4 rounded-xl shadow-md border-2 border-green-100 hover:border-green-200 transition-all"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center min-w-0">
                                      <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-lg shadow-md">
                                        <TrendingUp
                                          className="h-4 sm:h-5 w-4 sm:w-5 text-white flex-shrink-0"
                                          aria-hidden="true"
                                        />
                                      </div>
                                      <span className="text-sm font-bold text-green-700 ml-2">Venda</span>
                                    </div>
                                    <span className="text-base sm:text-lg font-bold text-green-600 truncate ml-2">
                                      {formatCurrency(item.precoVenda)}
                                    </span>
                                  </div>
                                </motion.div>
                              </div>

                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="bg-gradient-to-br from-purple-50 via-white to-violet-50 p-3 sm:p-4 rounded-xl shadow-md border-2 border-purple-100"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center min-w-0">
                                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg shadow-md">
                                      <DollarSign
                                        className="h-4 sm:h-5 w-4 sm:w-5 text-white flex-shrink-0"
                                        aria-hidden="true"
                                      />
                                    </div>
                                    <span className="text-sm font-bold text-purple-700 ml-2">Margem</span>
                                  </div>
                                  <div className="text-right">
                                    <span
                                      className={`text-base sm:text-lg font-bold ${margin >= 0 ? "text-green-600" : "text-red-600"}`}
                                    >
                                      {margin.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </motion.div>

                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 p-4 sm:p-5 rounded-xl shadow-xl border-2 border-blue-300"
                              >
                                <div className="text-center">
                                  <p className="text-sm font-bold text-white/90 mb-1 flex items-center justify-center gap-2">
                                    <Sparkles className="h-4 w-4" />
                                    Valor Total em Estoque
                                  </p>
                                  <p className="text-xl sm:text-2xl font-bold text-white truncate">
                                    {formatCurrency(item.quantidade * item.precoCompra)}
                                  </p>
                                </div>
                              </motion.div>
                            </div>
                          )}
                        </>
                      )}

                      {viewMode === "list" && (
                        <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm overflow-x-auto">
                          <div className="text-center flex-shrink-0">
                            <p className="text-gray-600">Estoque</p>
                            <p className="font-bold">{item.quantidade.toFixed(2)} kg</p>
                          </div>
                          <div className="text-center flex-shrink-0">
                            <p className="text-gray-600">Compra</p>
                            <p className="font-bold text-red-600">{formatCurrency(item.precoCompra)}</p>
                          </div>
                          <div className="text-center flex-shrink-0">
                            <p className="text-gray-600">Venda</p>
                            <p className="font-bold text-green-600">{formatCurrency(item.precoVenda)}</p>
                          </div>
                          <div className="text-center flex-shrink-0">
                            <p className="text-gray-600">Margem</p>
                            <p className={`font-bold ${margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {margin.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </AnimatePresence>

        <Card className="p-3 sm:p-4 lg:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 sm:h-6 w-5 sm:w-6 mr-2 text-blue-600 flex-shrink-0" aria-hidden="true" />
            <span>Resumo Geral do Estoque</span>
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Total em Estoque</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                {Object.values(inventory)
                  .reduce((total, item) => total + (item.quantidade || 0), 0)
                  .toFixed(2)}{" "}
                kg
              </p>
            </div>

            <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-600 mb-1">Valor Investido</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600 truncate">
                {formatCurrency(
                  Object.entries(inventory).reduce(
                    (total, [_, item]) => total + (item.quantidade || 0) * (item.precoCompra || 0),
                    0,
                  ),
                )}
              </p>
            </div>

            <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
              <p className="text-xs sm:text-sm text-green-600 mb-1">Valor Potencial</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">
                {formatCurrency(
                  Object.entries(inventory).reduce(
                    (total, [_, item]) =>
                      total + calculateProfit(item.quantidade || 0, item.precoCompra || 0, item.precoVenda || 0),
                    0,
                  ),
                )}
              </p>
            </div>

            <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
              <p className="text-xs sm:text-sm text-purple-600 mb-1">Lucro Potencial</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">
                {formatCurrency(
                  Object.entries(inventory).reduce(
                    (total, [_, item]) =>
                      total + calculateProfit(item.quantidade || 0, item.precoCompra || 0, item.precoVenda || 0),
                    0,
                  ),
                )}
              </p>
            </div>

            <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
              <p className="text-xs sm:text-sm text-red-600 mb-1">Estoque Baixo</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600">
                {materials.filter((material) => isLowStock(material)).length}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Inventory
