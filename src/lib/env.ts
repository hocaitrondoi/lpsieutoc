export function getEnv(key: string): string | undefined {
  const isBrowser = typeof window !== 'undefined';
  if (isBrowser) {
    if ((window as any).ENV?.[key]) {
      return (window as any).ENV[key];
    }
    // Fallback to static build-time vars
    if (key === 'SUPABASE_URL') return import.meta.env.VITE_SUPABASE_URL;
    if (key === 'SUPABASE_PUBLISHABLE_KEY') return import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    return undefined;
  }
  
  // Server-side
  const globalEnv = (globalThis as any).ENV;
  if (globalEnv && typeof globalEnv === 'object' && key in globalEnv) {
    return globalEnv[key];
  }
  
  return process.env[key];
}
