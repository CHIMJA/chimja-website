import {Webhook} from 'svix';
import {production} from './runtime.mjs';
import {TEST_EMAIL} from './safety.mjs';
export function verifyReplyEvent(raw,headers,secret){if(!secret)throw new Error('Webhook secret missing');new Webhook(secret).verify(raw,headers);return JSON.parse(raw);}
export function matchReply(event){
 if(event?.type!=='email.received')return null;
 const d=event.data;if(!d||typeof d.from!=='string'||!Array.isArray(d.to)||typeof d.email_id!=='string')return null;
 const sender=(d.from.match(/<([^<>]+)>\s*$/)?.[1]||d.from).trim().toLowerCase();
 if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(sender)||(!production()&&sender!==TEST_EMAIL))return null;
 const tokens=d.to.filter(x=>typeof x==='string').map(x=>x.trim().match(/^(?:[^<>]*<)?lead-([a-f0-9]{48})@updates\.chimja\.com>?$/i)?.[1]?.toLowerCase()).filter(Boolean);
 return tokens.length===1?{token:tokens[0],sender,emailId:d.email_id}:null;
}
