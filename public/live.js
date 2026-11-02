import {clientConversation} from './chat-context.mjs';
import {contactFromMessages,briefPayload} from './intake.mjs';
const $=s=>document.querySelector(s);let data={leads:[],messages:[]};let messages=[];let requestId=crypto.randomUUID();
const node=(tag,text,cls)=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n};
async function api(body){const r=await fetch('/api/assistant',body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);const d=await r.json();if(!r.ok)throw new Error(d.error||'Request failed');return d;}
let humanWidget;let humanScript;
async function renderHuman(){if(data.test||!data.siteKey)return;try{if(!window.turnstile){if(!humanScript)humanScript=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.onload=resolve;script.onerror=reject;document.head.append(script);});await humanScript;}if(humanWidget===undefined)humanWidget=window.turnstile.render('#human-check',{sitekey:data.siteKey,action:'inquiry'});}catch{$('#review-status').textContent='Security check could not load. Please reload or email hello@chimja.com.';}}
async function refresh(){try{data=await api();if(!data.test){const email=$('#lead-form').elements.email;email.readOnly=false;if(email.value==='krishnarjun.iiit@gmail.com')email.value='';}if(!$('#review-panel').hidden)await renderHuman();if($('#reply-status'))$('#reply-status').textContent=data.replyDetection?'Replies automatically stop remaining follow-ups.':'Automatic reply detection is not yet connected. Use Stop follow-ups in this preview.';const box=$('#leads');if(!box)return;box.replaceChildren();if(!data.leads.length)box.append(node('div','Your first inquiry will appear here. Start with “Try the assistant”.','empty'));for(const l of data.leads){const ms=data.messages.filter(m=>m.lead_id===l.id);const latest=ms.sort((a,b)=>b.stage-a.stage)[0];const state=!l.run_id?'Needs attention':l.stopped?'Stopped':latest?.state==='needs_review'?'Needs attention':latest?.stage===2&&['accepted','delivered'].includes(latest.state)?'Follow-ups complete':'Following up';const row=node('article','','row'),info=node('div');info.append(node('strong',l.name),node('p',l.overview),node('span',l.stopped==='Reply received'?'Replied · Follow-ups stopped':l.stopped==='Unsubscribed'?'Opted out':state,'badge'));const b=node('button','View details','quiet');b.onclick=()=>details(l,ms);row.append(info,b);box.append(row);}$('#status').textContent='';}catch(e){if($('#status'))$('#status').textContent=e.message;}}
function details(l,ms){const box=$('#detail-body');box.replaceChildren(node('h3',l.name),node('p',l.overview));box.append(node('p',l.stopped||'Next step: await the next follow-up, or stop the sequence.'));if(!l.stopped){const b=node('button','Stop follow-ups');b.onclick=async()=>{b.disabled=true;try{await api({action:'stop',id:l.id});$('#details').close();await refresh();}catch(e){b.disabled=false;box.append(node('p',e.message));}};box.append(b);}for(const m of ms.sort((a,b)=>a.stage-b.stage)){const d=node('details'),s=node('summary',(m.stage===0?'Acknowledgment':`Follow-up ${m.stage}`)+' · '+({accepted:'Sent to email provider',delivered:'Delivery confirmed',needs_review:'Needs review',sending:'Sending',pending:'Preparing'}[m.state]||m.state));d.append(s,node('strong',m.subject||''),node('pre',m.body||''));box.append(d);}box.append(node('p','“Sent to email provider” does not confirm inbox delivery. Check the recipient inbox.','foot'));$('#details').showModal();}
let busy=false;let saved=false;let lastBriefVersion=-1;let lastAutoBrief='';
const form=$('#lead-form');
function prefill(){const contact=contactFromMessages(messages);if(!form.elements.name.value&&contact.name)form.elements.name.value=contact.name;if(!form.elements.email.value&&contact.email)form.elements.email.value=contact.email;}
function setBusy(value){busy=value;$('#restart').disabled=value;$('#intake').disabled=value;$('#chat button').disabled=value;$('#submit-inquiry').disabled=value||saved;}
function closeAssistant(){if(window.parent!==window)window.parent.postMessage('chimja-close',location.origin);else $('#assistant').close();}
if($('#new'))$('#new').onclick=()=>$('#assistant').showModal();$('#close').onclick=closeAssistant;
if($('#close-details'))$('#close-details').onclick=()=>$('#details').close();if($('#refresh'))$('#refresh').onclick=refresh;
$('#back-chat').onclick=()=>{$('#review-panel').hidden=true;$('#chat-panel').hidden=false;$('#question').focus();};
async function openReview(){
 if(busy)return;prefill();$('#chat-panel').hidden=true;$('#review-panel').hidden=false;
 if(!saved&&messages.some(m=>m.role==='user')&&lastBriefVersion!==messages.length&&(!form.elements.overview.value||form.elements.overview.value===lastAutoBrief)){
  setBusy(true);$('#review-status').textContent='Preparing your project brief…';
  try{const d=await api({action:'brief',...briefPayload(messages)});if(!form.elements.name.value)form.elements.name.value=d.draft.name||'';if(!form.elements.email.value)form.elements.email.value=d.draft.email||'';form.elements.overview.value=d.draft.overview;lastAutoBrief=d.draft.overview;lastBriefVersion=messages.length;$('#review-status').textContent='Check the brief and edit anything before sending.';}
  catch{$('#review-status').textContent='We couldn’t prepare the brief. Please add your project requirements below, or return to chat.';}
  finally{setBusy(false);}
 }
 await renderHuman();
}
$('#intake').onclick=openReview;
$('#chat').onsubmit=async e=>{
 e.preventDefault();if(busy)return;const input=$('#question'),q=input.value.trim();if(!q)return;setBusy(true);
 messages.push({role:'user',content:q});prefill();const bubble=node('p',q,'bubble user');$('#conversation').append(bubble);input.value='';$('#chat-status').textContent='Thinking…';let open=false;
 try{const d=await api({action:'chat',...clientConversation(messages),turnCount:messages.filter(m=>m.role==='user').length,...(saved?{inquiryId:requestId}:{})});messages.push({role:'assistant',content:d.reply});$('#conversation').append(node('p',d.reply,'bubble'));if(d.suggestIntake)$('#intake').classList.remove('quiet');$('#chat-status').textContent='';open=d.openReview;}
 catch(e){messages.pop();bubble.remove();input.value=q;$('#chat-status').textContent=e.message+' Your message is ready to retry.';}
 finally{setBusy(false);$('#conversation').scrollTop=$('#conversation').scrollHeight;}
 if(open&&!saved)await openReview();
};
$('#restart').onclick=()=>{
 if(busy)return;messages=[];requestId=crypto.randomUUID();saved=false;lastBriefVersion=-1;lastAutoBrief='';form.reset();for(const field of [form.elements.name,form.elements.email,form.elements.overview])field.readOnly=false;form.elements.consent.disabled=false;$('#submission-note').hidden=true;$('#intake').textContent='Review project details →';$('#back-chat').textContent='← Back to chat';if(humanWidget!==undefined)window.turnstile?.reset(humanWidget);$('#review-panel').hidden=true;$('#chat-panel').hidden=false;$('#conversation').replaceChildren(node('p','Hi! Tell me what you’d like to build.','bubble'));$('#question').value='';$('#chat-status').textContent='';$('#review-status').textContent='';$('#submit-inquiry').textContent='Send project inquiry';$('#intake').classList.add('quiet');setBusy(false);$('#question').focus();
};
form.onsubmit=async e=>{
 e.preventDefault();if(busy||saved)return;setBusy(true);$('#review-status').textContent='Submitting your inquiry…';
 try{await api({action:'create',name:form.elements.name.value,email:form.elements.email.value,overview:form.elements.overview.value,consent:form.elements.consent.checked,companyWebsite:form.elements.companyWebsite.value,humanToken:humanWidget===undefined?'':window.turnstile.getResponse(humanWidget),requestId});saved=true;for(const field of [form.elements.name,form.elements.email,form.elements.overview])field.readOnly=true;form.elements.consent.disabled=true;$('#submission-note').hidden=false;$('#intake').textContent='View submitted details';$('#back-chat').textContent='← Continue chatting';$('#review-status').textContent='Inquiry received. An acknowledgment is queued for '+form.elements.email.value+'. Remaining follow-ups stop if you reply or opt out.';$('#submit-inquiry').textContent='Inquiry received';await refresh();}
 catch(e){$('#review-status').textContent=e.message;if(humanWidget!==undefined)window.turnstile?.reset(humanWidget);}
 finally{setBusy(false);}
};
refresh();
if(document.body.dataset.widget){$('#assistant').showModal();$('#assistant').addEventListener('cancel',event=>{event.preventDefault();closeAssistant();});}
