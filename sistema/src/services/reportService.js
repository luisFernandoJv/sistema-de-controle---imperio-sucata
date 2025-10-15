/**
 * Service layer for report business logic
 * Handles transaction filtering and data processing
 */

/**
 * Filters transactions based on provided filter criteria
 * @param {Array} transactions - Array of transaction objects
 * @param {Object} filters - Filter criteria object
 * @returns {Array} Filtered and sorted transactions
 */
export const filterTransactions = (transactions, filters) => {
  if (!transactions || transactions.length === 0) {
    return []
  }

  let filtered = [...transactions]

  // Quick period filter
  if (filters.periodo !== "todos" && filters.periodo !== "personalizado") {
    filtered = applyQuickPeriodFilter(filtered, filters.periodo)
  }

  // Custom date filters (when period is "personalizado")
  if (filters.periodo === "personalizado") {
    if (filters.startDate) {
      filtered = filterByStartDate(filtered, filters.startDate)
    }
    if (filters.endDate) {
      filtered = filterByEndDate(filtered, filters.endDate)
    }
  }

  // Material filter
  if (filters.material) {
    filtered = filterByMaterial(filtered, filters.material)
  }

  // Type filter
  if (filters.tipo) {
    filtered = filterByType(filtered, filters.tipo)
  }

  // Payment method filter
  if (filters.formaPagamento) {
    filtered = filterByPaymentMethod(filtered, filters.formaPagamento)
  }

  // Client/Supplier/Seller filter
  if (filters.cliente) {
    filtered = filterByClient(filtered, filters.cliente)
  }

  // Value range filters
  if (filters.valorMin) {
    filtered = filterByMinValue(filtered, filters.valorMin)
  }
  if (filters.valorMax) {
    filtered = filterByMaxValue(filtered, filters.valorMax)
  }

  // Search term filter
  if (filters.searchTerm) {
    filtered = filterBySearchTerm(filtered, filters.searchTerm)
  }

  // Sort by date (most recent first)
  filtered.sort((a, b) => {
    if (!a.data) return 1
    if (!b.data) return -1
    return new Date(b.data) - new Date(a.data)
  })

  return filtered
}

/**
 * Apply quick period filter (today, week, month, quarter, year)
 */
const applyQuickPeriodFilter = (transactions, periodo) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  switch (periodo) {
    case "hoje": {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return transactions.filter((t) => {
        if (!t.data) return false
        const transactionDate = new Date(t.data)
        return transactionDate >= today && transactionDate < tomorrow
      })
    }
    case "semana": {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      return transactions.filter((t) => {
        if (!t.data) return false
        return new Date(t.data) >= weekStart
      })
    }
    case "mes": {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      return transactions.filter((t) => {
        if (!t.data) return false
        return new Date(t.data) >= monthStart
      })
    }
    case "trimestre": {
      const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
      return transactions.filter((t) => {
        if (!t.data) return false
        return new Date(t.data) >= quarterStart
      })
    }
    case "ano": {
      const yearStart = new Date(today.getFullYear(), 0, 1)
      return transactions.filter((t) => {
        if (!t.data) return false
        return new Date(t.data) >= yearStart
      })
    }
    default:
      return transactions
  }
}

/**
 * Filter by start date
 */
const filterByStartDate = (transactions, startDate) => {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  return transactions.filter((t) => {
    if (!t.data) return false
    const transactionDate = new Date(t.data)
    transactionDate.setHours(0, 0, 0, 0)
    return transactionDate >= start
  })
}

/**
 * Filter by end date
 */
const filterByEndDate = (transactions, endDate) => {
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)
  return transactions.filter((t) => {
    if (!t.data) return false
    const transactionDate = new Date(t.data)
    return transactionDate <= end
  })
}

/**
 * Filter by material (case-insensitive exact match)
 */
const filterByMaterial = (transactions, material) => {
  const materialLower = material.toLowerCase().trim()
  return transactions.filter((t) => {
    if (!t.material) return false
    return t.material.toLowerCase().trim() === materialLower
  })
}

/**
 * Filter by transaction type
 */
const filterByType = (transactions, tipo) => {
  const tipoLower = tipo.toLowerCase().trim()
  return transactions.filter((t) => {
    if (!t.tipo) return false
    return t.tipo.toLowerCase().trim() === tipoLower
  })
}

/**
 * Filter by payment method (handles null/undefined as "dinheiro")
 */
const filterByPaymentMethod = (transactions, formaPagamento) => {
  const formaPagamentoLower = formaPagamento.toLowerCase().trim()
  return transactions.filter((t) => {
    const formaPagamento = (t.formaPagamento || "dinheiro").toLowerCase().trim()
    return formaPagamento === formaPagamentoLower
  })
}

/**
 * Filter by client/supplier/seller (partial match)
 */
const filterByClient = (transactions, cliente) => {
  const clienteLower = cliente.toLowerCase().trim()
  return transactions.filter(
    (t) =>
      (t.cliente && t.cliente.toLowerCase().includes(clienteLower)) ||
      (t.fornecedor && t.fornecedor.toLowerCase().includes(clienteLower)) ||
      (t.vendedor && t.vendedor.toLowerCase().includes(clienteLower)),
  )
}

/**
 * Filter by minimum value
 */
const filterByMinValue = (transactions, valorMin) => {
  const minValue = Number.parseFloat(valorMin)
  if (isNaN(minValue)) return transactions
  return transactions.filter((t) => (t.valorTotal || 0) >= minValue)
}

/**
 * Filter by maximum value
 */
const filterByMaxValue = (transactions, valorMax) => {
  const maxValue = Number.parseFloat(valorMax)
  if (isNaN(maxValue)) return transactions
  return transactions.filter((t) => (t.valorTotal || 0) <= maxValue)
}

/**
 * Filter by search term (searches across multiple fields)
 */
const filterBySearchTerm = (transactions, searchTerm) => {
  const term = searchTerm.toLowerCase().trim()
  return transactions.filter(
    (t) =>
      (t.material && t.material.toLowerCase().includes(term)) ||
      (t.cliente && t.cliente.toLowerCase().includes(term)) ||
      (t.fornecedor && t.fornecedor.toLowerCase().includes(term)) ||
      (t.vendedor && t.vendedor.toLowerCase().includes(term)) ||
      (t.formaPagamento && t.formaPagamento.toLowerCase().includes(term)) ||
      (t.tipo && t.tipo.toLowerCase().includes(term)) ||
      (t.observacoes && t.observacoes.toLowerCase().includes(term)) ||
      (t.valorTotal && t.valorTotal.toString().includes(term)) ||
      (t.quantidade && t.quantidade.toString().includes(term)),
  )
}
