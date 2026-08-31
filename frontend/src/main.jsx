import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux'
import { store } from './redux/store.js'
import AuthInitialize from './components/AuthInitialize.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';


const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
createRoot(document.getElementById('root')).render(
  <StrictMode>
  <Provider store={store}>
    <AuthInitialize>
      <GoogleOAuthProvider clientId={googleClientId}>
      <App />
      </GoogleOAuthProvider>
    </AuthInitialize>
  </Provider>
  </StrictMode>,
)
