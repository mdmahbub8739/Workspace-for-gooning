import { rest } from '../../test-utils/msw';
import { server } from '../../test-utils/server';
import { API_BASE, initTestClient } from '../../test-utils/cf-client';
import { cfResponse } from '../../test-utils/cf-response';
import * as api from '@/services/cloudflare';
import {
  buildFileTree,
  isValidWorkerName,
  normalizeModulePath,
  resolveWorkerModuleMime,
} from '@/services/worker-ide';

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///tmp/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
}));

const accountId = 'acc1';
const script = 'multi-worker';

beforeAll(async () => {
  await initTestClient();
});

describe('worker-ide helpers', () => {
  it('validates Cloudflare Worker script names', () => {
    expect(isValidWorkerName('my-edge-worker_1')).toBe(true);
    expect(isValidWorkerName('InvalidName')).toBe(false);
    expect(isValidWorkerName('-leading-dash')).toBe(false);
    expect(isValidWorkerName('')).toBe(false);
  });

  it('normalizes relative module paths safely', () => {
    expect(normalizeModulePath('/src//routes\\api.js')).toBe('src/routes/api.js');
    expect(normalizeModulePath('../secret/./index.js')).toBe('secret/index.js');
  });

  it('resolves Cloudflare Workers MIME types across supported extensions', () => {
    expect(resolveWorkerModuleMime('src/index.js', true)).toBe('application/javascript+module');
    expect(resolveWorkerModuleMime('legacy.js', false)).toBe('application/javascript');
    expect(resolveWorkerModuleMime('config.json', true)).toBe('application/json');
    expect(resolveWorkerModuleMime('app.py', true)).toBe('text/x-python');
    expect(resolveWorkerModuleMime('mod.wasm', true)).toBe('application/wasm');
    expect(resolveWorkerModuleMime('page.html', true)).toBe('text/plain');
    expect(resolveWorkerModuleMime('blob.bin', true)).toBe('application/octet-stream');
  });

  it('builds a sorted hierarchical tree including empty folders', () => {
    const tree = buildFileTree(
      ['src/routes/api.js', 'src/index.js', 'config.json'],
      ['assets']
    );
    expect(tree.map((n) => `${n.kind}:${n.name}`)).toEqual([
      'folder:assets',
      'folder:src',
      'file:config.json',
    ]);
    const src = tree.find((n) => n.name === 'src');
    expect(src?.children?.map((n) => `${n.kind}:${n.name}`)).toEqual([
      'folder:routes',
      'file:index.js',
    ]);
  });
});

describe('multi-module Worker APIs', () => {
  it('preserves Content-Type when parsing multipart Worker bundles', () => {
    const CRLF = '\r\n';
    const raw = [
      '--b',
      'Content-Disposition: form-data; name="src/index.js"; filename="src/index.js"',
      'Content-Type: application/javascript+module',
      '',
      'export default { fetch() { return new Response("ok") } }',
      '--b',
      'Content-Disposition: form-data; name="config.json"; filename="config.json"',
      'Content-Type: application/json',
      '',
      '{"v":1}',
      '--b--',
      '',
    ].join(CRLF);

    const { modules, multipart } = api.parseWorkerModules(raw);
    expect(multipart).toBe(true);
    expect(modules).toHaveLength(2);
    expect(modules[0].contentType).toBe('application/javascript+module');
    expect(modules[1].contentType).toBe('application/json');
  });

  it('uploads multiple modules via /content in updateWorkerModules', async () => {
    let method: string | null = null;
    let path: string | null = null;
    server.use(
      rest.put(`${API_BASE}/accounts/${accountId}/workers/scripts/${script}/content`, (req, res, ctx) => {
        method = req.method;
        path = req.url.pathname;
        return res(ctx.json(cfResponse({ id: script })));
      })
    );

    const res = await api.updateWorkerModules(accountId, script, {
      mainModule: 'src/index.js',
      modules: [
        { name: 'src/index.js', content: 'export default {}', contentType: 'application/javascript+module' },
        { name: 'config.json', content: '{}', contentType: 'application/json' },
      ],
    });

    expect(method).toBe('PUT');
    expect(path).toBe(`/client/v4/accounts/${accountId}/workers/scripts/${script}/content`);
    expect(res.result.id).toBe(script);
  });

  it('creates and deploys a new Worker script via PUT /scripts/{name}', async () => {
    let method: string | null = null;
    let path: string | null = null;
    server.use(
      rest.put(`${API_BASE}/accounts/${accountId}/workers/scripts/new-worker`, (req, res, ctx) => {
        method = req.method;
        path = req.url.pathname;
        return res(ctx.json(cfResponse({ id: 'new-worker' })));
      })
    );

    const res = await api.createWorkerScript(accountId, 'new-worker', {
      mainModule: 'index.js',
      compatibilityDate: '2026-01-01',
      usageModel: 'standard',
      modules: [
        { name: 'index.js', content: 'export default {}', contentType: 'application/javascript+module' },
      ],
    });

    expect(method).toBe('PUT');
    expect(path).toBe(`/client/v4/accounts/${accountId}/workers/scripts/new-worker`);
    expect(res.result.id).toBe('new-worker');
  });
});
