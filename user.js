// === VASASALUD CONFIG ===
// NOTE: Supabase anon key is safe to expose on frontend (it's designed for this).
// Row Level Security (RLS) in Supabase enforces data access rules server-side.
// Never put service_role key here.

const VASA_CONFIG = {
  supabase: {
    url: 'https://bpwnyqagqzlzggkyckfd.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwd255cWFncXpsemdna3lja2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNjM0MDIsImV4cCI6MjA5MzkzOTQwMn0.Ok4aWUGBoc18erx0qM_miGlLAEOIpYwnAeW3E1xdnJA'
  },
  roles: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    USER: 'user'
  },
  // Super admin email - only this email gets super_admin access
  superAdminEmail: 'superadmin@vasasalud.com'
};

Object.freeze(VASA_CONFIG);
