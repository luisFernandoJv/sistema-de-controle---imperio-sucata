# Sistema Império Sucata

Sistema de gerenciamento para empresa de sucata com controle de estoque, transações, relatórios e análises financeiras.

## Tecnologias

- **React 18** - Interface de usuário
- **Vite** - Build tool e dev server
- **Firebase** - Backend (Firestore, Authentication, Functions)
- **Tailwind CSS** - Estilização
- **Recharts** - Gráficos e visualizações
- **React Router** - Navegação
- **Lucide React** - Ícones

## Funcionalidades

- 📊 Dashboard com métricas em tempo real
- 💰 Controle de transações (compras, vendas, despesas)
- 📦 Gerenciamento de estoque e inventário
- 📈 Relatórios financeiros e análises
- 🧮 Calculadora integrada
- 🔔 Sistema de notificações
- 🖨️ Impressão de comandas/etiquetas
- 💬 Chat de suporte (Tawk.to)

## Instalação

1. Clone o repositório
2. Instale as dependências:

\`\`\`bash
npm install
# ou
pnpm install
\`\`\`

3. Configure o Firebase:
   - Copie `.env.example` para `.env`
   - Preencha com suas credenciais do Firebase

4. Inicie o servidor de desenvolvimento:

\`\`\`bash
npm run dev
\`\`\`

5. Acesse `http://localhost:5173`

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa o linter

## Estrutura do Projeto

\`\`\`
sistema/
├── src/
│   ├── components/      # Componentes React
│   ├── contexts/        # Context API
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Configurações (Firebase)
│   ├── pages/          # Páginas principais
│   ├── services/       # Serviços e APIs
│   ├── utils/          # Funções utilitárias
│   ├── App.jsx         # Componente principal
│   └── main.jsx        # Entry point
├── public/             # Arquivos estáticos
└── functions/          # Firebase Cloud Functions
\`\`\`

## Firebase Functions

As Cloud Functions estão na pasta `functions/` e incluem:
- Triggers para atualização de estoque
- Cálculos automáticos de lucro
- Notificações

Para fazer deploy das functions:

\`\`\`bash
firebase deploy --only functions
\`\`\`

## Licença

Propriedade de Império Sucata - Todos os direitos reservados
