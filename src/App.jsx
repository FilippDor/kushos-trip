import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Hub from './Hub'
import CanariasPlanner from './CanariasPlanner'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/planner" element={<CanariasPlanner />} />
      </Routes>
    </Router>
  )
}
