import React from 'react'
import ReactDOM from "react-dom/client"

console.log('main.jsx loaded')

const TestApp = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontSize: '32px',
      fontFamily: 'Arial'
    }}>
      <div>
        <h1>✅ React is Working!</h1>
        <p>If you see this, Vite and React are configured correctly.</p>
      </div>
    </div>
  )
}

console.log('Creating root...')
const root = ReactDOM.createRoot(document.getElementById('root'))
console.log('Rendering...')
root.render(<TestApp />)
console.log('Done!')
