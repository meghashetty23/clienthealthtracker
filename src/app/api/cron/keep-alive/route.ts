import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = createServerSupabase()
    const { error } = await supabase.from('clients').select('id').limit(1).maybeSingle()
    if (error) throw error
    return Response.json({ ok: true })
  } catch {
    return Response.json({ ok: false }, { status: 500 })
  }
}
