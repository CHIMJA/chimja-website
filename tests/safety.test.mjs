import test from 'node:test';import assert from 'node:assert/strict';import {validateLead,TEST_EMAIL,assertPreview} from '../lib/safety.mjs';
const valid={name:'Test',email:TEST_EMAIL,overview:'Website chatbot inquiry',consent:true,requestId:'12345678-1234-1234-1234-123456789012'};
test('only the approved inbox can receive test mail',()=>{assert.equal(validateLead(valid).email,TEST_EMAIL);assert.throws(()=>validateLead({...valid,email:'other@example.com'}));});
test('requires affirmative consent',()=>{for(const consent of [false,'true',undefined])assert.throws(()=>validateLead({...valid,consent}));});
test('rejects malformed and oversized inputs',()=>{assert.throws(()=>validateLead({...valid,overview:'a'}));assert.throws(()=>validateLead({...valid,name:'a'.repeat(81)}));assert.throws(()=>validateLead({...valid,requestId:'abc'}));});
test('preview cannot accidentally activate in production',()=>{const old=process.env.VERCEL_ENV;process.env.VERCEL_ENV='production';assert.throws(assertPreview);process.env.VERCEL_ENV='preview';assert.doesNotThrow(assertPreview);if(old)process.env.VERCEL_ENV=old;else delete process.env.VERCEL_ENV;});
