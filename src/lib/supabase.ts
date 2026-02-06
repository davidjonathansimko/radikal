// Supabase client configuration / Supabase Client Konfiguration
// This file sets up the connection to our Supabase database
// Diese Datei stellt die Verbindung zu unserer Supabase-Datenbank her

import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase URL and API key from environment variables / Supabase URL und API-Schlüssel aus Umgebungsvariablen
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Maintain a SINGLE browser client instance to prevent multiple GoTrueClient warnings
// (Important for avoiding auth event listener explosions & performance issues)
// Einen EINZIGEN Browser-Client beibehalten, um mehrere GoTrueClient-Warnungen zu vermeiden
declare global {
	// eslint-disable-next-line no-var
	var __SUPABASE_BROWSER_CLIENT__: SupabaseClient | undefined;
}

/**
 * Returns a Supabase client. On the server a fresh instance is created (stateless usage).
 * In the browser we memoize a singleton on globalThis to avoid creating hundreds of clients
 * which leads to the "Multiple GoTrueClient instances" warning and slower auth checks.
 *
 * Gibt einen Supabase-Client zurück. Auf dem Server wird eine neue Instanz erstellt.
 * Im Browser wird eine Singleton-Instanz wiederverwendet, um Performance-Probleme zu vermeiden.
 */
export const getSupabaseClient = (): SupabaseClient => {
	if (typeof window === 'undefined') {
		// Server-side (RSC / route handlers) can safely return a new instance
		return createSupabaseClient(supabaseUrl, supabaseAnonKey);
	}
	if (!globalThis.__SUPABASE_BROWSER_CLIENT__) {
		globalThis.__SUPABASE_BROWSER_CLIENT__ = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
			auth: {
				persistSession: true,
				autoRefreshToken: true,
				detectSessionInUrl: true,
			},
		});
	}
	return globalThis.__SUPABASE_BROWSER_CLIENT__;
};

// Backwards compatibility: existing imports using createClient() will still work.
// Rückwärtskompatibilität: bestehende Importe funktionieren weiterhin.
export const createClient = getSupabaseClient;

// Export URL and key for external use / URL und Schlüssel für externe Verwendung exportieren
export { supabaseUrl, supabaseAnonKey }
