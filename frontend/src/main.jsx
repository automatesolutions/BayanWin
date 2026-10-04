import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import './styles/index.css'

// StrictMode intentionally off: in React 18 dev it runs effects twice, doubling every dashboard API call
// (graphs, stats, gaussian, accuracy) and masking real latency. Re-enable if you need strict checks.
const root = document.getElementById('root')
const app = (
  <HelmetProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </HelmetProvider>
)

// Production pages ship prerendered HTML (scripts/prerender.mjs): hydrate it so the
// content stays on screen while the route chunk loads. Dev has an empty root.
if (root.hasChildNodes()) {
  ReactDOM.hydrateRoot(root, app)
} else {
  ReactDOM.createRoot(root).render(app)
}

