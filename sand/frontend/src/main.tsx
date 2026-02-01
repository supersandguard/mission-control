import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { TransactionsProvider } from './context/TransactionsContext'
import { DaimoProvider } from './providers/DaimoProvider'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DaimoProvider>
      <BrowserRouter>
        <TransactionsProvider>
          <App />
        </TransactionsProvider>
      </BrowserRouter>
    </DaimoProvider>
  </StrictMode>,
)
