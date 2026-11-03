import {assertPreview} from '../../../lib/safety.mjs';
import {db,init} from '../../../lib/db.mjs';
import {verifyReplyEvent,matchReply} from '../../../lib/replies.mjs';
export async function POST(request){
 try{assertPreview();}catch{return new Response('Preview only',{status:404});}
 if(!process.env.RESEND_WEBHOOK_SECRET)return new Response('Webhook setup incomplete',{status:503});
 const raw=await request.text();if(raw.length>262144)return new Response('Payload too large',{status:413});
 let event;try{event=verifyReplyEvent(raw,{'svix-id':request.headers.get('svix-id'),'svix-timestamp':request.headers.get('svix-timestamp'),'svix-signature':request.headers.get('svix-signature')},process.env.RESEND_WEBHOOK_SECRET);}catch{return new Response('Invalid signature',{status:401});}
 const reply=matchReply(event);if(!reply)return Response.json({received:true});
 try{await init();const sql=db();const rows=await sql`UPDATE chimja_test_leads SET stopped='Reply received' WHERE token=${reply.token} AND email=${reply.sender} AND stopped IS NULL RETURNING id`;console.log('reply_event_processed',{matched:rows.length});return Response.json({received:true});}catch{console.error('reply_event_failed');return new Response('Temporary processing failure',{status:503});}
}
export async function GET(){return new Response('Resend webhook endpoint. POST requests require a valid signature.',{headers:{'Cache-Control':'no-store'}});}
