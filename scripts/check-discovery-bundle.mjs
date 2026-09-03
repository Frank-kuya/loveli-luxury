import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Supabase environment is not configured')
const supabase = createClient(url, key, { auth: { persistSession: false } })
const { data: bundles, error } = await supabase
  .from('bundles')
  .select('id, slug, name, retail_price_minor, distributor_price_minor, currency, is_active')
  .eq('slug', 'discovery-set')
  .limit(1)
if (error) throw error
if (!bundles?.[0]) {
  console.log(JSON.stringify({ exists: false }))
  process.exit(0)
}
const bundle = bundles[0]
const { data: items, error: itemError } = await supabase
  .from('bundle_items')
  .select('variant_id, quantity')
  .eq('bundle_id', bundle.id)
if (itemError) throw itemError
console.log(JSON.stringify({ exists: true, bundle, items }, null, 2))
