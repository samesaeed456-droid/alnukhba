import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let _supabaseClient: any = null;

export const supabase = () => {
    if (!_supabaseClient) {
        if (!supabaseUrl || !supabaseAnonKey) {
            console.error(
                "Missing Supabase environment variables. Please check your .env file or Settings panel."
            );
            return null;
        }
        _supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    }
    return _supabaseClient;
};

export const checkSupabaseConnection = async () => {
    const client = supabase();
    if (!client) {
        console.error("❌ Supabase is NOT connected: Client initialization failed. Check your environment variables.");
        return false;
    }
    
    try {
        const { error } = await client.from('users').select('uid').limit(1);
        
        if (error && error.code !== '42P01') { 
            console.error("❌ Supabase connection error:", error.message);
            return false;
        }
        
        console.log("✅ Supabase is CONNECTED successfully!");
        return true;
    } catch (err) {
        console.error("❌ Supabase connection failed:", err);
        return false;
    }
};
