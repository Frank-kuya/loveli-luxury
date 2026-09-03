const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) throw new Error('Missing Supabase URL or service key');
async function query(path) {
  const res = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${path}: ${text}`);
  return JSON.parse(text);
}
const rows = await query('orders?select=id,order_number,user_id,kind,status,total_minor,shipping_address_id,created_at&kind=eq.distributor_signup&order=created_at.desc&limit=20');
console.log(JSON.stringify({ count: rows.length, orders: rows.map((r) => ({ id: r.id, orderNumber: r.order_number, status: r.status, totalKes: Number(r.total_minor) / 100, shippingAddressId: r.shipping_address_id, createdAt: r.created_at })) }, null, 2));
