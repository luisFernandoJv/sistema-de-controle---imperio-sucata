"use client"

import { useState } from "react"
import { Edit, Trash2, Calendar, User, Package, DollarSign, AlertCircle } from "lucide-react"
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
    default: "px-4 py-2",
    sm: "px-3 py-1.5 text-xs",
    icon: "h-8 w-8",
  }

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
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

const TransactionsList = ({ onEdit }) => {
  const { transactions, loading: contextLoading, refreshData } = useData()
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const { toast } = useToast()

  const handleDelete = async (transaction) => {
    try {
      const { deleteTransaction } = await import("../lib/firebaseService")

      await deleteTransaction(transaction.id)
      console.log("[v0] Transação deletada - Cloud Functions atualizarão o estoque automaticamente")

      toast({
        title: "Transação excluída",
        description: "A transação foi removida e o estoque será atualizado automaticamente.",
        className: "bg-green-100 border-green-500 text-green-800",
      })
    } catch (error) {
      console.error("[v0] Erro ao deletar transação:", error)
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a transação. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setDeleteConfirm(null)
    }
  }

  const materials = {
    ferro: { label: "Ferro", color: "bg-gray-600" },
    aluminio: { label: "Alumínio", color: "bg-blue-600" },
    cobre: { label: "Cobre", color: "bg-orange-600" },
    latinha: { label: "Latinha", color: "bg-green-600" },
    panela: { label: "Panela", color: "bg-purple-600" },
    bloco2: { label: "Bloco 2°", color: "bg-red-600" },
    chapa: { label: "Chapa", color: "bg-yellow-600" },
    "perfil pintado": { label: "Perfil pintado", color: "bg-indigo-600" },
    "perfil natural": { label: "Perfil natural", color: "bg-indigo-600" },
    bloco: { label: "Bloco", color: "bg-pink-600" },
    metal: { label: "Metal", color: "bg-gray-700" },
    inox: { label: "Inox", color: "bg-blue-700" },
    bateria: { label: "Bateria", color: "bg-green-700" },
    motor_gel: { label: "Motor Gel", color: "bg-purple-700" },
    roda: { label: "Roda", color: "bg-black" },
    papelao: { label: "Papelão", color: "bg-yellow-700" },
    rad_metal: { label: "Rad. Metal", color: "bg-rose-600" },
    rad_cobre: { label: "Rad. Cobre", color: "bg-orange-700" },
    rad_chapa: { label: "Rad. Chapa", color: "bg-violet-600" },
    tela: { label: "Tela", color: "bg-lime-600" },
    antimonio: { label: "Antimônio", color: "bg-fuchsia-600" },
    cabo_ai: { label: "Cabo AI", color: "bg-sky-600" },
    tubo_limpo: { label: "Tubo Limpo", color: "bg-green-700" },
  }

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando transações...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Transações Recentes</h2>
        <Button onClick={refreshData} variant="outline" size="sm">
          Atualizar
        </Button>
      </div>

      {transactions.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma transação encontrada</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => {
            const material = materials[transaction.material] || { label: transaction.material, color: "bg-gray-500" }

            return (
              <Card key={transaction.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`w-3 h-3 rounded-full ${material.color}`}></div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.tipo === "compra" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                          }`}
                        >
                          {transaction.tipo === "compra" ? "Compra" : "Venda"}
                        </span>

                        <span className="font-medium text-gray-900">{material.label}</span>

                        {!transaction.synced && (
                          <AlertCircle className="h-4 w-4 text-yellow-500" title="Não sincronizado" />
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Package className="h-3 w-3 mr-1" />
                          {transaction.quantidade}kg
                        </div>

                        <div className="flex items-center">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {formatCurrency(transaction.precoUnitario)}/kg
                        </div>

                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(transaction.data)}
                        </div>

                        {transaction.vendedor && (
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {transaction.vendedor}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          transaction.tipo === "compra" ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {formatCurrency(transaction.valorTotal)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit && onEdit(transaction)}
                      title="Editar transação"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirm(transaction)}
                      title="Excluir transação"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {transaction.observacoes && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-sm text-gray-600">{transaction.observacoes}</p>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold">Confirmar Exclusão</h3>
            </div>

            <p className="text-gray-600 mb-4">
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita e o estoque será
              automaticamente ajustado.
            </p>

            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <div className="text-sm">
                <strong>{deleteConfirm.tipo === "compra" ? "Compra" : "Venda"}</strong> de{" "}
                <strong>{deleteConfirm.quantidade}kg</strong> de{" "}
                <strong>{materials[deleteConfirm.material]?.label || deleteConfirm.material}</strong>
                <br />
                Valor: <strong>{formatCurrency(deleteConfirm.valorTotal)}</strong>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setDeleteConfirm(null)}>
                Cancelar
              </Button>

              <Button variant="destructive" className="flex-1" onClick={() => handleDelete(deleteConfirm)}>
                Excluir
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default TransactionsList
