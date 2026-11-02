export function contactFromMessages(messages){
 let name='',email='';
 for(const m of messages.filter(m=>m.role==='user')){
  const found=m.content.match(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9.-]*[A-Z0-9])?\.[A-Z]{2,}/i);if(found)email=found[0];
  const named=m.content.match(/(?:\b(?:full\s+)?name\s*(?:is\b|:|=)|\b(?:i am|i'm|call me)\s+)\s*([\p{L}][\p{L} .'’-]{1,79}?)(?=\s*[,;\n]|\s+email\b|$)/iu);
  if(named&&!/planning|looking|interested|not sure|building/i.test(named[1]))name=named[1].trim().replace(/[. ]+$/,'');
 }
 return {name,email};
}
export function reviewIntent(text){return /\b(?:review (?:link|details|project)|next step|send (?:me|the link)|use (?:them|my details)|already provided)\b/i.test(text);}
export const REVIEW_REPLY='Review your project details using the form here. Your inquiry has not been submitted and no email has been sent from this chat. Check the details, give consent, then select “Send project inquiry”.';
export const SUBMITTED_REPLY='Your inquiry has already been received. You can keep chatting here. To update the submitted project brief, reply to your acknowledgment email; there’s no need to submit it again.';
export function safeChatReply(text,submitted=false){
 return /\b(?:sent|emailed|saved|submitted|scheduled)\b|\breview link\b|\bcheck\b.{0,60}\b(?:inbox|email)\b|\bi(?:’|')ve prepared\b/i.test(text)?(submitted?SUBMITTED_REPLY:REVIEW_REPLY):text;
}
export function briefSource(messages,context=''){
 return {earlierVisitorNotes:context,conversation:messages.map(m=>({speaker:m.role==='user'?'visitor':'assistant',text:m.content}))};
}
export function validateBrief(value,contact){
 const overview=typeof value?.overview==='string'?value.overview.trim():'';
 if(overview.length<10||overview.length>2000||/review link|check your inbox|let me know|brief is ready|details are noted|your project brief|please review|thanks for/i.test(overview))throw new Error('Please write a short project overview before submitting.');
 return {name:contact.name,email:contact.email,overview};
}
export function briefPayload(messages){
 const keep=messages.slice(-59);let notes=messages.slice(0,-59).filter(m=>m.role==='user').map(m=>m.content);
 while(JSON.stringify(keep).length>30000&&keep.length>2){const [removed]=keep.splice(Math.floor(keep.length/2),1);if(removed.role==='user')notes.push(removed.content);}
 let context=notes.join('\n');if(context.length>6000)context=context.slice(0,2950)+'\n[Intermediate notes omitted]\n'+context.slice(-2950);
 return {messages:keep,context};
}
