import React from 'react'
import ReactDOM from "react-dom/client"
import App from './App.jsx'
import * as serviceWorker from "./serviceWorker"
import { BrowserRouter } from 'react-router-dom'
import "./i18n"
import { Provider } from 'react-redux'
import store from './store/index.js'
import KindeAuthProvider from './KindeAuthProvider.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.Fragment>
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <KindeAuthProvider>
            <App />
          </KindeAuthProvider>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </React.Fragment>,
);

serviceWorker.unregister()