import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { supabaseAdmin } from '../integrations/supabase/client.server';
import { getEnv } from '../lib/env';


function decodeJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = atob(payloadBase64);
    return JSON.parse(payloadJson);
  } catch (e) {
    return null;
  }
}
const createAdminUser = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const email = 'quocminhai@gmail.com';
    const password = '12345abc';

    const SUPABASE_URL = getEnv('SUPABASE_URL') || '';
    const SUPABASE_PUBLISHABLE_KEY = getEnv('SUPABASE_PUBLISHABLE_KEY') || '';
    const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY') || '';

    const anonPayload = decodeJwt(SUPABASE_PUBLISHABLE_KEY);
    const servicePayload = decodeJwt(SUPABASE_SERVICE_ROLE_KEY);

    const anonRef = anonPayload?.ref || 'unknown';
    const serviceRef = servicePayload?.ref || 'unknown';

    if (serviceRef !== 'unknown' && anonRef !== 'unknown' && serviceRef !== anonRef) {
      return {
        status: 'error',
        message: `Mật khẩu dự án không khớp! Khóa service_role bạn vừa nhập thuộc dự án "${serviceRef}", nhưng trang web này đang được cấu hình chạy trên dự án "${anonRef}". Vui lòng lấy đúng khóa service_role của dự án "${anonRef}" trên Supabase!`
      };
    }

    // 1. Create the user using admin auth
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Admin Hocaitrondoi' },
    });

    if (error) {
      // If user already exists, let's try to make sure they have the admin role
      if (error.message.includes('already registered') || error.status === 422) {
        // Let's find the user's ID
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw new Error(listError.message);
        
        const existingUser = users.users.find(u => u.email === email);
        if (existingUser) {
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .upsert({ user_id: existingUser.id, role: 'admin' }, { onConflict: 'user_id,role' });
          if (roleError) throw new Error(roleError.message);
          return { status: 'success', message: 'User already exists, successfully assigned admin role!' };
        }
      }
      throw error;
    }

    if (!created?.user) {
      throw new Error('User creation returned empty payload');
    }

    // 2. Assign admin role in user_roles table
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({ user_id: created.user.id, role: 'admin' }, { onConflict: 'user_id,role' });

    if (roleError) throw new Error(roleError.message);

    // 3. Upsert profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: created.user.id, full_name: 'Admin Hocaitrondoi', email }, { onConflict: 'id' });

    if (profileError) throw new Error(profileError.message);

    return { status: 'success', message: 'Admin user successfully created and assigned admin role!' };
  } catch (err: any) {
    console.error('Error creating admin:', err);
    let stringifiedErr = '';
    try {
      stringifiedErr = JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
    } catch (e) {
      stringifiedErr = String(err);
    }
    return { status: 'error', message: `Detailed Error: ${stringifiedErr}` };
  }
});

export const Route = createFileRoute('/create-admin')({
  component: CreateAdminComponent,
  loader: async () => {
    return await createAdminUser();
  },
});

function CreateAdminComponent() {
  const data = Route.useLoaderData();
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Create Admin Status</h1>
      <p style={{ color: data.status === 'success' ? 'green' : 'red', fontWeight: 'bold' }}>
        {data.message}
      </p>
    </div>
  );
}
