"use client"

import { useState, useRef, useEffect } from "react"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "./calendar"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const Button = ({ children, variant = "default", className = "", onClick, ...props }) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white hover:bg-gray-50",
    ghost: "hover:bg-gray-100",
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} px-4 py-2 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

const DateRangePicker = ({ date, setDate, placeholder = "Selecionar período", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectingEnd, setSelectingEnd] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setSelectingEnd(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleToggle = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(!isOpen)
    if (!isOpen) {
      setSelectingEnd(false)
    }
  }

  const handleSelect = (selectedDate) => {
    if (!date?.from || selectingEnd) {
      // Se já temos uma data inicial e estamos selecionando o fim
      if (date?.from && selectedDate < date.from) {
        // Se a data final for antes da inicial, inverte
        setDate({ from: selectedDate, to: date.from })
      } else {
        setDate({ ...date, to: selectedDate })
      }
      setIsOpen(false)
      setSelectingEnd(false)
    } else {
      // Primeira seleção - data inicial
      setDate({ from: selectedDate, to: selectedDate })
      setSelectingEnd(true)
    }
  }

  const formatDateRange = () => {
    if (!date?.from) return placeholder

    const fromFormatted = format(date.from, "dd/MM/yyyy", { locale: ptBR })

    if (!date.to || date.from.getTime() === date.to.getTime()) {
      return fromFormatted
    }

    const toFormatted = format(date.to, "dd/MM/yyyy", { locale: ptBR })
    return `${fromFormatted} - ${toFormatted}`
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={handleToggle}
        className="w-full justify-start text-left font-normal bg-white h-12"
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {formatDateRange()}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <div className="mb-2 text-sm text-gray-600">
            {!date?.from || selectingEnd ? (
              <span className="font-medium text-blue-600">
                {selectingEnd ? "📅 Selecione a data final" : "📅 Selecione a data inicial"}
              </span>
            ) : (
              <span className="font-medium text-green-600">✓ Data inicial selecionada</span>
            )}
          </div>
          <Calendar selected={selectingEnd ? date?.to : date?.from} onSelect={handleSelect} />
        </div>
      )}
    </div>
  )
}

export { DateRangePicker }
