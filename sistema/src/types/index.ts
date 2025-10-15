export interface Transaction {
  id: string
  tipo: "compra" | "venda" | "despesa"
  material: string
  quantidade: number
  precoUnitario: number
  valorTotal: number
  vendedor?: string
  cliente?: string
  fornecedor?: string
  formaPagamento: "pix" | "dinheiro" | string
  numeroTransacao?: string
  observacoes?: string
  data: Date | string
  createdAt?: Date
  updatedAt?: Date
}

export interface InventoryItem {
  quantidade: number
  precoCompra: number
  precoVenda: number
  minStockLevel?: number
  updatedAt?: Date
}

export interface DailyReport {
  date: Date
  dateString: string
  totalSales: number
  totalPurchases: number
  totalExpenses: number
  totalProfit: number
  totalTransactions: number
  salesCount: number
  purchasesCount: number
  expensesCount: number
  materialStats: Record<string, MaterialStats>
  paymentStats: Record<string, PaymentStats>
  generatedAt: Date
}

export interface MaterialStats {
  vendas: number
  compras: number
  quantidade: number
  lucro: number
  transacoes: number
}

export interface PaymentStats {
  count: number
  total: number
}

export interface AggregatedReport {
  totalSales: number
  totalPurchases: number
  totalExpenses: number
  totalProfit: number
  totalTransactions: number
  salesCount: number
  purchasesCount: number
  expensesCount: number
  profitMargin: number
  materialStats: Record<string, MaterialStats>
  paymentStats: Record<string, PaymentStats>
  dailyBreakdown: DailyBreakdown[]
  period: {
    startDate: string
    endDate: string
  }
}

export interface DailyBreakdown {
  date: string
  sales: number
  purchases: number
  expenses: number
  profit: number
  transactions: number
}

export interface Notification {
  id: string
  type: "low_stock" | "info" | "warning" | "error"
  title: string
  message: string
  materials?: LowStockMaterial[]
  read: boolean
  createdAt: Date
  readAt?: Date
}

export interface LowStockMaterial {
  material: string
  quantidade: number
  minimo: number
  nivel: "critico" | "baixo"
}
