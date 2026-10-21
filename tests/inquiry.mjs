// Dependency-free browser regression checks. Start headless Chrome with
// --remote-debugging-port=9334, then run: node tests/inquiry.mjs
// All third-party requests are blocked; fetch and CAPTCHA are local mocks.
import http from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let path = url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname;
    const file = new URL('.' + path, root);
    if (!file.href.startsWith(root.href)) throw Error('Invalid path');
    let body = await readFile(file);
    if (path === '/services/index.html') {
      // Never use or transmit the checkout's actual public integration key.
      body = body.toString().replace(/(name="access_key" value=")[^"]*/, '$1' +
        (url.searchParams.get('key') === 'empty' ? '' : url.searchParams.get('key') === 'placeholder'
          ? 'CHIMJA_WEB3FORMS_ACCESS_KEY_REPLACE_ME' : 'mock-public-key'));
    }
    res.setHeader('Content-Type', path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : path.endsWith('.html') ? 'text/html' : 'application/octet-stream');
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let ws;
try {
  const pages = await (await fetch('http://127.0.0.1:9334/json')).json();
  ws = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
  let sequence = 0;
  const pending = new Map();
  const errors = [];
  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const handler = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) handler.reject(Error(message.error.message));
      else handler.resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (message.method === 'Fetch.requestPaused') {
      const { requestId, request } = message.params;
      cdp(request.url.startsWith('http://127.0.0.1:') ? 'Fetch.continueRequest' : 'Fetch.failRequest',
        request.url.startsWith('http://127.0.0.1:') ? { requestId } : { requestId, errorReason: 'BlockedByClient' });
    }
  });
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.calls = []; window.mode = 'success'; window.resets = 0;
    window.hcaptcha = {reset() { window.resets++; }};
    const realTimeout = window.setTimeout;
    window.setTimeout = (fn, ms, ...args) => realTimeout(fn, ms === 20000 ? 25 : ms, ...args);
    window.fetch = async (url, options) => {
      window.calls.push({url, options});
      if (window.mode === 'network') throw Error('Mock network failure');
      if (window.mode === 'timeout') return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(Error('Aborted'))));
      if (window.mode === 'pending') await new Promise(resolve => window.finish = resolve);
      return {ok: window.mode !== 'http', json: async () => {
        if (window.mode === 'malformed') throw Error('Malformed JSON');
        return {success: window.mode !== 'reject'};
      }};
    };
  ` });
  const evaluate = async expression => {
    const result = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const load = async (key = 'configured') => {
    await cdp('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/services/?key=${key}` });
    for (let i = 0; i < 100; i++) {
      if (await evaluate(`document.readyState === 'complete' && !!document.getElementById('project-inquiry')`)) return;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw Error('Page load timeout');
  };
  const submit = () => evaluate(`document.getElementById('project-inquiry').dispatchEvent(new Event('submit', {cancelable:true})); true`);
  const fill = () => evaluate(`
    document.getElementById('full-name').value='Local Test';
    document.getElementById('email').value='test@example.invalid';
    document.getElementById('service-interest').selectedIndex=1;
    document.getElementById('description').value='<img src=x onerror=alert(1)> Local test only';
    const token=document.createElement('textarea'); token.name='h-captcha-response'; token.value='mock-token';
    document.getElementById('project-inquiry').append(token); true;
  `);
  const state = () => evaluate(`({disabled:document.getElementById('inquiry-submit').disabled,
    availability:document.getElementById('form-availability').textContent,
    error:document.getElementById('inquiry-error').textContent,
    status:document.getElementById('inquiry-status').textContent,
    name:document.getElementById('full-name').value, calls:window.calls.length,
    busy:document.getElementById('project-inquiry').getAttribute('aria-busy'), resets:window.resets})`);
  let checks = 0;
  for (const key of ['empty', 'placeholder']) {
    await load(key); assert.equal((await state()).disabled, true);
    await submit(); assert.equal((await state()).calls, 0);
    assert.match((await state()).error, /currently unavailable/); checks++;
  }
  await load(); assert.equal((await state()).disabled, false);
  await submit(); assert.equal((await state()).calls, 0);
  assert.equal(await evaluate(`document.activeElement.id`), 'full-name'); checks++;
  await fill();
  await evaluate(`document.getElementById('email').value='invalid'`);
  await submit(); assert.equal((await state()).calls, 0); checks++;
  await evaluate(`document.getElementById('email').value='test@example.invalid'; document.querySelector('[name="h-captcha-response"]').value=''`);
  await submit(); assert.match((await state()).error, /CAPTCHA/); assert.equal((await state()).calls, 0); checks++;
  await evaluate(`document.querySelector('[name="h-captcha-response"]').value='mock-token'; document.querySelector('[name="botcheck"]').checked=true`);
  await submit(); assert.equal((await state()).calls, 0); checks++;
  for (const mode of ['success', 'reject', 'http', 'malformed', 'network', 'timeout', 'pending']) {
    await load(); await fill(); await evaluate(`window.mode=${JSON.stringify(mode)}`);
    await submit();
    if (mode === 'pending') {
      assert.equal((await state()).busy, 'true'); await submit();
      assert.equal((await state()).calls, 1); await evaluate(`window.finish(); true`);
    }
    await new Promise(resolve => setTimeout(resolve, 60));
    const current = await state();
    assert.equal(current.calls, 1); assert.equal(current.disabled, false); assert.equal(current.busy, null);
    assert.equal(current.resets, 1);
    if (['success', 'pending'].includes(mode)) { assert.equal(current.name, ''); assert.match(current.status, /Thank you/); }
    else { assert.equal(current.name, 'Local Test'); assert.ok(current.error); assert.equal(current.status, ''); }
    assert.equal(await evaluate(`document.querySelector('#inquiry-error img')`), null);
    assert.equal(await evaluate(`JSON.parse(window.calls[0].options.body)['h-captcha-response']`), 'mock-token');
    assert.equal(await evaluate(`window.calls[0].url`), 'https://api.web3forms.com/submit');
    checks++;
  }
  await load();
  for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    assert.equal(await evaluate(`document.documentElement.scrollWidth <= window.innerWidth`), true, `Overflow at ${width}`);
    checks++;
  }
  await cdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 900, deviceScaleFactor: 1, mobile: false });
  await evaluate(`document.querySelector('.menu').click(); true`);
  assert.equal(await evaluate(`document.querySelector('.menu').getAttribute('aria-expanded')`), 'true');
  await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape'})); true`);
  assert.equal(await evaluate(`document.querySelector('.menu').getAttribute('aria-expanded')`), 'false');
  await evaluate(`document.querySelector('.services-faq summary').click(); true`);
  assert.equal(await evaluate(`document.querySelector('.services-faq details').open`), true);
  for (const width of [320, 1440]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
    await evaluate(`document.getElementById('inquiry').scrollIntoView({behavior:'instant'}); new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true))))`);
    const screenshot = await cdp('Page.captureScreenshot', { format: 'png' });
    await writeFile(`/private/tmp/chimja-web001-${width}.png`, Buffer.from(screenshot.data, 'base64'));
  }
  await load(); await fill();
  await evaluate(`window.hcaptcha.reset = () => { throw Error('Mock CAPTCHA reset failure'); }; true`);
  await submit();
  assert.match((await state()).error, /could not be refreshed/); checks++;
  assert.equal(await evaluate(`document.querySelectorAll('.services-faq details').length`), 6);
  assert.equal(await evaluate(`!!document.getElementById('inquiry') && [...document.querySelectorAll('a[href^="#"]')].every(a => document.getElementById(a.hash.slice(1)))`), true);
  assert.equal(await evaluate(`/local setup|access.key|configuration|environment variable/i.test(document.querySelector('.services-faq').textContent)`), false);
  assert.deepEqual(errors, []);
  await cdp('Emulation.setScriptExecutionDisabled', { value: true });
  await load();
  assert.equal((await state()).disabled, true);
  assert.match((await state()).availability, /currently unavailable/);
  await cdp('Emulation.setScriptExecutionDisabled', { value: false }); checks++;
  console.log(`PASS: ${checks} browser scenarios; FAQ content, anchor targets, and no JavaScript exceptions. Third-party resources blocked; CAPTCHA and delivery not certified.`);
} finally { ws?.close(); server.close(); }
