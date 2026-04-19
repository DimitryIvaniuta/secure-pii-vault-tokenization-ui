import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { QueryProvider } from './app/query';
import { AuthProvider } from './app/AuthProvider';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryProvider>
  </StrictMode>,
);
