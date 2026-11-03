import {assertEnabled,production} from './runtime.mjs';
export const TEST_EMAIL='krishnarjun.iiit@gmail.com';
export const CONSENT='I agree to receive an acknowledgment and up to two project follow-up emails from CHIMJA. I can stop at any time.';
export function validateLead(v){
 if(v.consent!==true)throw new Error('Please agree to the email follow-ups.');
 if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(String(v.email||''))||String(v.email).length>254)throw new Error('Enter a valid email address.');
 if(!production()&&String(v.email||'').trim().toLowerCase()!==TEST_EMAIL)throw new Error('This preview only sends to the approved test inbox.');
 if(typeof v.name!=='string'||!v.name.trim()||v.name.length>80)throw new Error('Enter a name (up to 80 characters).');
 if(typeof v.overview!=='string'||v.overview.trim().length<10||v.overview.length>2000)throw new Error('Add a project overview (10–2000 characters).');
 if(!/^[a-f0-9-]{36}$/.test(v.requestId||''))throw new Error('Invalid inquiry identifier.');
 return {name:v.name.trim(),email:String(v.email).trim().toLowerCase(),overview:v.overview.trim(),requestId:v.requestId};
}
export const assertPreview=assertEnabled;
export function assertOrigin(request){const o=request.headers.get('origin');if(o&&o!==new URL(request.url).origin)throw new Error('Request origin rejected.');}
