import { MetalinkProvider } from './metalink/MetalinkContext'
import MetalinkOnboarding from './metalink/MetalinkOnboarding'
import MetalinkApp from './metalink/MetalinkApp'

// Public client onboarding links look like: yourdomain.com/metalink-client/<client-id>
// Everything else (the root URL) shows the password-gated dashboard.
export default function App() {
  const path = window.location.pathname
  const clientMatch = path.match(/^\/metalink-client\/([a-zA-Z0-9-]+)$/)

  if (clientMatch) {
    return (
      <MetalinkProvider>
        <MetalinkOnboarding clientId={clientMatch[1]} />
      </MetalinkProvider>
    )
  }

  return <MetalinkApp />
}
