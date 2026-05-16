import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import Game from './pages/Game'
import Admin from './pages/Admin'
import DevCommunityPrimitives from './pages/DevCommunityPrimitives'
import { syncCommunityFlagFromUrl } from './lib/featureFlag'

// Persist any ?community=on/off URL param to localStorage once, before first
// render, so the flag survives subsequent navigation without the query string.
syncCommunityFlagFromUrl()

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
