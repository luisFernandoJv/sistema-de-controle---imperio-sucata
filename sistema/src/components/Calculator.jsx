"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CalculatorIcon, X, Delete, History, Copy, Check } from "lucide-react"

const Button = ({ children, onClick, className = "", variant = "default" }) => {
  const baseClasses =
    "h-12 rounded-lg font-medium transition-all duration-200 flex items-center justify-center text-lg shadow-sm hover:shadow-md"
  const variants = {
    default: "bg-gray-100 hover:bg-gray-200 text-gray-800 active:bg-gray-300 border border-gray-200",
    operator: "bg-blue-500 hover:bg-blue-600 text-white active:bg-blue-700 shadow-blue-200",
    equals: "bg-green-500 hover:bg-green-600 text-white active:bg-green-700 shadow-green-200",
    clear: "bg-red-500 hover:bg-red-600 text-white active:bg-red-700 shadow-red-200",
    memory: "bg-purple-500 hover:bg-purple-600 text-white active:bg-purple-700 shadow-purple-200",
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  )
}

const Calculator = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState("0")
  const [previousValue, setPreviousValue] = useState(null)
  const [operation, setOperation] = useState(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)
  const [memory, setMemory] = useState(0)
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [copied, setCopied] = useState(false)

  const inputNumber = (num) => {
    if (waitingForOperand) {
      setDisplay(String(num))
      setWaitingForOperand(false)
    } else {
      setDisplay(display === "0" ? String(num) : display + num)
    }
  }

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.")
      setWaitingForOperand(false)
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".")
    }
  }

  const clear = () => {
    setDisplay("0")
    setPreviousValue(null)
    setOperation(null)
    setWaitingForOperand(false)
  }

  const clearAll = () => {
    clear()
    setMemory(0)
    setHistory([])
  }

  const performOperation = (nextOperation) => {
    const inputValue = Number.parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(inputValue)
    } else if (operation) {
      const currentValue = previousValue || 0
      const newValue = calculate(currentValue, inputValue, operation)

      setDisplay(String(newValue))
      setPreviousValue(newValue)

      // Adicionar ao histórico
      addToHistory(`${currentValue} ${operation} ${inputValue} = ${newValue}`)
    }

    setWaitingForOperand(true)
    setOperation(nextOperation)
  }

  const calculate = (firstValue, secondValue, operation) => {
    switch (operation) {
      case "+":
        return firstValue + secondValue
      case "-":
        return firstValue - secondValue
      case "×":
        return firstValue * secondValue
      case "÷":
        return secondValue !== 0 ? firstValue / secondValue : 0
      case "%":
        return (firstValue * secondValue) / 100
      default:
        return secondValue
    }
  }

  const handleEquals = () => {
    const inputValue = Number.parseFloat(display)

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation)
      setDisplay(String(newValue))

      // Adicionar ao histórico
      addToHistory(`${previousValue} ${operation} ${inputValue} = ${newValue}`)

      setPreviousValue(null)
      setOperation(null)
      setWaitingForOperand(true)
    }
  }

  const addToHistory = (calculation) => {
    setHistory((prev) => [calculation, ...prev.slice(0, 9)]) // Manter apenas 10 itens
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(display)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Erro ao copiar:", err)
    }
  }

  // Funções de memória
  const memoryStore = () => {
    setMemory(Number.parseFloat(display))
  }

  const memoryRecall = () => {
    setDisplay(String(memory))
    setWaitingForOperand(true)
  }

  const memoryClear = () => {
    setMemory(0)
  }

  const memoryAdd = () => {
    setMemory(memory + Number.parseFloat(display))
  }

  const formatDisplay = (value) => {
    if (value.length > 12) {
      return Number.parseFloat(value).toExponential(6)
    }
    return value
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number.parseFloat(value) || 0)
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CalculatorIcon className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Calculadora Avançada</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Histórico"
            >
              <History className="h-5 w-5 text-gray-500" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Display */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-4 mb-4 shadow-inner">
          <div className="text-right">
            <div className="text-gray-400 text-sm h-6 flex justify-between items-center">
              <span>{memory !== 0 ? `M: ${memory}` : ""}</span>
              <span>{previousValue !== null && operation ? `${previousValue} ${operation}` : ""}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-white text-3xl font-mono font-bold flex-1">{formatDisplay(display)}</div>
              <button
                onClick={copyToClipboard}
                className="ml-2 p-1 hover:bg-gray-700 rounded transition-colors"
                title="Copiar resultado"
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-gray-400" />}
              </button>
            </div>
            <div className="text-gray-400 text-xs mt-1">{formatCurrency(display)}</div>
          </div>
        </div>

        {/* Histórico */}
        {showHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-50 rounded-lg p-3 mb-4 max-h-32 overflow-y-auto"
          >
            <h4 className="text-sm font-medium text-gray-700 mb-2">Histórico</h4>
            {history.length === 0 ? (
              <p className="text-xs text-gray-500">Nenhum cálculo realizado</p>
            ) : (
              <div className="space-y-1">
                {history.map((calc, index) => (
                  <div key={index} className="text-xs text-gray-600 font-mono">
                    {calc}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Buttons */}
        <div className="grid grid-cols-5 gap-2">
          {/* Primeira linha - Funções de memória e clear */}
          <Button variant="memory" onClick={memoryClear} className="text-xs">
            MC
          </Button>
          <Button variant="memory" onClick={memoryRecall} className="text-xs">
            MR
          </Button>
          <Button variant="memory" onClick={memoryStore} className="text-xs">
            MS
          </Button>
          <Button variant="memory" onClick={memoryAdd} className="text-xs">
            M+
          </Button>
          <Button variant="clear" onClick={clearAll} className="text-xs">
            AC
          </Button>

          {/* Segunda linha */}
          <Button variant="clear" onClick={clear}>
            C
          </Button>
          <Button variant="clear" onClick={() => setDisplay(display.slice(0, -1) || "0")}>
            <Delete className="h-4 w-4" />
          </Button>
          <Button variant="operator" onClick={() => performOperation("%")}>
            %
          </Button>
          <Button variant="operator" onClick={() => performOperation("÷")}>
            ÷
          </Button>
          <Button onClick={() => setDisplay(String(Math.sqrt(Number.parseFloat(display))))}>√</Button>

          {/* Terceira linha */}
          <Button onClick={() => inputNumber(7)}>7</Button>
          <Button onClick={() => inputNumber(8)}>8</Button>
          <Button onClick={() => inputNumber(9)}>9</Button>
          <Button variant="operator" onClick={() => performOperation("×")}>
            ×
          </Button>
          <Button onClick={() => setDisplay(String(Math.pow(Number.parseFloat(display), 2)))}>x²</Button>

          {/* Quarta linha */}
          <Button onClick={() => inputNumber(4)}>4</Button>
          <Button onClick={() => inputNumber(5)}>5</Button>
          <Button onClick={() => inputNumber(6)}>6</Button>
          <Button variant="operator" onClick={() => performOperation("-")}>
            -
          </Button>
          <Button onClick={() => setDisplay(String(1 / Number.parseFloat(display)))}>1/x</Button>

          {/* Quinta linha */}
          <Button onClick={() => inputNumber(1)}>1</Button>
          <Button onClick={() => inputNumber(2)}>2</Button>
          <Button onClick={() => inputNumber(3)}>3</Button>
          <Button variant="operator" onClick={() => performOperation("+")} className="row-span-2">
            +
          </Button>
          <Button onClick={() => setDisplay(String(-Number.parseFloat(display)))}>±</Button>

          {/* Sexta linha */}
          <Button onClick={() => inputNumber(0)} className="col-span-2">
            0
          </Button>
          <Button onClick={inputDecimal}>.</Button>
          <Button variant="equals" onClick={handleEquals}>
            =
          </Button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">Calculadora avançada com memória, histórico e funções científicas</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Calculator
