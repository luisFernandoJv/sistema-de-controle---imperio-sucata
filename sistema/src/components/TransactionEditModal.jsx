"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Save } from "lucide-react"

const TransactionEditModal = ({ transaction, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    id: "",
    tipo: "",
    material: "",
    quantidade: "",
    precoUnitario: "",
    valorTotal: "",
    vendedor: "",
    observacoes: "",
    data: "",
    formaPagamento: "",
    numeroTransacao: "",
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (transaction) {
      setFormData({
        id: transaction.id || "",
        tipo: transaction.tipo || "",
        material: transaction.material || "",
        quantidade: transaction.quantidade?.toString() || "",
        precoUnitario: transaction.precoUnitario?.toString() || "",
        valorTotal: transaction.valorTotal?.toString() || "",
        vendedor: transaction.vendedor || "",
        observacoes: transaction.observacoes || "",
        data: transaction.data ? new Date(transaction.data).toISOString().slice(0, 16) : "",
        formaPagamento: transaction.formaPagamento || "dinheiro",
        numeroTransacao: transaction.numeroTransacao || "",
      })
    }
  }, [transaction])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (field === "quantidade" || field === "precoUnitario") {
      const quantidade =
        field === "quantidade" ? Number.parseFloat(value) || 0 : Number.parseFloat(formData.quantidade) || 0
      const precoUnitario =
        field === "precoUnitario" ? Number.parseFloat(value) || 0 : Number.parseFloat(formData.precoUnitario) || 0
      const valorTotal = quantidade * precoUnitario

      setFormData((prev) => ({ ...prev, valorTotal: valorTotal.toFixed(2) }))
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.tipo) newErrors.tipo = "Tipo é obrigatório"
    if (!formData.data) newErrors.data = "Data é obrigatória"

    if (formData.tipo !== "despesa") {
      if (!formData.material) newErrors.material = "Material é obrigatório"
      if (!formData.quantidade || Number.parseFloat(formData.quantidade) <= 0) {
        newErrors.quantidade = "Quantidade deve ser maior que zero"
      }
      if (!formData.precoUnitario || Number.parseFloat(formData.precoUnitario) <= 0) {
        newErrors.precoUnitario = "Preço deve ser maior que zero"
      }
    } else {
      if (!formData.valorTotal || Number.parseFloat(formData.valorTotal) <= 0) {
        newErrors.valorTotal = "Valor deve ser maior que zero"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validateForm()) return

    const updatedTransaction = {
      id: formData.id,
      tipo: formData.tipo,
      material: formData.material,
      quantidade: formData.quantidade ? Number.parseFloat(formData.quantidade) : null,
      precoUnitario: formData.precoUnitario ? Number.parseFloat(formData.precoUnitario) : null,
      valorTotal: Number.parseFloat(formData.valorTotal),
      vendedor: formData.vendedor,
      observacoes: formData.observacoes,
      data: new Date(formData.data).toISOString(),
      formaPagamento: formData.formaPagamento,
      numeroTransacao: formData.numeroTransacao,
    }

    onSave(updatedTransaction)
  }

  const materialOptions = [
    "Alumínio (Lata)",
    "Alumínio (Perfil)",
    "Cobre",
    "Ferro",
    "Aço",
    "Bronze",
    "Latão",
    "Chumbo",
    "Inox",
    "Radiador",
    "Motor Elétrico",
    "Bateria",
    "Sucata Eletrônica",
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Save className="h-6 w-6 mr-2 text-blue-600" />
              ✏️ Editar Transação
            </h2>
            <Button
              type="button"
              onClick={onCancel}
              variant="ghost"
              size="sm"
              className="hover:bg-gray-100 p-2 rounded-full"
              aria-label="Fechar modal"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">🏷️ Tipo de Transação *</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => handleInputChange("tipo", e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.tipo ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Selecione o tipo</option>
                  <option value="compra">🛒 Compra</option>
                  <option value="venda">💰 Venda</option>
                  <option value="despesa">💸 Despesa</option>
                </select>
                {errors.tipo && <p className="text-red-500 text-sm mt-1">{errors.tipo}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📅 Data e Hora *</label>
                <input
                  type="datetime-local"
                  value={formData.data}
                  onChange={(e) => handleInputChange("data", e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.data ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.data && <p className="text-red-500 text-sm mt-1">{errors.data}</p>}
              </div>
            </div>

            {formData.tipo !== "despesa" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🏭 Material *</label>
                  <select
                    value={formData.material}
                    onChange={(e) => handleInputChange("material", e.target.value)}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.material ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Selecione o material</option>
                    {materialOptions.map((material) => (
                      <option key={material} value={material}>
                        {material}
                      </option>
                    ))}
                  </select>
                  {errors.material && <p className="text-red-500 text-sm mt-1">{errors.material}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">⚖️ Quantidade (kg) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.quantidade}
                      onChange={(e) => handleInputChange("quantidade", e.target.value)}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.quantidade ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="0.00"
                    />
                    {errors.quantidade && <p className="text-red-500 text-sm mt-1">{errors.quantidade}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">💰 Preço por kg *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.precoUnitario}
                      onChange={(e) => handleInputChange("precoUnitario", e.target.value)}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.precoUnitario ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="0.00"
                    />
                    {errors.precoUnitario && <p className="text-red-500 text-sm mt-1">{errors.precoUnitario}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">💵 Valor Total</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.valorTotal}
                      readOnly
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </>
            )}

            {formData.tipo === "despesa" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">💵 Valor da Despesa *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valorTotal}
                  onChange={(e) => handleInputChange("valorTotal", e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.valorTotal ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0.00"
                />
                {errors.valorTotal && <p className="text-red-500 text-sm mt-1">{errors.valorTotal}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">👤 Pessoa/Vendedor</label>
              <input
                type="text"
                value={formData.vendedor}
                onChange={(e) => handleInputChange("vendedor", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Nome da pessoa (opcional)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">💳 Forma de Pagamento</label>
                <select
                  value={formData.formaPagamento}
                  onChange={(e) => handleInputChange("formaPagamento", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="dinheiro">💵 Dinheiro</option>
                  <option value="pix">📱 PIX</option>
                </select>
              </div>

              {formData.formaPagamento === "pix" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🔢 Número da Transação PIX</label>
                  <input
                    type="text"
                    value={formData.numeroTransacao}
                    onChange={(e) => handleInputChange("numeroTransacao", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Número da transação (opcional)"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">📝 Observações</label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => handleInputChange("observacoes", e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Observações adicionais (opcional)"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 font-semibold transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                disabled={Object.keys(errors).length > 0}
              >
                <Save className="h-5 w-5 mr-2" />💾 Salvar Alterações
              </Button>
              <Button
                type="button"
                onClick={onCancel}
                variant="outline"
                className="flex-1 py-3 px-6 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all duration-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                ❌ Cancelar
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}

export default TransactionEditModal
