const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const WebSocket = require('ws');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase credentials (running without Supabase)');
}

// Konfigurasi dengan transport WebSocket manual
const supabase = createClient(supabaseUrl, supabaseKey, {
    realtime: {
        transport: WebSocket,
    },
});

module.exports = supabase;