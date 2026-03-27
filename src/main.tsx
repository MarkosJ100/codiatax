import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

const rootElement = document.getElementById('root');
if (rootElement) {
  document.documentElement.setAttribute('data-platform', 'web');
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  const bootMessage = document.getElementById('boot-msg');
  if (bootMessage) bootMessage.style.display = 'none';
}
