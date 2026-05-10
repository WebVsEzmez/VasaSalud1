// === SUPABASE CLIENT ===

// Load Supabase from CDN via dynamic import
let _supabase = null;

async function initSupabase() {
  if (_supabase) return _supabase;

  // Load supabase-js from CDN
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  _supabase = createClient(VASA_CONFIG.supabase.url, VASA_CONFIG.supabase.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  return _supabase;
}

function getSupabase() {
  if (!_supabase) throw new Error('Supabase not initialized');
  return _supabase;
}

// ========== DB HELPERS ==========

async function dbGetProfile(userId) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

async function dbUpsertProfile(profile) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function dbGetAllUsers() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('role', VASA_CONFIG.roles.USER)
    .order('full_name');
  if (error) throw error;
  return data || [];
}

async function dbGetAllAdmins() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('role', VASA_CONFIG.roles.ADMIN)
    .order('full_name');
  if (error) throw error;
  return data || [];
}

async function dbCreateRequest(request) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('requests')
    .insert(request)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function dbGetUserRequests(userId) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function dbGetPendingRequests() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('requests')
    .select('*, profiles!requests_user_id_fkey(full_name, dni, email)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function dbGetAllRequests() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('requests')
    .select('*, profiles!requests_user_id_fkey(full_name, dni, email)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function dbRespondRequest(requestId, response) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('requests')
    .update({ status: 'responded', admin_response: response, responded_at: new Date().toISOString() })
    .eq('id', requestId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function dbGetPatientRequests(userId) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function dbGetFamilyMembers(userId) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('family_members')
    .select('*')
    .eq('user_id', userId)
    .order('name');
  if (error) throw error;
  return data || [];
}

async function dbAddFamilyMember(member) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('family_members')
    .insert(member)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function dbDeleteFamilyMember(id) {
  const sb = getSupabase();
  const { error } = await sb
    .from('family_members')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

async function dbUploadTranscription(file, userId) {
  const sb = getSupabase();
  const ext = file.name.split('.').pop();
  const path = `transcriptions/${userId}/${Date.now()}.${ext}`;
  const { error } = await sb.storage
    .from('vasasalud')
    .upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = sb.storage.from('vasasalud').getPublicUrl(path);
  return data.publicUrl;
}

async function dbGetAllProfilesWithRequests() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('profiles')
    .select('*, requests(count)')
    .order('full_name');
  if (error) throw error;
  return data || [];
}
