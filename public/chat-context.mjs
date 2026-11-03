export function boundedNotes(text){if(text.length<=6000)return text;return text.slice(0,2950)+'\n[Some intermediate notes omitted]\n'+text.slice(-2950);}
export function prepareConversation(messages,context=''){
 if(!Array.isArray(messages)||!messages.length||messages.length>60||typeof context!=='string'||context.length>6000||messages.some(m=>!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||!m.content.trim()||m.content.length>2400)||messages.at(-1).role!=='user')throw new Error('Please send a message of up to 1,800 characters.');
 let cut=Math.max(0,messages.length-11);while(cut<messages.length&&messages[cut].role!=='user')cut++;
 const notes=messages.slice(0,cut).filter(m=>m.role==='user').map(m=>m.content).join('\n');
 return {messages:messages.slice(cut),context:boundedNotes([context,notes].filter(Boolean).join('\n'))};
}
export function clientConversation(messages){return prepareConversation(messages.slice(-60),boundedNotes(messages.slice(0,-60).filter(m=>m.role==='user').map(m=>m.content).join('\n')));}
