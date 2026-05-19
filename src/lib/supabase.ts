import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
    const url = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('temp_supabase_url') || '';
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('temp_supabase_key') || '';
    return { url, key };
};

let _supabaseClient: any = null;
let _currentUrl = "";
let _currentKey = "";

export const supabase = () => {
    const { url, key } = getSupabaseConfig();
    if (!url || !key) {
        _supabaseClient = null;
        return null;
    }
    if (!_supabaseClient || _currentUrl !== url || _currentKey !== key) {
        _currentUrl = url;
        _currentKey = key;
        _supabaseClient = createClient(url, key);
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
