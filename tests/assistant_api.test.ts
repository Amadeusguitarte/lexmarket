import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../app/api/[...path]/route';

test('POST /api/assistant rejects empty query with 400', async () => {
  const req = new Request('https://lexmarket.test/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '' }),
  });
  const res = await POST(req, { params: Promise.resolve({ path: ['assistant'] }) });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /Por favor incluye una consulta/);
});

test('POST /api/assistant provides structured Colombian proposal strategy for lawyers', async () => {
  const req = new Request('https://lexmarket.test/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: '¿Cómo estructurar una propuesta para un caso de restitución?',
      context: {
        role: 'lawyer',
        lawyerName: 'Dr. Carlos Mendoza',
        lawyerSpecialties: ['Derecho Civil', 'Inmobiliario'],
        caseTitle: 'Restitución de local comercial por mora',
      },
    }),
  });
  const res = await POST(req, { params: Promise.resolve({ path: ['assistant'] }) });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.ok(typeof data.reply === 'string' && data.reply.length > 50);
  assert.match(data.reply, /propuesta/i);
  assert.match(data.reply, /honorarios/i);
});

test('POST /api/assistant provides clear guidance for clients', async () => {
  const req = new Request('https://lexmarket.test/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: '¿Qué documentos debo adjuntar para mi caso?',
      context: {
        role: 'client',
      },
    }),
  });
  const res = await POST(req, { params: Promise.resolve({ path: ['assistant'] }) });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.match(data.reply, /contratos|recibos|documentos/i);
});

test('POST /api/assistant calls OpenAI when OPENAI_API_KEY is configured', async (t) => {
  const oldKey = process.env.OPENAI_API_KEY;
  const oldModel = process.env.OPENAI_MODEL;
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.OPENAI_MODEL = 'gpt-4o-mini';

  t.after(() => {
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
    if (oldModel === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = oldModel;
  });

  let openAiCalled = false;
  let receivedPayload: any = null;

  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input.toString();
    if (url.includes('api.openai.com/v1/chat/completions')) {
      openAiCalled = true;
      receivedPayload = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: 'Respuesta generada por gpt-4o-mini con fundamento en el CGP de Colombia.',
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    throw new Error('Unexpected fetch call to ' + url);
  });

  const req = new Request('https://lexmarket.test/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'Redacta un requerimiento formal en mora art 2007 CC',
      history: [{ role: 'user', content: 'Tengo un caso de arriendo' }],
      context: {
        role: 'lawyer',
        lawyerName: 'Dra. Andrea',
        lawyerSpecialties: ['Derecho Civil'],
      },
    }),
  });

  const res = await POST(req, { params: Promise.resolve({ path: ['assistant'] }) });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(openAiCalled, true);
  assert.equal(data.provider, 'openai');
  assert.equal(data.model, 'gpt-4o-mini');
  assert.match(data.reply, /Respuesta generada por gpt-4o-mini/);
  assert.equal(receivedPayload.model, 'gpt-4o-mini');
  assert.ok(receivedPayload.messages.some((m: any) => m.role === 'system' && m.content.includes('MatchJurídico')));
  assert.ok(receivedPayload.messages.some((m: any) => m.content.includes('Tengo un caso de arriendo')));
});
