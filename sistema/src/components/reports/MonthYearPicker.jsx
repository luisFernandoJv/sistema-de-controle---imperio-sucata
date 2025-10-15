"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"

const MonthYearPicker = ({ dateRange, onApply, navigateMonth }) => {
  const currentDate = dateRange?.from || new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())

  useEffect(() => {
    if (dateRange?.from) {
      setSelectedMonth(dateRange.from.getMonth())
      setSelectedYear(dateRange.from.getFullYear())
    }
  }, [dateRange])

  const months = [
    { value: 0, label: "Janeiro" },
    { value: 1, label: "Fevereiro" },
    { value: 2, label: "Março" },
    { value: 3, label: "Abril" },
    { value: 4, label: "Maio" },
    { value: 5, label: "Junho" },
    { value: 6, label: "Julho" },
    { value: 7, label: "Agosto" },
    { value: 8, label: "Setembro" },
    { value: 9, label: "Outubro" },
    { value: 10, label: "Novembro" },
    { value: 11, label: "Dezembro" },
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i)

  const handleApply = () => {
    if (onApply) {
      onApply(selectedMonth, selectedYear)
    }
  }

  const handlePrevMonth = () => {
    if (navigateMonth) {
      navigateMonth("prev")
    }
  }

  const handleNextMonth = () => {
    if (navigateMonth) {
      navigateMonth("next")
    }
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 shadow-lg print:hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />📅 Seletor de Mês/Ano
        </h3>
        <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-blue-200">
          <Button
            onClick={handlePrevMonth}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-blue-100 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-blue-600" />
          </Button>
          <span className="text-sm font-bold text-gray-800 min-w-[140px] text-center">
            {months[currentDate.getMonth()].label} {currentDate.getFullYear()}
          </span>
          <Button
            onClick={handleNextMonth}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-blue-100 transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-blue-600" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center">📆 Mês</label>
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(Number.parseInt(value))}>
            <SelectTrigger className="h-11 bg-white border-2 border-blue-200 hover:border-blue-400 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center">📅 Ano</label>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number.parseInt(value))}>
            <SelectTrigger className="h-11 bg-white border-2 border-blue-200 hover:border-blue-400 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={handleApply}
        className="w-full mt-4 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
      >
        ✅ Aplicar Seleção
      </Button>

      <div className="mt-4 p-3 bg-white rounded-lg border-2 border-blue-200 shadow-sm">
        <p className="text-sm text-gray-700">
          <strong className="text-blue-700">📊 Período Selecionado:</strong>
          <br />
          <span className="text-gray-900 font-medium">
            {new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}{" "}
            até{" "}
            {new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </span>
        </p>
      </div>
    </Card>
  )
}

export default MonthYearPicker
