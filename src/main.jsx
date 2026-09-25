import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/theme.css'
import { registerServiceWorker } from './lib/pwa.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

// Registered as soon as the module runs, not on `load`: a cold first visit that immediately
// loses the network still has the shell cached. A failed registration (unsupported browser,
// insecure origin, a dev server without HTTPS) must never break the app.
registerServiceWorker()
