import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import InsightDisplay from './components/InsightDisplay'

function App() {
  const sampleInsight = {
    title: "Sample User Engagement",
    value: "1,234",
    confidence: 0.92,
    unit: "active users"
  };

  const anotherInsight = {
    title: "Conversion Rate",
    value: "15.3",
    confidence: 0.85,
    unit: "%"
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank" rel="noreferrer">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React PoC</h1>
      <div className="card">
        <h2>Insight SDK Component Test</h2>
        <InsightDisplay insight={sampleInsight} />
        <hr />
        <InsightDisplay insight={anotherInsight} />
        <hr />
        <InsightDisplay insight={ { title: "Task Completion", value: "88", confidence: 0.99, unit: "%" } } />
      </div>
      <p className="read-the-docs">
        This PoC demonstrates a basic React component for displaying insights.
      </p>
    </>
  )
}

export default App
