import {contactFromMessages,reviewIntent,REVIEW_REPLY,SUBMITTED_REPLY,safeChatReply,validateBrief} from '../../../public/intake.mjs';
import {production,isAdmin,publicOrigin,followupSchedule} from '../../../lib/runtime.mjs';
import {limitRequest,verifyHuman} from '../../../lib/abuse.mjs';
import {prepareConversation} from '../../../public/chat-context.mjs';
import {randomBytes} from 'node:crypto';
import {start} from 'workflow/api';
import {followups} from '../../../workflows/followups.js';
import {db,init,reserve} from '../../../lib/db.mjs';
import {generate} from '../../../lib/model.mjs';
import {assertPreview,assertOrigin,validateLead,CONSENT} from '../../../lib/safety.mjs';
export const dynamic='force-dynamic';
const json=(v,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(request){try{assertPreview();const config={test:!production(),siteKey:production()?process.env.TURNSTILE_SITE_KEY:null,replyDetection:!!process.env.RESEND_WEBHOOK_SECRET};if(!isAdmin(request))return json({...config,leads:[],messages:[]});await init();const sql=db();const leads=await sql`SELECT id,name,overview,created_at,stopped,run_id FROM chimja_test_leads ORDER BY created_at DESC LIMIT 20`;const messages=await sql`SELECT lead_id,stage,subject,body,state,updated_at FROM chimja_test_messages ORDER BY updated_at DESC LIMIT 60`;return json({...config,leads,messages});}catch(e){console.error('preview_read_failed',{message:e.message?.slice(0,100)});return json({error:'Preview data is unavailable.'},503);}}
export async function POST(request){try{assertPreview();assertOrigin(request);const raw=await request.text();if(raw.length>48000)return json({error:'Request too large.'},413);const v=JSON.parse(raw);await init();const sql=db();
 if(v.action==='chat'){
 await limitRequest(request,'chat');
 const chat=prepareConversation(v.messages,v.context||'');
 const turnCount=Number.isInteger(v.turnCount)?Math.max(1,Math.min(v.turnCount,500)):v.messages.filter(m=>m.role==='user').length;
 const submitted=/^[a-f0-9-]{36}$/.test(v.inquiryId||'')&&(await sql`SELECT id FROM chimja_test_leads WHERE id=${v.inquiryId} AND run_id IS NOT NULL`).length>0;
 const wantsReview=turnCount>=3&&reviewIntent(v.messages.at(-1).content);
 const reply=wantsReview?(submitted?SUBMITTED_REPLY:REVIEW_REPLY):safeChatReply(await generate(chat.messages,'chat',chat.context,turnCount,submitted),submitted);
 return json({reply,suggestIntake:turnCount>=3,openReview:wantsReview&&!submitted});}
 if(v.action==='brief'){
 await limitRequest(request,'brief');
 prepareConversation(v.messages.at(-1)?.role==='assistant'?v.messages.slice(0,-1):v.messages,v.context||'');
 const extracted=await generate(v.messages,'brief',v.context||'');
 return json({draft:validateBrief(extracted,contactFromMessages([{role:'user',content:v.context||''},...v.messages]))});}
 if(v.action==='create'){
 await limitRequest(request,'create');await verifyHuman(v);const lead=validateLead(v);const existing=await sql`SELECT id,run_id FROM chimja_test_leads WHERE id=${lead.requestId}`;
 if(existing.length){if(!existing[0].run_id)return json({error:'Your inquiry was saved, but email scheduling needs CHIMJA review. Please email hello@chimja.com.'},503);return json({id:existing[0].id,alreadySaved:true,runId:existing[0].run_id});}
 await reserve('leads:'+new Date().toISOString().slice(0,10),production()?20:5);
 await reserve('email:'+lead.email+':'+new Date().toISOString().slice(0,10),2);
 const token=randomBytes(24).toString('hex');const inserted=await sql`INSERT INTO chimja_test_leads(id,name,email,overview,consent,token) VALUES (${lead.requestId},${lead.name},${lead.email},${lead.overview},${CONSENT},${token}) ON CONFLICT DO NOTHING RETURNING id`;
 if(!inserted.length)return json({id:lead.requestId,alreadySaved:true});
 const run=await start(followups,[lead.requestId,publicOrigin(request),followupSchedule()]);await sql`UPDATE chimja_test_leads SET run_id=${run.runId} WHERE id=${lead.requestId}`;
 return json({id:lead.requestId,runId:run.runId});}
 if(v.action==='stop'){
 if(!isAdmin(request))return json({error:'Sign in through the private CHIMJA deployment to manage inquiries.'},403);
 if(!/^[a-f0-9-]{36}$/.test(v.id||''))return json({error:'Invalid inquiry.'},400);
 await sql`UPDATE chimja_test_leads SET stopped='Stopped by CHIMJA' WHERE id=${v.id}`;return json({stopped:true});}
 return json({error:'Unknown action.'},400);
 }catch(e){console.error('preview_action_failed',{message:e.message?.slice(0,100)});return json({error:/Please send|Please agree|Enter a name|valid email|security check|overview|approved test|limit reached|AI service|identifier/.test(e.message)?e.message:'Action could not complete. Check the inquiry list before trying again.'},400);}}
