const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="loading-spinner"></div>
        <div className="absolute inset-0 loading-spinner opacity-30" style={{ animationDelay: "0.5s" }}></div>
      </div>
      <div className="mt-6 text-center">
        <h3 className="font-heading text-lg font-semibold text-gray-900 mb-2">Carregando Sistema</h3>
        <p className="text-gray-600">Conectando ao banco de dados...</p>
        <div className="flex items-center justify-center mt-3 space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        </div>
      </div>
    </div>
  )
}

export default LoadingSpinner
