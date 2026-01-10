import React from 'react'
import ReactDOM from "react-dom/client"
import App from './App.jsx'
import * as serviceWorker from "./serviceWorker"
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import "./i18n"
import { Provider } from 'react-redux'
import store from './store/index.js'

// Get Clerk Publishable Key from environment variables
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

console.log('🔑 CLERK KEY CHECK:', {
  keyExists: !!PUBLISHABLE_KEY,
  keyPreview: PUBLISHABLE_KEY ? PUBLISHABLE_KEY.substring(0, 15) + '...' : 'MISSING',
  allEnvVars: Object.keys(import.meta.env)
});

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key. Add VITE_CLERK_PUBLISHABLE_KEY to .env.local")
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.Fragment>
    <Provider store={store}>
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY}
        navigate={(to) => window.location.href = to}
      >
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkProvider>
    </Provider>
  </React.Fragment>,
);

serviceWorker.unregister()