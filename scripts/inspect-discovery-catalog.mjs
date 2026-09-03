import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Supabase environment is not configured')

const supabase = createClient(url, key, { auth: { persistSession: false } })

const { data: variants, error: variantsError } = await supabase
  .from('product_variants')
  .select('id, product_id, sku, size_ml, retail_price_minor, distributor_price_minor, inventory_qty, is_active')
  .eq('size_ml', 50)
  .eq('is_active', true)
  .order('product_id', { ascending: true })

if (variantsError) throw variantsError
const productIds = (variants ?? []).map((variant) => variant.product_id)
const { data: products, error: productsError } = await supabase
  .from('products')
  .select('id, name, slug, is_active')
  .in('id', productIds)
  .eq('is_active', true)

if (productsError) throw productsError
const { data: meta, error: metaError } = await supabase
  .from('product_fragrance_meta')
  .select('product_id, scent_family, top_notes, heart_notes, base_notes')
  .in('product_id', productIds)

if (metaError) throw metaError

const productById = new Map((products ?? []).map((product) => [product.id, product]))
const metaById = new Map((meta ?? []).map((row) => [row.product_id, row]))

console.log(JSON.stringify((variants ?? []).flatMap((variant) => {
  const product = productById.get(variant.product_id)
  if (!product) return []
  return [{ ...variant, product, fragrance: metaById.get(variant.product_id) ?? null }]
}), null, 2))
