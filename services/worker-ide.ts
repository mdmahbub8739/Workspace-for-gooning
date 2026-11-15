export interface WorkerIdeFile {
  path: string;
  content: string;
  contentType: string;
  isBinary: boolean;
  /** Present when imported from device storage or for binary modules (.wasm, .bin). */
  fileUri?: string;
  sizeBytes?: number;
  dirty: boolean;
}

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  kind: 'folder' | 'file';
  children?: FileTreeNode[];
}

export interface WorkerTemplateFile {
  path: string;
  content: string;
  contentType: string;
}

export interface WorkerTemplate {
  id: 'hello' | 'router' | 'proxy' | 'cron' | 'blank';
  labelKey: string;
  descKey: string;
  mainModule: string;
  files: WorkerTemplateFile[];
}

/** Cloudflare Workers valid script name: lowercase letters, numbers, underscores/hyphens, max 63 chars. */
export function isValidWorkerName(name: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{0,62}$/.test(name.trim());
}

/** Clean relative module path (strips leading slashes, collapses duplicate slashes, blocks `..`). */
export function normalizeModulePath(raw: string): string {
  return raw
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+/g, '/')
    .split('/')
    .filter((seg) => seg && seg !== '.' && seg !== '..')
    .join('/');
}

export function getFileExtension(path: string): string {
  const base = path.split('/').pop() ?? path;
  const idx = base.lastIndexOf('.');
  return idx > 0 ? base.slice(idx + 1).toLowerCase() : '';
}

export function isBinaryModule(path: string, contentType?: string): boolean {
  const ct = (contentType ?? '').toLowerCase();
  if (ct.includes('application/wasm') || ct.includes('application/octet-stream')) return true;
  const ext = getFileExtension(path);
  return ext === 'wasm' || ext === 'bin' || ext === 'dat' || ext === 'data';
}

/**
 * Resolve the Cloudflare Workers module Content-Type for a given filename.
 * Supports ES modules, Service Workers, Python Workers, JSON, Source Maps,
 * Text/HTML/CSS/SQL/Markdown, WebAssembly, and raw binary Data modules.
 */
export function resolveWorkerModuleMime(path: string, moduleSyntax = true, existingType?: string): string {
  if (existingType && existingType !== 'application/octet-stream') {
    const clean = existingType.split(';')[0].trim().toLowerCase();
    if (clean) {
      if (clean === 'application/javascript' && !moduleSyntax) return 'application/javascript';
      if (clean === 'application/javascript+module' || clean === 'text/javascript') {
        return moduleSyntax ? 'application/javascript+module' : 'application/javascript';
      }
      if (
        clean === 'application/json' ||
        clean === 'application/wasm' ||
        clean === 'application/source-map' ||
        clean === 'text/x-python' ||
        clean === 'text/plain'
      ) {
        return clean;
      }
    }
  }

  const ext = getFileExtension(path);
  switch (ext) {
    case 'mjs':
    case 'ts':
    case 'mts':
    case 'tsx':
    case 'jsx':
      return 'application/javascript+module';
    case 'js':
      return moduleSyntax ? 'application/javascript+module' : 'application/javascript';
    case 'cjs':
      return 'application/javascript';
    case 'py':
      return 'text/x-python';
    case 'json':
    case 'jsonc':
      return 'application/json';
    case 'wasm':
      return 'application/wasm';
    case 'map':
      return 'application/source-map';
    case 'bin':
    case 'dat':
    case 'data':
      return 'application/octet-stream';
    case 'html':
    case 'htm':
    case 'css':
    case 'txt':
    case 'md':
    case 'sql':
    case 'xml':
    case 'svg':
    case 'csv':
    case 'toml':
    case 'yaml':
    case 'yml':
    default:
      return 'text/plain';
  }
}

export function isEntryPointCandidate(path: string): boolean {
  const ext = getFileExtension(path);
  return ['js', 'mjs', 'cjs', 'py', 'ts', 'mts'].includes(ext);
}

export function getModuleBadge(path: string): string {
  const ext = getFileExtension(path);
  if (!ext) return 'TXT';
  if (ext === 'wasm') return 'WASM';
  if (ext === 'html' || ext === 'htm') return 'HTML';
  if (ext === 'json' || ext === 'jsonc') return 'JSON';
  return ext.slice(0, 4).toUpperCase();
}

export function getMimeLabel(contentType: string): string {
  const clean = contentType.split(';')[0].trim().toLowerCase();
  switch (clean) {
    case 'application/javascript+module':
      return 'ES Module';
    case 'application/javascript':
      return 'Service Worker / CJS';
    case 'text/x-python':
      return 'Python';
    case 'application/json':
      return 'JSON';
    case 'application/wasm':
      return 'WebAssembly';
    case 'application/source-map':
      return 'Source Map';
    case 'application/octet-stream':
      return 'Binary Data';
    default:
      return 'Text Module';
  }
}

export function getStarterFileContent(path: string): string {
  const ext = getFileExtension(path);
  switch (ext) {
    case 'js':
    case 'mjs':
      return `export function helper() {\n  return { ok: true };\n}\n`;
    case 'cjs':
      return `module.exports = {\n  ok: true,\n};\n`;
    case 'ts':
    case 'mts':
      return `export default {\n  async fetch(request: Request): Promise<Response> {\n    return new Response("Hello from TypeScript module");\n  },\n};\n`;
    case 'py':
      return `from workers import Response\n\ndef on_fetch(request):\n    return Response("Hello from Python Worker!")\n`;
    case 'json':
      return `{\n  "name": "worker-config",\n  "version": "1.0.0"\n}\n`;
    case 'html':
    case 'htm':
      return `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>Cloudflare Worker</title>\n</head>\n<body>\n  <h1>Hello from the Edge</h1>\n</body>\n</html>\n`;
    case 'css':
      return `body {\n  font-family: system-ui, sans-serif;\n  margin: 0;\n  padding: 2rem;\n}\n`;
    case 'sql':
      return `SELECT 1 AS ok;\n`;
    default:
      return '';
  }
}

export function buildFileTree(filePaths: string[], explicitFolders: string[] = []): FileTreeNode[] {
  interface MutableDir {
    name: string;
    path: string;
    dirs: Map<string, MutableDir>;
    files: FileTreeNode[];
  }

  const root: MutableDir = { name: '', path: '', dirs: new Map(), files: [] };

  const ensureDir = (dirParts: string[]): MutableDir => {
    let curr = root;
    let accum = '';
    for (const part of dirParts) {
      accum = accum ? `${accum}/${part}` : part;
      let next = curr.dirs.get(part);
      if (!next) {
        next = { name: part, path: accum, dirs: new Map(), files: [] };
        curr.dirs.set(part, next);
      }
      curr = next;
    }
    return curr;
  };

  for (const folder of explicitFolders) {
    const clean = normalizeModulePath(folder);
    if (clean) ensureDir(clean.split('/'));
  }

  for (const rawPath of filePaths) {
    const clean = normalizeModulePath(rawPath);
    if (!clean) continue;
    const parts = clean.split('/');
    const fileName = parts.pop()!;
    const parent = ensureDir(parts);
    parent.files.push({
      id: `file:${clean}`,
      name: fileName,
      path: clean,
      kind: 'file',
    });
  }

  const toNodes = (dir: MutableDir): FileTreeNode[] => {
    const folderNodes: FileTreeNode[] = Array.from(dir.dirs.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((d) => ({
        id: `dir:${d.path}`,
        name: d.name,
        path: d.path,
        kind: 'folder',
        children: toNodes(d),
      }));

    const fileNodes = [...dir.files].sort((a, b) => a.name.localeCompare(b.name));
    return [...folderNodes, ...fileNodes];
  };

  return toNodes(root);
}

export function defaultCompatibilityDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export const WORKER_TEMPLATES: WorkerTemplate[] = [
  {
    id: 'hello',
    labelKey: 'worker_ide.tpl_hello',
    descKey: 'worker_ide.tpl_hello_desc',
    mainModule: 'index.js',
    files: [
      {
        path: 'index.js',
        contentType: 'application/javascript+module',
        content: `export default {\n  async fetch(request, env, ctx) {\n    const url = new URL(request.url);\n    return Response.json({\n      ok: true,\n      path: url.pathname,\n      timestamp: new Date().toISOString(),\n    });\n  },\n};\n`,
      },
    ],
  },
  {
    id: 'router',
    labelKey: 'worker_ide.tpl_router',
    descKey: 'worker_ide.tpl_router_desc',
    mainModule: 'src/index.js',
    files: [
      {
        path: 'src/index.js',
        contentType: 'application/javascript+module',
        content: `import { routeRequest } from './router.js';\nimport { withCors, handleOptions } from './cors.js';\nimport config from '../config.json';\n\nexport default {\n  async fetch(request, env, ctx) {\n    if (request.method === 'OPTIONS') {\n      return handleOptions(request);\n    }\n    const response = await routeRequest(request, env, config);\n    return withCors(response);\n  },\n};\n`,
      },
      {
        path: 'src/router.js',
        contentType: 'application/javascript+module',
        content: `export async function routeRequest(request, env, config) {\n  const url = new URL(request.url);\n\n  if (url.pathname === '/health') {\n    return Response.json({ status: 'healthy', service: config.service });\n  }\n\n  if (url.pathname === '/api/info') {\n    return Response.json({\n      service: config.service,\n      version: config.version,\n      region: request.cf?.colo ?? 'edge',\n    });\n  }\n\n  return Response.json({ error: 'Not Found', path: url.pathname }, { status: 404 });\n}\n`,
      },
      {
        path: 'src/cors.js',
        contentType: 'application/javascript+module',
        content: `const CORS_HEADERS = {\n  'Access-Control-Allow-Origin': '*',\n  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',\n  'Access-Control-Allow-Headers': 'Content-Type, Authorization',\n};\n\nexport function handleOptions() {\n  return new Response(null, { status: 204, headers: CORS_HEADERS });\n}\n\nexport function withCors(response) {\n  const next = new Response(response.body, response);\n  for (const [key, value] of Object.entries(CORS_HEADERS)) {\n    next.headers.set(key, value);\n  }\n  return next;\n}\n`,
      },
      {
        path: 'config.json',
        contentType: 'application/json',
        content: `{\n  "service": "edge-api",\n  "version": "1.0.0"\n}\n`,
      },
    ],
  },
  {
    id: 'proxy',
    labelKey: 'worker_ide.tpl_proxy',
    descKey: 'worker_ide.tpl_proxy_desc',
    mainModule: 'index.js',
    files: [
      {
        path: 'index.js',
        contentType: 'application/javascript+module',
        content: `const UPSTREAM = 'https://httpbin.org';\n\nexport default {\n  async fetch(request) {\n    const url = new URL(request.url);\n    const target = new URL(url.pathname + url.search, UPSTREAM);\n    const proxied = new Request(target, request);\n    proxied.headers.set('X-Forwarded-Host', url.host);\n    return fetch(proxied);\n  },\n};\n`,
      },
    ],
  },
  {
    id: 'cron',
    labelKey: 'worker_ide.tpl_cron',
    descKey: 'worker_ide.tpl_cron_desc',
    mainModule: 'index.js',
    files: [
      {
        path: 'index.js',
        contentType: 'application/javascript+module',
        content: `export default {\n  async fetch() {\n    return new Response('Scheduled Worker active.');\n  },\n\n  async scheduled(controller, env, ctx) {\n    console.log('Cron triggered:', controller.cron, new Date().toISOString());\n  },\n};\n`,
      },
    ],
  },
  {
    id: 'blank',
    labelKey: 'worker_ide.tpl_blank',
    descKey: 'worker_ide.tpl_blank_desc',
    mainModule: 'index.js',
    files: [
      {
        path: 'index.js',
        contentType: 'application/javascript+module',
        content: `export default {\n  async fetch(request, env, ctx) {\n    return new Response('OK');\n  },\n};\n`,
      },
    ],
  },
];
