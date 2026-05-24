import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

const getDebugEnv = createServerFn({ method: 'GET' }).handler(async () => {
  return {
    isGlobalEnvSet: !!(globalThis as any).ENV,
    globalEnvKeys: (globalThis as any).ENV ? Object.keys((globalThis as any).ENV) : [],
    processEnvKeys: Object.keys(process.env),
    supabaseUrlExists: !!process.env.SUPABASE_URL,
    globalSupabaseUrlExists: !!((globalThis as any).ENV?.SUPABASE_URL),
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
