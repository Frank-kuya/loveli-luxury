import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Missing Supabase environment variables')

const supabase = createClient(url, key, { auth: { persistSession: false } })
const { data: orders, error: ordersError } = await supabase
  .from('orders')
  .select('id, order_number, status, kind, total_minor, created_at, paid_at')
  .order('created_at', { ascending: false })
  .limit(10)
if (ordersError) throw ordersError

const ids = (orders ?? []).map((row) => String(row.id))
let audit = []
if (ids.length) {
  const { data, error } = await supabase
    .from('audit_log')
    .select('resource_id, action, occurred_at')
    .eq('resource_type', 'orders')
    .in('resource_id', ids)
    .order('occurred_at', { ascending: false })
    .limit(30)
  if (error) throw error
  audit = data ?? []
}

console.log(JSON.stringify({
  orders: orders ?? [],
  recentOrderAudit: audit,
  note: 'Read-only verification; no order status was changed.'
}, null, 2))
