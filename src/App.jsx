import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import FormView from './views/FormView.jsx'
import AdminView from './views/AdminView.jsx'
import LoginView from './views/LoginView.jsx'

function ProtectedAdmin() {
  const [auth, setAuth] = useState(() => localStorage.getItem('hk_admin_auth') === '1')

  if (!auth) return <LoginView onLogin={() => setAuth(true)} />
  return <AdminView onLogout={() => {
    localStorage.removeItem('hk_admin_auth')
    setAuth(false)
  }} />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FormView />} />
        <Route path="/formulario" element={<FormView />} />
        <Route path="/admin" element={<ProtectedAdmin />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
