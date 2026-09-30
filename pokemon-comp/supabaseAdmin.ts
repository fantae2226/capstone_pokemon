import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {auth: {persistSession: false, autoRefreshToken: false}}
);

export default supabaseAdmin;