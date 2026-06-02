const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const WebSocket = require('ws');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

ilet supabase = null;

// hanya buat client kalau env ada
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey, {
        realtime: {
            transport: WebSocket,
        },
    });

    console.log("Supabase connected");
} else {
    console.warn("Supabase NOT configured, running without Supabase");
}

module.exports = supabase;