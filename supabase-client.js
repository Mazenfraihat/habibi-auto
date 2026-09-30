// ── Shared Supabase client + inventory helpers ──
// Load order on every page: supabase-js (CDN) → supabase-config.js → this file.
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const PHOTO_BUCKET = 'car-photos';

// Escape values before putting them into innerHTML
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// DB row (snake_case) → car object used by the page templates
function rowToCar(r) {
  return {
    id: r.id,
    photo: r.photo_url,
    photoPath: r.photo_path,
    badge: r.badge,
    badgeType: r.badge_type,
    make: r.make,
    year: r.year,
    name: r.name,
    specs: r.specs || [],
    highlights: r.highlights || [],
    price: r.price
  };
}

async function fetchCars() {
  const { data, error } = await sb.from('cars').select('*').order('id');
  if (error) throw error;
  return data.map(rowToCar);
}
