import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { isSupabaseConfigured, missingEnvVars } from './lib/supabase.js'

// If the required environment variables aren't set (the usual cause of a blank
// page on a fresh Vercel deploy), render a readable setup screen instead of
// letting the app crash on load.
function ConfigError() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'DM Sans', sans-serif",
        color: '#1A1A1F',
      }}
    >
      <div
        style={{
          maxWidth: 560,
          background: '#FFFFFF',
          border: '1px solid #E0DAD0',
          borderRadius: 16,
          padding: '32px 36px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A8F80' }}>
          METALINK
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '10px 0 8px' }}>
          Configuration needed
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: '#4A4640', margin: '0 0 16px' }}>
          The app can't start because required environment variables are missing.
          Add them in your Vercel project (<strong>Settings → Environment Variables</strong>),
          then redeploy.
        </p>
        <ul style={{ margin: '0 0 16px', paddingLeft: 20, fontSize: 15, lineHeight: 1.8 }}>
          {missingEnvVars.map((name) => (
            <li key={name}>
              <code style={{ background: '#F3EFE9', padding: '2px 6px', borderRadius: 6 }}>{name}</code>
            </li>
          ))}
        </ul>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: '#77706A', margin: 0 }}>
          Vite only exposes variables prefixed with <code>VITE_</code> to the browser, and env-var
          changes only take effect on a new deployment. See <code>.env.example</code> and the
          README for where to find each value.
        </p>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isSupabaseConfigured ? <App /> : <ConfigError />}
  </StrictMode>,
)
