import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// URL Normalization (Main - Redundancy)
const currentPath = window.location.pathname;
const normalizedPath = currentPath.replace(/\/+/g, '/');

if (currentPath !== normalizedPath) {
  console.log('[Main] URL normalization:', { from: currentPath, to: normalizedPath });
  const newUrl = window.location.origin + normalizedPath + window.location.search + window.location.hash;
  window.history.replaceState(null, '', newUrl);
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
