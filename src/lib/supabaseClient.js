//./src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// Lấy ở Settings -> API trên Supabase Dashboard
const supabaseUrl = 'https://rmbbrqgbueyuwmsdzzha.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtYmJycWdidWV5dXdtc2R6emhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMjkyNDEsImV4cCI6MjA4ODcwNTI0MX0.v1n3uLbnHA_9k60RgQO9FjeZw7vWeIedozkamBDYea8'

export const supabase = createClient(supabaseUrl, supabaseKey)