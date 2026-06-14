const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const WebSocket = require('ws');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ROLE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey, {
        realtime: {
            transport: WebSocket,
        },
    });

    console.log("Supabase connected");
} else {
    console.warn("Supabase NOT configured");
}

module.exports = supabase;