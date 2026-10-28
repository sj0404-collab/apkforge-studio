export type FileMap = Record<string, string>;

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: TreeNode[];
}

export function listPaths(files: FileMap): string[] {
  return Object.keys(files).sort();
}

export function buildTree(files: FileMap, root = ''): TreeNode[] {
  const rootNode: TreeNode = { name: root || 'root', path: root, type: 'dir', children: [] };
  const dirs = new Map<string, TreeNode>();
  dirs.set('', rootNode);

  const ensureDir = (path: string): TreeNode => {
    if (dirs.has(path)) return dirs.get(path)!;
    const parent = ensureDir(path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '');
    const node: TreeNode = {
      name: path.slice(path.lastIndexOf('/') + 1),
      path,
      type: 'dir',
      children: [],
    };
    parent.children!.push(node);
    dirs.set(path, node);
    return node;
  };

  for (const path of Object.keys(files).sort()) {
    const idx = path.lastIndexOf('/');
    const dir = idx >= 0 ? path.slice(0, idx) : '';
    const parent = ensureDir(dir);
    parent.children!.push({ name: path.slice(idx + 1), path, type: 'file' });
  }

  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => {
      if (n.children) sort(n.children);
    });
  };
  sort(rootNode.children!);
  return rootNode.children!;
}

export function fileName(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1);
}

export function dirName(path: string): string {
  const idx = path.lastIndexOf('/');
  return idx < 0 ? '' : path.slice(0, idx);
}

export function joinPath(...parts: string[]): string {
  return parts
    .filter(Boolean)
    .join('/')
    .replace(/\/+/g, '/')
    .replace(/^\//, '');
}

export function languageFor(path: string): string {
  const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
  if (path.endsWith('.kts')) return 'kotlin';
  switch (ext) {
    case 'kt':
    case 'kts':
      return 'kotlin';
    case 'java':
      return 'java';
    case 'js':
    case 'mjs':
      return 'javascript';
    case 'ts':
      return 'typescript';
    case 'json':
      return 'json';
    case 'xml':
      return 'xml';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'md':
      return 'markdown';
    case 'yml':
    case 'yaml':
      return 'yaml';
    case 'sh':
      return 'shell';
    case 'properties':
      return 'ini';
    default:
      return 'plaintext';
  }
}

export function countLines(text: string): number {
  return text.split('\n').length;
}

export const FILE_ICONS: Record<string, string> = {
  kt: 'K',
  kts: 'K',
  java: 'J',
  js: 'JS',
  json: '{}',
  xml: 'X',
  html: '<>',
  css: '#',
  md: 'M',
  properties: 'P',
  yaml: 'Y',
  yml: 'Y',
  gradle: 'G',
  png: 'IMG',
};
