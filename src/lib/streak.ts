// Contor de zile la rand (discret): se numara zilele in care aplicatia a fost deschisa. Tinut doar pe acest dispozitiv.

const KEY = 'radikalStreak';

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function touchStreak(): number {
  try {
    const now = new Date();
    const today = iso(now);
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null') as { last?: string; count?: number } | null;
    if (raw?.last === today) return raw.count ?? 1;
    const count = raw?.last === iso(y) ? (raw.count ?? 0) + 1 : 1;
    localStorage.setItem(KEY, JSON.stringify({ last: today, count }));
    return count;
  } catch {
    return 0;
  }
}
