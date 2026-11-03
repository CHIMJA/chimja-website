import {createHash} from 'node:crypto';
import {reserve} from './db.mjs';
import {production} from './runtime.mjs';
export async function limitRequest(request,action){
 const ip=request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()||'unknown';
 const bucket=createHash('sha256').update(ip+new Date().toISOString().slice(0,10)).digest('hex');
 await reserve('request:'+action+':'+bucket,action==='create'?3:30);
}
export async function verifyHuman(v){
 if(v.companyWebsite)throw new Error('Submission rejected.');
 if(!production())return;
 if(!process.env.TURNSTILE_SECRET_KEY||!v.humanToken)throw new Error('Please complete the security check.');
 const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',signal:AbortSignal.timeout(10000),body:new URLSearchParams({secret:process.env.TURNSTILE_SECRET_KEY,response:v.humanToken})});
 const d=await r.json();if(!d.success||!['chimja.com','www.chimja.com'].includes(d.hostname)||d.action!=='inquiry')throw new Error('Please complete the security check again.');
}
