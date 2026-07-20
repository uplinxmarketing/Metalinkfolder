import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Which required env vars are missing (an empty string counts as missing too).
export const missingEnvVars = [
  !supabaseUrl && 'VITE_SUPABASE_URL',
  !supabaseAnonKey && 'VITE_SUPABASE_ANON_KEY',
].filter(Boolean)

export const isSupabaseConfigured = missingEnvVars.length === 0

// IMPORTANT: do not throw at module load. This file is statically imported by
// most of the app, so throwing here crashes the entire module graph before
// React can render anything — which shows up as a blank white page in
// production (e.g. a Vercel deploy without env vars set). Instead export a
// null client and let main.jsx render a readable setup screen.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
