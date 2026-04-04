import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import Game from './pages/Game'
import Admin from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Game />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  )
}
