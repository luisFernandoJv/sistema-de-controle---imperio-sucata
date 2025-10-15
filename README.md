# 🏭 Império Sucata - Sistema de Gestão

Sistema completo de gestão para ferro-velho com controle de estoque, transações, relatórios e análises financeiras.

## 📋 Estrutura do Projeto

\`\`\`
imperiosucata/
├── functions/              # Firebase Cloud Functions
│   ├── index.js           # Funções serverless
│   ├── package.json       # Dependências das functions
│   └── .eslintrc.js       # Configuração ESLint
│
├── sistema/               # Aplicação React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── contexts/      # Context API
│   │   ├── lib/          # Bibliotecas e utilitários
│   │   ├── pages/        # Páginas da aplicação
│   │   └── utils/        # Funções utilitárias
│   ├── public/           # Arquivos estáticos
│   └── package.json      # Dependências do frontend
│
├── firebase.json         # Configuração Firebase
├── firestore.rules       # Regras de segurança Firestore
└── firestore.indexes.json # Índices do Firestore
\`\`\`

## 🚀 Funcionalidades

### 📊 Dashboard
- Visão geral de vendas, compras e lucros
- Gráficos de tendências e análises
- KPIs em tempo real
- Top 5 materiais mais lucrativos

### 💰 Transações
- Registro de compras, vendas e despesas
- Cálculo automático de valores
- Histórico completo de transações
- Impressão de comandas/recibos

### 📦 Inventário
- Controle de estoque em tempo real
- Alertas de estoque baixo
- Análise de margem de lucro
- Filtros e ordenação inteligente

### 📈 Relatórios
- Relatórios diários, semanais e mensais
- Exportação em PDF e Excel
- Análise por material
- Análise por forma de pagamento

## 🛠️ Tecnologias

### Frontend
- **React** 19.1.0 - Biblioteca UI
- **Vite** 7.1.9 - Build tool
- **React Router** 7.9.4 - Roteamento
- **Tailwind CSS** 4.1.9 - Estilização
- **Recharts** 2.15.4 - Gráficos
- **Framer Motion** 12.23.24 - Animações
- **React Hook Form** 7.60.0 - Formulários
- **Zod** 3.25.76 - Validação

### Backend
- **Firebase** 12.4.0
  - Authentication
  - Firestore Database
  - Cloud Functions
  - Storage
- **Node.js** 18

### Cloud Functions
- **jsPDF** - Geração de PDFs
- **XLSX** - Geração de Excel
- **Firebase Admin SDK** - Operações serverless

## 📦 Instalação

### Pré-requisitos
- Node.js 18 ou superior
- npm ou yarn
- Firebase CLI

### 1. Clone o repositório
\`\`\`bash
git clone <repository-url>
cd imperiosucata
\`\`\`

### 2. Instale as dependências do frontend
\`\`\`bash
cd sistema
npm install
\`\`\`

### 3. Instale as dependências das Cloud Functions
\`\`\`bash
cd ../functions
npm install
\`\`\`

### 4. Configure o Firebase
\`\`\`bash
# Faça login no Firebase
firebase login

# Inicialize o projeto (se necessário)
firebase init
\`\`\`

### 5. Configure as variáveis de ambiente
Crie um arquivo `.env` na pasta `sistema/` com suas credenciais do Firebase:

\`\`\`env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
\`\`\`

## 🚀 Executando o Projeto

### Desenvolvimento Local

#### Frontend
\`\`\`bash
cd sistema
npm run dev
\`\`\`
Acesse: http://localhost:5173

#### Cloud Functions (Emulador)
\`\`\`bash
cd functions
npm run serve
\`\`\`

#### Firebase Emulators (Completo)
\`\`\`bash
firebase emulators:start
\`\`\`

### Build de Produção

#### Frontend
\`\`\`bash
cd sistema
npm run build
\`\`\`

#### Deploy Firebase
\`\`\`bash
# Deploy completo
firebase deploy

# Deploy apenas functions
firebase deploy --only functions

# Deploy apenas hosting
firebase deploy --only hosting

# Deploy apenas firestore rules
firebase deploy --only firestore:rules
\`\`\`

## 📱 Funcionalidades Principais

### 1. Gestão de Transações
- ✅ Registro de compras de materiais
- ✅ Registro de vendas
- ✅ Controle de despesas
- ✅ Múltiplas formas de pagamento
- ✅ Impressão de comandas

### 2. Controle de Estoque
- ✅ Atualização automática via Cloud Functions
- ✅ Alertas de estoque baixo
- ✅ Análise de margem de lucro por material
- ✅ Histórico de movimentações

### 3. Relatórios e Análises
- ✅ Dashboard com KPIs em tempo real
- ✅ Gráficos de tendências
- ✅ Relatórios diários automáticos
- ✅ Exportação em PDF e Excel
- ✅ Análise por período customizado

### 4. Integrações
- ✅ Tawk.to - Chat ao vivo
- ✅ Firebase Authentication
- ✅ Cloud Storage para arquivos

## 🔒 Segurança

- Autenticação via Firebase Auth
- Regras de segurança Firestore configuradas
- Validação de dados no frontend e backend
- HTTPS obrigatório em produção

## 📊 Estrutura do Banco de Dados

### Collections Principais

#### `transactions`
\`\`\`javascript
{
  id: string,
  tipo: 'compra' | 'venda' | 'despesa',
  material: string,
  quantidade: number,
  precoUnitario: number,
  valorTotal: number,
  vendedor: string,
  formaPagamento: string,
  data: Timestamp,
  observacoes: string
}
\`\`\`

#### `inventory/current`
\`\`\`javascript
{
  [material]: {
    quantidade: number
  }
}
\`\`\`

#### `daily_reports/{date}`
\`\`\`javascript
{
  date: Timestamp,
  dateString: string,
  totalSales: number,
  totalPurchases: number,
  totalExpenses: number,
  totalProfit: number,
  materialStats: {},
  paymentStats: {}
}
\`\`\`

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é privado e proprietário.

## 👥 Suporte

Para suporte, entre em contato através do chat Tawk.to integrado no sistema.

---

**Desenvolvido com ❤️ para Império Sucata**
