import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { PublicWebsite } from './pages/PublicWebsite.tsx'
import { AdminLogin } from './pages/admin/AdminLogin.tsx'
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx'

import { DomainRouter } from './DomainRouter.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DomainRouter />} />

        {/* Public Website */}
        <Route path="/w/:slug" element={<PublicWebsite />} />

        {/* Admin Panel */}
        <Route path="/w/:slug/admin/login" element={<AdminLogin />} />
        <Route path="/w/:slug/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
