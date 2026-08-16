// Admin detection based on the Supabase JWT role claim.
// Admin-Erkennung basierend auf dem Supabase-JWT-Rollen-Claim.
// Detectarea adminului pe baza claim-ului de rol din JWT-ul Supabase.
//
// WHY NOT an email comparison?
//   - the address ends up in the public JS bundle and in the public GitHub repo
//   - it reveals which account to attack and invites spam
//
// `app_metadata` is signed into the JWT by Supabase and can ONLY be changed with
// the service_role key - a logged in user cannot modify it from the browser.
// The exact same claim is used by the `is_admin()` function in the RLS policies,
// so UI and database always agree on who is admin.
//
// Setup (run once in the Supabase SQL editor):
//   update auth.users
//   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
//   where email = 'your-admin@example.com';
// The user must then sign out and sign in again to receive a fresh token.

type MaybeAdminUser = {
  app_metadata?: {
    role?: string;
    [key: string]: unknown;
  } | null;
} | null | undefined;

/**
 * Returns true if the given Supabase user carries the admin role claim.
 * Note: this only controls what the UI shows. Real protection comes from RLS.
 */
export function isAdminUser(user: MaybeAdminUser): boolean {
  return user?.app_metadata?.role === 'admin';
}
