import { createClient } from '@supabase/supabase-js';
import config from './supabase-config.json';
export const supabase=createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
