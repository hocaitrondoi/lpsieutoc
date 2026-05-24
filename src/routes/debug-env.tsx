import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

const getDebugEnv = createServerFn({ method: 'GET' }).handler(async () => {
  const globalEnv = (globalThis as any).ENV || {};
  return {
    isGlobalEnvSet: !!(globalThis as any).ENV,
    supabaseUrlInGlobalEnv: typeof globalEnv.SUPABASE_URL,
    supabasePublishableKeyInGlobalEnv: typeof globalEnv.SUPABASE_PUBLISHABLE_KEY,
    supabaseServiceRoleKeyInGlobalEnv: typeof globalEnv.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrlInProcessEnv: typeof process.env.SUPABASE_URL,
    supabasePublishableKeyInProcessEnv: typeof process.env.SUPABASE_PUBLISHABLE_KEY,
    supabaseServiceRoleKeyInProcessEnv: typeof process.env.SUPABASE_SERVICE_ROLE_KEY,
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
