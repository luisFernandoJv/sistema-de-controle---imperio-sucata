export const printInventory = (inventory, materials) => {
  const printWindow = window.open("", "_blank")

  const now = new Date()
  const dateStr = now.toLocaleDateString("pt-BR")
  const timeStr = now.toLocaleTimeString("pt-BR")

  let totalValue = 0
  let totalQuantity = 0
  let lowStockCount = 0

  const inventoryRows = materials
    .map((material) => {
      const item = inventory[material.key] || { quantidade: 0, precoCompra: 0, precoVenda: 0 }
      const value = item.quantidade * item.precoCompra
      const isLowStock = item.quantidade <= material.minStock

      totalValue += value
      totalQuantity += item.quantidade
      if (isLowStock) lowStockCount++

      return {
        ...material,
        ...item,
        value,
        isLowStock,
      }
    })
    .sort((a, b) => b.value - a.value)

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0)
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Relatório de Estoque - Império Sucata</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Arial', sans-serif; 
            font-size: 11px; 
            line-height: 1.4; 
            color: #000; 
            background: white;
            padding: 20px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #2563eb; 
            padding-bottom: 20px; 
          }
          .header h1 { 
            color: #2563eb; 
            font-size: 24px; 
            margin-bottom: 5px; 
          }
          .header h2 { 
            color: #1e40af; 
            font-size: 18px; 
            margin-bottom: 10px; 
          }
          .header p { 
            color: #666; 
            font-size: 11px; 
          }
          .summary { 
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin: 20px 0; 
            padding: 20px; 
            background-color: #f8fafc; 
            border: 2px solid #e2e8f0;
            border-radius: 8px;
          }
          .summary-item {
            text-align: center;
            padding: 10px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
          .summary-label {
            font-size: 10px;
            color: #64748b;
            margin-bottom: 5px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .summary-value {
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
          }
          .table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
          }
          .table th, .table td { 
            border: 1px solid #cbd5e1; 
            padding: 8px; 
            text-align: left; 
            font-size: 10px; 
          }
          .table th { 
            background-color: #2563eb; 
            color: white;
            font-weight: bold; 
            text-transform: uppercase;
          }
          .table tr:nth-child(even) { 
            background-color: #f8fafc; 
          }
          .table tr:hover {
            background-color: #e0f2fe;
          }
          .low-stock {
            background-color: #fef2f2 !important;
          }
          .low-stock-badge {
            display: inline-block;
            background-color: #dc2626;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 8px;
            font-weight: bold;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 9px;
          }
          .category-header {
            background-color: #1e40af !important;
            color: white;
            font-weight: bold;
            text-align: center;
            padding: 10px;
            font-size: 11px;
          }
          @media print {
            body { padding: 10px; }
            .summary { page-break-inside: avoid; }
            .table { page-break-inside: auto; }
            .table tr { page-break-inside: avoid; page-break-after: auto; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>IMPÉRIO SUCATA</h1>
          <h2>Relatório Completo de Estoque</h2>
          <p>Gerado em: ${dateStr} às ${timeStr}</p>
        </div>

        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Valor Total</div>
            <div class="summary-value">${formatCurrency(totalValue)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Quantidade Total</div>
            <div class="summary-value">${totalQuantity.toFixed(1)} kg</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Materiais</div>
            <div class="summary-value">${materials.length}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Estoque Baixo</div>
            <div class="summary-value" style="color: ${lowStockCount > 0 ? "#dc2626" : "#16a34a"}">${lowStockCount}</div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th style="width: 5%">#</th>
              <th style="width: 20%">Material</th>
              <th style="width: 10%" class="text-center">Categoria</th>
              <th style="width: 12%" class="text-right">Quantidade</th>
              <th style="width: 12%" class="text-right">Preço Compra</th>
              <th style="width: 12%" class="text-right">Preço Venda</th>
              <th style="width: 12%" class="text-right">Valor Total</th>
              <th style="width: 10%" class="text-right">Margem</th>
              <th style="width: 7%" class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${inventoryRows
              .map((item, index) => {
                const margin =
                  item.precoCompra > 0 ? ((item.precoVenda - item.precoCompra) / item.precoCompra) * 100 : 0

                return `
                  <tr class="${item.isLowStock ? "low-stock" : ""}">
                    <td class="text-center">${index + 1}</td>
                    <td><strong>${item.name}</strong></td>
                    <td class="text-center">${item.category}</td>
                    <td class="text-right">${item.quantidade.toFixed(2)} kg</td>
                    <td class="text-right">${formatCurrency(item.precoCompra)}</td>
                    <td class="text-right">${formatCurrency(item.precoVenda)}</td>
                    <td class="text-right"><strong>${formatCurrency(item.value)}</strong></td>
                    <td class="text-right" style="color: ${margin >= 0 ? "#16a34a" : "#dc2626"}">${margin.toFixed(1)}%</td>
                    <td class="text-center">
                      ${item.isLowStock ? '<span class="low-stock-badge">BAIXO</span>' : '<span style="color: #16a34a">✓</span>'}
                    </td>
                  </tr>
                `
              })
              .join("")}
          </tbody>
          <tfoot>
            <tr style="background-color: #f1f5f9; font-weight: bold;">
              <td colspan="3" class="text-right">TOTAIS:</td>
              <td class="text-right">${totalQuantity.toFixed(2)} kg</td>
              <td colspan="2"></td>
              <td class="text-right">${formatCurrency(totalValue)}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>

        <div class="footer">
          <p><strong>Império Sucata</strong> - Sistema de Gestão de Estoque</p>
          <p>Este relatório contém informações confidenciais e deve ser mantido em local seguro</p>
        </div>
      </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.print()
}

export const exportInventoryToCSV = (inventory, materials) => {
  const headers = [
    "Material",
    "Categoria",
    "Quantidade (kg)",
    "Preço Compra (R$/kg)",
    "Preço Venda (R$/kg)",
    "Valor Total (R$)",
    "Margem (%)",
    "Status",
  ]

  const rows = materials.map((material) => {
    const item = inventory[material.key] || { quantidade: 0, precoCompra: 0, precoVenda: 0 }
    const value = item.quantidade * item.precoCompra
    const margin = item.precoCompra > 0 ? ((item.precoVenda - item.precoCompra) / item.precoCompra) * 100 : 0
    const isLowStock = item.quantidade <= material.minStock

    return [
      material.name,
      material.category,
      item.quantidade.toFixed(2),
      item.precoCompra.toFixed(2),
      item.precoVenda.toFixed(2),
      value.toFixed(2),
      margin.toFixed(1),
      isLowStock ? "BAIXO" : "OK",
    ]
  })

  const csvContent = [headers.join(","), ...rows.map((row) => row.map((field) => `"${field}"`).join(","))].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `estoque_${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
