"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Search, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Edit3, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

const TransactionsReport = ({ transactions, onEditTransaction, onDeleteTransaction }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState("data")
  const [sortDirection, setSortDirection] = useState("desc")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const filteredAndSortedTransactions = useMemo(() => {
    const filtered = transactions.filter(
      (t) =>
        t.material?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.vendedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tipo?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      if (sortField === "data") {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [transactions, searchTerm, sortField, sortDirection])

  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTransactions = filteredAndSortedTransactions.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const pageStats = useMemo(() => {
    const vendas = paginatedTransactions.filter((t) => t.tipo === "venda")
    const compras = paginatedTransactions.filter((t) => t.tipo === "compra")
    const despesas = paginatedTransactions.filter((t) => t.tipo === "despesa")

    return {
      totalVendas: vendas.reduce((sum, t) => sum + t.valorTotal, 0),
      totalCompras: compras.reduce((sum, t) => sum + t.valorTotal, 0),
      totalDespesas: despesas.reduce((sum, t) => sum + t.valorTotal, 0),
      countVendas: vendas.length,
      countCompras: compras.length,
      countDespesas: despesas.length,
    }
  }, [paginatedTransactions])

  const handleDeleteTransaction = async (transactionId) => {
    try {
      setDeleting(true)
      await onDeleteTransaction(transactionId)
      setShowDeleteConfirm(null)
    } catch (error) {
      console.error("[v0] Erro ao excluir transação:", error)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Trash2 className="h-5 w-5 mr-2 text-red-600" />
                🗑️ Confirmar Exclusão
              </h3>
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>Transação:</strong> {showDeleteConfirm.tipo} - {showDeleteConfirm.material || "Despesa"}
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Valor:</strong> R$ {showDeleteConfirm.valorTotal?.toFixed(2)}
                </p>
                <p className="text-gray-700">
                  <strong>Data:</strong> {new Date(showDeleteConfirm.data).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <p className="text-gray-600 mb-6">
                ⚠️ <strong>Atenção:</strong> Esta ação não pode ser desfeita e afetará automaticamente o estoque e
                relatórios.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => handleDeleteTransaction(showDeleteConfirm.id)}
                  disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 font-semibold transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>🔄
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      🗑️ Sim, Excluir
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(null)}
                  variant="outline"
                  className="flex-1 py-3 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all duration-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
                  disabled={deleting}
                >
                  ❌ Cancelar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card className="p-4 sm:p-6 shadow-lg border-0 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center mb-4 lg:mb-0">
            <FileText className="h-6 w-6 mr-2 text-blue-600" />📋 Histórico Detalhado de Transações
          </h3>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por material, vendedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
              />
            </div>

            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            >
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600">Vendas na Página</p>
            <p className="text-sm sm:text-lg font-bold text-green-600">{formatCurrency(pageStats.totalVendas)}</p>
            <p className="text-xs text-gray-500">({pageStats.countVendas} transações)</p>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600">Compras na Página</p>
            <p className="text-sm sm:text-lg font-bold text-blue-600">{formatCurrency(pageStats.totalCompras)}</p>
            <p className="text-xs text-gray-500">({pageStats.countCompras} transações)</p>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600">Despesas na Página</p>
            <p className="text-sm sm:text-lg font-bold text-red-600">{formatCurrency(pageStats.totalDespesas)}</p>
            <p className="text-xs text-gray-500">({pageStats.countDespesas} transações)</p>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600">Resultado Página</p>
            <p
              className={`text-sm sm:text-lg font-bold ${(pageStats.totalVendas - pageStats.totalCompras - pageStats.totalDespesas) >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(pageStats.totalVendas - pageStats.totalCompras - pageStats.totalDespesas)}
            </p>
          </div>
        </div>

        {filteredAndSortedTransactions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg text-gray-500 mb-2">Nenhuma transação encontrada</p>
            <p className="text-sm text-gray-400">
              {searchTerm ? "Tente ajustar os filtros de busca" : "Adicione transações para visualizar o histórico"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th
                      className="p-3 sm:p-4 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors min-w-[120px]"
                      onClick={() => handleSort("data")}
                    >
                      <div className="flex items-center">
                        📅 Data/Hora
                        {sortField === "data" &&
                          (sortDirection === "asc" ? (
                            <TrendingUp className="h-4 w-4 ml-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 ml-1" />
                          ))}
                      </div>
                    </th>
                    <th className="p-3 sm:p-4 text-left font-semibold text-gray-700 min-w-[80px]">🏷️ Tipo</th>
                    <th
                      className="p-3 sm:p-4 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors min-w-[120px]"
                      onClick={() => handleSort("material")}
                    >
                      <div className="flex items-center">
                        🏭 Material
                        {sortField === "material" &&
                          (sortDirection === "asc" ? (
                            <TrendingUp className="h-4 w-4 ml-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 ml-1" />
                          ))}
                      </div>
                    </th>
                    <th className="p-3 sm:p-4 text-right font-semibold text-gray-700 min-w-[90px]">⚖️ Qtd</th>
                    <th
                      className="p-3 sm:p-4 text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors min-w-[90px]"
                      onClick={() => handleSort("precoUnitario")}
                    >
                      <div className="flex items-center justify-end">
                        💰 Preço/kg
                        {sortField === "precoUnitario" &&
                          (sortDirection === "asc" ? (
                            <TrendingUp className="h-4 w-4 ml-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 ml-1" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="p-3 sm:p-4 text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors min-w-[100px]"
                      onClick={() => handleSort("valorTotal")}
                    >
                      <div className="flex items-center justify-end">
                        💵 Total
                        {sortField === "valorTotal" &&
                          (sortDirection === "asc" ? (
                            <TrendingUp className="h-4 w-4 ml-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 ml-1" />
                          ))}
                      </div>
                    </th>
                    <th className="p-3 sm:p-4 text-left font-semibold text-gray-700 min-w-[100px]">👤 Pessoa</th>
                    <th className="p-3 sm:p-4 text-center font-semibold text-gray-700 min-w-[100px]">💳 Pagamento</th>
                    <th className="p-3 sm:p-4 text-center font-semibold text-gray-700 min-w-[120px]">⚙️ Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((t, index) => (
                    <tr
                      key={t.id}
                      className={`border-b hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-25"
                      }`}
                    >
                      <td className="p-3 sm:p-4 text-gray-700 text-xs sm:text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">{new Date(t.data).toLocaleDateString("pt-BR")}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(t.data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            t.tipo === "venda"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : t.tipo === "compra"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-red-100 text-red-800 border border-red-200"
                          }`}
                        >
                          {t.tipo === "venda" ? "💰 Venda" : t.tipo === "compra" ? "🛒 Compra" : "💸 Despesa"}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 font-medium text-gray-800 capitalize text-xs sm:text-sm">
                        <div className="truncate max-w-[120px]" title={t.material || "N/A"}>
                          {t.material || "N/A"}
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-right text-gray-700 text-xs sm:text-sm">
                        {t.quantidade ? `${t.quantidade.toFixed(2)} kg` : "N/A"}
                      </td>
                      <td className="p-3 sm:p-4 text-right text-gray-700 text-xs sm:text-sm">
                        {t.precoUnitario ? formatCurrency(t.precoUnitario) : "N/A"}
                      </td>
                      <td
                        className={`p-3 sm:p-4 font-bold text-right text-xs sm:text-sm ${
                          t.tipo === "venda" ? "text-green-600" : t.tipo === "compra" ? "text-blue-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(t.valorTotal)}
                      </td>
                      <td className="p-3 sm:p-4 text-gray-700 text-xs sm:text-sm">
                        <div className="truncate max-w-[100px]" title={t.vendedor || "-"}>
                          {t.vendedor || "-"}
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            t.formaPagamento === "pix"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                          }`}
                        >
                          {t.formaPagamento === "pix" ? "📱 PIX" : "💵 Dinheiro"}
                        </span>
                        {t.formaPagamento === "pix" && t.numeroTransacao && (
                          <p className="text-xs text-gray-500 mt-1 truncate max-w-[80px]" title={t.numeroTransacao}>
                            {t.numeroTransacao.substring(0, 8)}...
                          </p>
                        )}
                      </td>
                      <td className="p-3 sm:p-4 text-center">
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          <Button
                            onClick={() => onEditTransaction && onEditTransaction(t)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 py-1 transition-all duration-200 text-xs focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            title="Editar transação"
                            aria-label={`Editar transação de ${t.tipo} - ${t.material || "Despesa"}`}
                          >
                            <Edit3 className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">✏️</span>
                          </Button>
                          <Button
                            onClick={() => setShowDeleteConfirm(t)}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white px-2 sm:px-3 py-1 transition-all duration-200 text-xs focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                            title="Excluir transação"
                            aria-label={`Excluir transação de ${t.tipo} - ${t.material || "Despesa"}`}
                          >
                            <Trash2 className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">🗑️</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
              <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredAndSortedTransactions.length)}{" "}
                de {filteredAndSortedTransactions.length} transações
                {searchTerm && <span className="block sm:inline"> (filtrado de {transactions.length} total)</span>}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center px-2 sm:px-3 py-1 text-xs sm:text-sm"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-6 h-6 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center px-2 sm:px-3 py-1 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Próxima</span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 sm:ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </>
  )
}

export default TransactionsReport
