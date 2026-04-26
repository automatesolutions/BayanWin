import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'

// StrictMode intentionally off: in React 18 dev it runs effects twice, doubling every dashboard API call
// (graphs, stats, gaussian, accuracy) and masking real latency. Re-enable if you need strict checks.
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)

