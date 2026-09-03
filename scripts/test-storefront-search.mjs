import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Supabase environment is not configured')

const supabase = createClient(url, key, { auth: { persistSession: false } })
const queries = process.argv.slice(2)
if (queries.length === 0) throw new Error('Pass one or more search queries')

for (const query of queries) {
  const { data, error } = await supabase.rpc('search_active_products', {
    p_query: query,
    p_limit: 10,
    p_offset: 0,
  })
  if (error) throw error
  const ids = (data ?? []).map((row) => row.product_id)
  const { data: products, error: productError } = ids.length
    ? await supabase.from('products').select('id, name, slug').in('id', ids)
    : { data: [], error: null }
  if (productError) throw productError
  const byId = new Map((products ?? []).map((product) => [product.id, product]))
  console.log(JSON.stringify({
    query,
    total: data?.[0]?.total_count ?? 0,
    results: (data ?? []).map((row) => ({
      name: byId.get(row.product_id)?.name ?? null,
      slug: byId.get(row.product_id)?.slug ?? null,
      relevance: row.relevance,
    })),
  }))
}
