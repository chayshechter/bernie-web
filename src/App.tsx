import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import Game from './pages/Game'
import Admin from './pages/Admin'
import DevCommunityPrimitives from './pages/DevCommunityPrimitives'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Game />} />
        <Route path="/admin" element={<Admin />} />
        {import.meta.env.DEV && (
          <Route path="/dev/community-primitives" element={<DevCommunityPrimitives />} />
        )}
      </Routes>
      <Analytics />
    </BrowserRouter>
  )
}
