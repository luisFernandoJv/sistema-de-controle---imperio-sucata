import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { HelmetProvider } from 'react-helmet-async'; // 👈 1. Importe o HelmetProvider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider> {/* 👈 2. Envelope seu <App /> com ele */}
      <App />
    </HelmetProvider>
  </React.StrictMode>
);
