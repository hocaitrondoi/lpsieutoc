import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

const getDebugEnv = createServerFn({ method: 'GET' }).handler(async () => {
  const globalEnv = (globalThis as any).ENV || {};
  
  const getKeys = (obj: any): string[] => {
    const keys = new Set<string>();
    let current = obj;
    while (current && current !== Object.prototype) {
      for (const key of Reflect.ownKeys(current)) {
        if (typeof key === 'string') {
          keys.add(key);
        }
      }
      current = Object.getPrototypeOf(current);
    }
    return Array.from(keys);
  };

  const allKeys = getKeys(globalEnv);
  const keysWithType: Record<string, string> = {};
  for (const k of allKeys) {
    if (k !== 'constructor' && typeof k === 'string') {
      keysWithType[k] = typeof globalEnv[k];
    }
  }

  const envObj = (globalThis as any).ENV || {};
  
  return {
    isGlobalEnvSet: !!(globalThis as any).ENV,
    keysWithType,
    processEnvKeys: Object.keys(process.env),
    debugVersion: "v3-explicit-check",
    // Explicit checks on globalThis.ENV
    envHasSupabaseUrl: 'SUPABASE_URL' in envObj,
    envSupabaseUrlType: typeof envObj.SUPABASE_URL,
    envSupabaseUrlLength: typeof envObj.SUPABASE_URL === 'string' ? envObj.SUPABASE_URL.length : null,
    envSupabaseUrlValueStart: typeof envObj.SUPABASE_URL === 'string' ? envObj.SUPABASE_URL.slice(0, 10) : null,
    // Explicit checks on process.env
    procHasSupabaseUrl: 'SUPABASE_URL' in process.env,
    procSupabaseUrlType: typeof process.env.SUPABASE_URL,
    procSupabaseUrlLength: typeof process.env.SUPABASE_URL === 'string' ? process.env.SUPABASE_URL.length : null,
    procSupabaseUrlValueStart: typeof process.env.SUPABASE_URL === 'string' ? process.env.SUPABASE_URL.slice(0, 10) : null,
    // Explicit checks on globalThis
    globalHasSupabaseUrl: 'SUPABASE_URL' in globalThis,
    globalSupabaseUrlType: typeof (globalThis as any).SUPABASE_URL,
    globalSupabaseUrlValueStart: typeof (globalThis as any).SUPABASE_URL === 'string' ? (globalThis as any).SUPABASE_URL.slice(0, 10) : null,
  };
});

export const Route = createFileRoute('/debug-env')({
  component: DebugEnvComponent,
  loader: async () => {
    return await getDebugEnv();
  },
});

function DebugEnvComponent() {
  const data = Route.useLoaderData();
  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Debug Env</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
