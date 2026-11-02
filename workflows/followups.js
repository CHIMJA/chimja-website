import {production} from '../lib/runtime.mjs';
import {sleep,FatalError} from 'workflow';
import {db} from '../lib/db.mjs';
import {generate} from '../lib/model.mjs';
import {TEST_EMAIL,assertPreview} from '../lib/safety.mjs';
async function deliver(id,stage,origin){
 'use step';
 assertPreview();console.log('followup_step',{id,stage});
 const sql=db();const [lead]=await sql`SELECT * FROM chimja_test_leads WHERE id=${id}`;
 if(!lead||lead.stopped||(!production()&&lead.email!==TEST_EMAIL))return false;
 const [old]=await sql`SELECT * FROM chimja_test_messages WHERE lead_id=${id} AND stage=${stage}`;
 if(old?.state==='accepted'||old?.state==='delivered')return true;
 if(old&&old.state!=='pending')throw new FatalError('Email requires review; automatic resend blocked.');
 let body=old?.body;
 if(!body)body=stage===0?`Hi ${lead.name},\n\nThanks for sharing your project with CHIMJA. We have received your inquiry.\n\nProject: ${lead.overview}\n\nWe will review your project. You may receive up to two follow-up emails if we have not heard back.`:await generate([{role:'user',content:JSON.stringify({name:lead.name,project:lead.overview,followup:stage})}],'email');
 const subject=stage===0?'CHIMJA — your project inquiry':stage===1?'CHIMJA — a quick project follow-up':'CHIMJA — one final project check-in';
 await sql`INSERT INTO chimja_test_messages(lead_id,stage,subject,body) VALUES (${id},${stage},${subject},${body}) ON CONFLICT DO NOTHING`;
 const claim=await sql`UPDATE chimja_test_messages m SET state='sending',updated_at=now() WHERE lead_id=${id} AND stage=${stage} AND state='pending' AND EXISTS(SELECT 1 FROM chimja_test_leads l WHERE l.id=m.lead_id AND l.stopped IS NULL) RETURNING body`;
 if(!claim.length)return false;
 try{
 const r=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(20000),headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`chimja-${production()?'live':'test'}/${id}/${stage}`},body:JSON.stringify({from:'CHIMJA <hello@updates.chimja.com>',to:[lead.email],reply_to:!!process.env.RESEND_WEBHOOK_SECRET?`lead-${lead.token}@updates.chimja.com`:'hello@chimja.com',subject,text:`${claim[0].body}\n\n— CHIMJA\nStop follow-ups: ${origin}/stop/${lead.token}\n\n${process.env.RESEND_WEBHOOK_SECRET?'Reply to this email to stop the remaining follow-ups.':'Private test: replies are not automatically detected until receiving is enabled.'}`})});
 if(!r.ok)throw new Error(`Resend HTTP ${r.status}`);const d=await r.json();if(!d.id)throw new Error('No provider message ID');
 await sql`UPDATE chimja_test_messages SET state='accepted',provider_id=${d.id},updated_at=now() WHERE lead_id=${id} AND stage=${stage}`;return true;
 }catch(e){console.error('email_send_needs_review',{id,stage});await sql`UPDATE chimja_test_messages SET state='needs_review',updated_at=now() WHERE lead_id=${id} AND stage=${stage}`;throw new FatalError('Email send outcome requires review. No automatic resend.');}
}
export async function followups(id,origin,schedule){
 'use workflow';
 console.log('followups_started',{id});
 if(!await deliver(id,0,origin))return;
 await sleep(schedule[0]);
 if(!await deliver(id,1,origin))return;
 await sleep(schedule[1]);
 await deliver(id,2,origin);
}
