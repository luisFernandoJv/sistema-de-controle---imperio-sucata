"use client"

import { useState, useRef, useEffect } from "react"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "./calendar"

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

const DatePicker = ({ selected, onSelect, placeholder = "Selecionar data", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleToggle = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  const handleSelect = (date) => {
    onSelect(date)
    setIsOpen(false)
  }

  const formatDate = (date) => {
    if (!date) return placeholder
    return date.toLocaleDateString("pt-BR")
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={handleToggle}
        className="w-full justify-start text-left font-normal bg-transparent"
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {formatDate(selected)}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <Calendar selected={selected} onSelect={handleSelect} />
        </div>
      )}
    </div>
  )
}

export { DatePicker }
