/**
 * Behavioral validation runner for the registration feature.
 *
 * This is what the `behavioral-validator` agent executes: it boots the REAL
 * backend on a real port and drives POST /register over real HTTP (Node's global
 * fetch), asserting the actual status codes and response envelopes against the
 * API contract + spec — not app.inject(), not reading source. It walks every
 * behavioral row of validation-contract.md, prints a PASS/FAIL line per row, and
 * exits non-zero if any row fails.
 *
 * Run from repo root after `cd backend && npx tsc`:
 *   node specs/registration/behavioral-check.mjs
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND = path.resolve(__dirname, '../../backend');
const PORT = 4555;
const BASE = `http://127.0.0.1:${PORT}`;

let pass = 0;
let fail = 0;
const results = [];

function check(id, ok, detail) {
  results.push({ id, ok, detail });
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${detail}`);
}

async function post(body) {
  const res = await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-json */
  }
  return { status: res.status, json };
}

async function waitForHealth(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${BASE}/health`);
      if (r.ok) return true;
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  return false;
}

const server = spawn(process.execPath, ['dist/src/server.js'], {
  cwd: BACKEND,
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));

try {
  const up = await waitForHealth();
  if (!up) {
    console.error('Server did not become healthy. Logs:\n' + serverLog);
    process.exit(1);
  }
  console.log(`Booted backend on ${BASE} (real HTTP). Driving the contract...\n`);

  // AC-3 / success path: valid signup -> 201, user{id,email}+token, no password.
  {
    const email = `new_${Date.now()}@example.com`;
    const r = await post({ email, password: 'hunter2hunter2' });
    const ok =
      r.status === 201 &&
      r.json?.user?.email === email &&
      /^usr_/.test(r.json?.user?.id ?? '') &&
      /^sess_/.test(r.json?.token ?? '') &&
      !JSON.stringify(r.json).includes('hunter2hunter2');
    check('AC-3', ok, `201 + {id,email}+token, no password echoed (got ${r.status})`);

    // AC-5 / ERR-1: same email again -> 409 EMAIL_TAKEN + email fieldError.
    const dup = await post({ email, password: 'hunter2hunter2' });
    check(
      'AC-5/ERR-1',
      dup.status === 409 &&
        dup.json?.error?.code === 'EMAIL_TAKEN' &&
        typeof dup.json?.error?.fieldErrors?.email === 'string',
      `duplicate email -> 409 EMAIL_TAKEN (got ${dup.status} ${dup.json?.error?.code})`,
    );
  }

  // AC-6 / ERR-2: weak password -> 400 VALIDATION + password fieldError.
  {
    const r = await post({ email: `weak_${Date.now()}@example.com`, password: 'onlyletters' });
    check(
      'AC-6/ERR-2',
      r.status === 400 &&
        r.json?.error?.code === 'VALIDATION' &&
        typeof r.json?.error?.fieldErrors?.password === 'string',
      `weak password -> 400 VALIDATION+password (got ${r.status})`,
    );
  }

  // AC-7 / ERR-3: malformed email -> 400 VALIDATION + email fieldError.
  {
    const r = await post({ email: 'not-an-email', password: 'hunter2hunter2' });
    check(
      'AC-7/ERR-3',
      r.status === 400 && r.json?.error?.code === 'VALIDATION' &&
        typeof r.json?.error?.fieldErrors?.email === 'string',
      `malformed email -> 400 VALIDATION+email (got ${r.status})`,
    );
  }

  // ERR-4: missing password -> 400 VALIDATION, never 500.
  {
    const r = await post({ email: `m_${Date.now()}@example.com` });
    check(
      'ERR-4',
      r.status === 400 && r.json?.error?.code === 'VALIDATION',
      `missing password -> 400 VALIDATION, never 500 (got ${r.status})`,
    );
  }

  // AC-10: password never returned by the success response (re-asserted on the wire).
  {
    const email = `sec_${Date.now()}@example.com`;
    const r = await post({ email, password: 'secretpass99' });
    check(
      'AC-10',
      r.status === 201 && !JSON.stringify(r.json).toLowerCase().includes('secretpass99'),
      'plaintext password never appears in the wire response',
    );
  }

  console.log(`\nVERDICT: ${fail === 0 ? 'PASS' : 'FAIL'}  (${pass} passed, ${fail} failed)`);
} finally {
  server.kill('SIGTERM');
  await sleep(200);
}

process.exit(fail === 0 ? 0 : 1);
