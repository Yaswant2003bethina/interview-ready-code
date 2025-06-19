
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bgnvcmkkddwmchmjaypu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnbnZjbWtrZGR3bWNobWpheXB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjkzMjIsImV4cCI6MjA2NTY0NTMyMn0.Q1aFXYAzz5RATGx2tVKIarfHXJ3B5-TrVHofKnUekus'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
})
