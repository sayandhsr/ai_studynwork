import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log("Testing Supabase...")
console.log("URL:", supabaseUrl)
console.log("Key Prefix:", supabaseAnonKey?.substring(0, 10))

const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

async function test() {
  const { data, error } = await supabase.from('yt_summaries').select('count', { count: 'exact', head: true })
  if (error) {
    console.error("Supabase Error:", error)
  } else {
    console.log("Supabase Success! Count:", data)
  }
}

test()
