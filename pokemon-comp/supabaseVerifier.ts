import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';

export default function makeVerifierClient() {
    return createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
    );
}