"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, DollarSign, FileText, RotateCcw, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const ExpenseForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    nome: "",
    valor: "",
    categoria: "operacional",
    observacoes: "",
    data: new Date(),
    formaPagamento: "dinheiro",
    numeroTransacao: "",
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      nome: "",
      valor: "",
      categoria: "operacional",
      observacoes: "",
      data: new Date(),
      formaPagamento: "dinheiro",
      numeroTransacao: "",
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.nome || !formData.valor) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, preencha o nome da despesa e o valor.",
        variant: "destructive",
      })
      return
    }

    const valor = Number.parseFloat(formData.valor)
    if (valor <= 0) {
      toast({
        title: "Valor Inválido",
        description: "O valor da despesa deve ser maior que zero.",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      const transactionDate = formData.data instanceof Date ? formData.data : new Date(formData.data)
      transactionDate.setHours(12, 0, 0, 0)

      const expense = {
        ...formData,
        valor,
        data: transactionDate.toISOString(),
        tipo: "despesa",
        id: Date.now().toString(),
      }

      // Salvar no localStorage como uma "transação" especial
      const transactions = JSON.parse(localStorage.getItem("recycling_transactions") || "[]")
      transactions.push(expense)
      localStorage.setItem("recycling_transactions", JSON.stringify(transactions))

      // Tentar salvar no Firebase
      try {
        const { addTransaction } = await import("../lib/firebaseService")
        await addTransaction({
          tipo: "despesa",
          material: "despesa",
          quantidade: 1,
          precoUnitario: valor,
          valorTotal: valor,
          vendedor: formData.nome,
          observacoes: `${formData.categoria}: ${formData.observacoes}`,
          data: transactionDate, // Usar a data selecionada
          formaPagamento: formData.formaPagamento,
          numeroTransacao: formData.numeroTransacao,
        })
        console.log("[v0] Despesa salva no Firebase com data:", transactionDate.toISOString())
      } catch (firebaseError) {
        console.error("[v0] Erro ao salvar despesa no Firebase:", firebaseError)
      }

      toast({
        title: "Despesa Registrada!",
        description: `Despesa "${formData.nome}" de ${new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(valor)} foi registrada com sucesso.`,
        className: "bg-green-100 border-green-500 text-green-800",
      })

      resetForm()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("[v0] Erro ao registrar despesa:", error)
      toast({
        title: "Erro ao Registrar",
        description: "Não foi possível registrar a despesa. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const categorias = [
    { value: "operacional", label: "Operacional" },
    { value: "manutencao", label: "Manutenção" },
    { value: "combustivel", label: "Combustível" },
    { value: "energia", label: "Energia Elétrica" },
    { value: "agua", label: "Água" },
    { value: "telefone", label: "Telefone/Internet" },
    { value: "aluguel", label: "Aluguel" },
    { value: "funcionarios", label: "Funcionários" },
    { value: "impostos", label: "Impostos/Taxas" },
    { value: "equipamentos", label: "Equipamentos" },
    { value: "p_casa", label: "P/Casa" },
    { value: "devolucao", label: "Devolução" },
    { value: "refeicao", label: "Refeição" },
    { value: "outros", label: "Outros" },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Registrar Despesa</h1>
        <p className="text-sm sm:text-base text-gray-600">Controle os gastos do seu negócio</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-600" />
            Data da Despesa
          </h2>

          <div className="max-w-xs">
            <Label htmlFor="data" className="text-base font-medium">
              📅 Selecionar Data *
            </Label>
            <input
              type="date"
              id="data"
              value={formData.data.toISOString().split("T")[0]}
              onChange={(e) => handleInputChange("data", new Date(e.target.value))}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base h-12 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              required
            />
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-red-600" />
            Detalhes da Despesa
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-base font-medium">
                Nome da Despesa *
              </Label>
              <Input
                id="nome"
                type="text"
                value={formData.nome}
                onChange={(e) => handleInputChange("nome", e.target.value)}
                className="text-base h-12"
                placeholder="Ex: Conta de luz, Combustível, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor" className="text-base font-medium">
                Valor (R$) *
              </Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => handleInputChange("valor", e.target.value)}
                className="text-base h-12"
                placeholder="Ex: 150.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria" className="text-base font-medium">
                Categoria
              </Label>
              <select
                id="categoria"
                value={formData.categoria}
                onChange={(e) => handleInputChange("categoria", e.target.value)}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base h-12 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                {categorias.map((categoria) => (
                  <option key={categoria.value} value={categoria.value}>
                    {categoria.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes" className="text-base font-medium">
                Observações
              </Label>
              <Input
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleInputChange("observacoes", e.target.value)}
                className="text-base h-12"
                placeholder="Detalhes adicionais (opcional)"
              />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-green-600" />
            Forma de Pagamento
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
            <button
              type="button"
              onClick={() => {
                handleInputChange("formaPagamento", "dinheiro")
                handleInputChange("numeroTransacao", "")
              }}
              className={`h-16 sm:h-20 flex flex-col items-center justify-center space-y-1 sm:space-y-2 transition-all duration-300 rounded-md border-2 ${
                formData.formaPagamento === "dinheiro"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span className="text-2xl">💵</span>
              <span className="text-base sm:text-lg font-semibold">Dinheiro</span>
            </button>

            <button
              type="button"
              onClick={() => handleInputChange("formaPagamento", "pix")}
              className={`h-16 sm:h-20 flex flex-col items-center justify-center space-y-1 sm:space-y-2 transition-all duration-300 rounded-md border-2 ${
                formData.formaPagamento === "pix"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span className="text-2xl">📱</span>
              <span className="text-base sm:text-lg font-semibold">PIX</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleInputChange("formaPagamento", "emprestimo_divida")
                handleInputChange("numeroTransacao", "")
              }}
              className={`h-16 sm:h-20 flex flex-col items-center justify-center space-y-1 sm:space-y-2 transition-all duration-300 rounded-md border-2 ${
                formData.formaPagamento === "emprestimo_divida"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span className="text-2xl">📋</span>
              <span className="text-base sm:text-lg font-semibold">Empréstimo/Dívida</span>
            </button>
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

          {formData.formaPagamento === "emprestimo_divida" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">ℹ️ Informação:</span> Esta despesa será registrada como empréstimo ou
                dívida. O valor ficará pendente até a quitação.
              </p>
            </div>
          )}
        </Card>

        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-purple-600" />
            Resumo
          </h2>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Valor da Despesa</p>
              <p className="text-3xl font-bold text-red-600">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(Number.parseFloat(formData.valor) || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Categoria:{" "}
                <span className="font-medium">{categorias.find((c) => c.value === formData.categoria)?.label}</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Pagamento:{" "}
                <span className="font-medium">
                  {formData.formaPagamento === "pix"
                    ? "📱 PIX"
                    : formData.formaPagamento === "emprestimo_divida"
                      ? "📋 Empréstimo/Dívida"
                      : "💵 Dinheiro"}
                </span>
              </p>
              {formData.formaPagamento === "pix" && formData.numeroTransacao && (
                <p className="text-xs text-gray-400 mt-1">Transação: {formData.numeroTransacao.substring(0, 20)}...</p>
              )}
            </div>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            type="submit"
            disabled={saving}
            className="flex-1 bg-red-600 hover:bg-red-700 h-14 text-base transition-transform hover:scale-105"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? "Registrando..." : "Registrar Despesa"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-14 sm:w-auto w-full text-base bg-transparent"
            onClick={resetForm}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ExpenseForm
