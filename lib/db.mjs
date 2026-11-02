import {production} from './runtime.mjs';
import {neon} from '@neondatabase/serverless';
let client;
export function db(){if(!client)client=neon(process.env.DATABASE_URL);return (strings,...values)=>{const mapped=Array.from(strings,s=>production()?s.replaceAll('chimja_test_','chimja_live_'):s);mapped.raw=mapped;return client(mapped,...values);};}
let ready;
export async function init(){
 if(!ready)ready=(async()=>{const sql=db();await sql`DO $$ BEGIN
 PERFORM pg_advisory_xact_lock(229915003);
 CREATE TABLE IF NOT EXISTS chimja_test_leads(id uuid PRIMARY KEY, name text NOT NULL,email text NOT NULL,overview text NOT NULL,consent text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),stopped text,token text NOT NULL UNIQUE,run_id text);
 CREATE TABLE IF NOT EXISTS chimja_test_messages(lead_id uuid REFERENCES chimja_test_leads(id),stage integer NOT NULL,subject text,body text,state text NOT NULL DEFAULT 'pending',provider_id text,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(lead_id,stage));
 CREATE TABLE IF NOT EXISTS chimja_test_usage(bucket text PRIMARY KEY,calls integer NOT NULL);
 END; $$`;})().catch(e=>{ready=undefined;throw e;});
 return ready;
}
export async function reserve(bucket,max){const sql=db();const r=await sql`INSERT INTO chimja_test_usage(bucket,calls) VALUES (${bucket},1) ON CONFLICT(bucket) DO UPDATE SET calls=chimja_test_usage.calls+1 WHERE chimja_test_usage.calls<${max} RETURNING calls`;if(!r.length)throw new Error('Daily limit reached. Please email hello@chimja.com.');}
