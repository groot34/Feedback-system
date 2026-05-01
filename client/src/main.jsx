import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import { dark } from '@clerk/themes'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider 
      afterSignOutUrl="/"
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#06b6d4', // cyan-500
          colorTextOnPrimaryBackground: '#000000',
          colorBackground: '#0f172a',
          colorInputBackground: '#1e293b',
          colorInputText: '#ffffff',
          colorText: '#f1f5f9',
          colorTextSecondary: '#94a3b8',
        },
        elements: {
          modalContent: 'border border-cyan-900 shadow-[0_0_30px_rgba(6,182,212,0.15)] bg-[#0f172a]',
          headerTitle: 'text-white font-bold',
          headerSubtitle: 'text-gray-300',
          dividerText: 'text-gray-400',
          formFieldLabel: 'text-white',
          formFieldInput: 'bg-[#1e293b] text-white border-gray-700 focus:border-cyan-500',
          footerActionText: 'text-gray-400',
          footerActionLink: 'text-cyan-400 hover:text-cyan-300',
          formButtonPrimary: 'hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all text-black',
          socialButtonsBlockButtonText: 'text-white',
        }
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
)
