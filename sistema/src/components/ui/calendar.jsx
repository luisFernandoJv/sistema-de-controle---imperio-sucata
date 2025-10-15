"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const Button = ({ children, variant = "default", size = "default", className = "", onClick, ...props }) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50"
  const variants = {
    ghost: "hover:bg-gray-100",
  }
  const sizes = {
    sm: "h-8 w-8 p-0",
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${variants[variant] || ""} ${sizes[size] || "px-4 py-2"} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

const Calendar = ({ selected, onSelect, className = "" }) => {
  const [currentDate, setCurrentDate] = useState(selected || new Date())

  const today = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

  const previousMonth = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const selectDate = (day, e) => {
    e.preventDefault()
    e.stopPropagation()
    const selectedDate = new Date(year, month, day)
    onSelect(selectedDate)
  }

  const isSelected = (day) => {
    if (!selected) return false
    const date = new Date(year, month, day)
    return date.toDateString() === selected.toDateString()
  }

  const isToday = (day) => {
    const date = new Date(year, month, day)
    return date.toDateString() === today.toDateString()
  }

  const renderCalendarDays = () => {
    const days = []

    // Dias vazios do mês anterior
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>)
    }

    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <button
          key={day}
          type="button"
          onClick={(e) => selectDate(day, e)}
          className={`
            p-2 text-sm rounded-lg hover:bg-blue-100 transition-colors
            ${isSelected(day) ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
            ${isToday(day) && !isSelected(day) ? "bg-blue-100 text-blue-600 font-semibold" : ""}
            ${!isSelected(day) && !isToday(day) ? "text-gray-700 hover:text-blue-600" : ""}
          `}
        >
          {day}
        </button>,
      )
    }

    return days
  }

  return (
    <div className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={previousMonth} className="p-2 hover:bg-gray-100">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h3 className="text-lg font-semibold text-gray-900">
          {monthNames[month]} {year}
        </h3>

        <Button variant="ghost" size="sm" onClick={nextMonth} className="p-2 hover:bg-gray-100">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="p-2 text-xs font-medium text-gray-500 text-center">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
    </div>
  )
}

export { Calendar }
