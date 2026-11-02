export function production(){return process.env.VERCEL_ENV==='production';}
export function assertEnabled(){
 if(!production()&&process.env.VERCEL_ENV!=='preview')throw new Error('Deployment unavailable.');
 if(production()&&(process.env.CHIMJA_LIVE_ENABLED!=='true'||!process.env.RESEND_WEBHOOK_SECRET||!process.env.TURNSTILE_SITE_KEY||!process.env.TURNSTILE_SECRET_KEY))throw new Error('Chatbot setup is not complete. Please email hello@chimja.com.');
}
export function isAdmin(request){
 // Immutable deployment and the production alias both require this project’s Vercel Authentication.
 const expected=process.env.VERCEL_URL;
 return !!expected&&[expected,'chimja-website-chimja.vercel.app'].includes(new URL(request.url).hostname);
}
export function followupSchedule(){return production()?['2d','3d']:['3m','5m'];}
export function publicOrigin(request){return production()?'https://chimja.com':new URL(request.url).origin;}
