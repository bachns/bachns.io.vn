import { getCollection, type CollectionEntry } from 'astro:content';

export const SITE = {
  title: 'bachns',
  tagline: 'Security · Sysadmin · Linux · Programming · Cryptography',
  description: 'A personal blog about information security, system administration, Linux, programming, cryptography and technology.',
  author: 'bachns',
  avatar: '/images/avatar.jpg',
  name: 'Bach Nguyen',
  altName: 'Bách Nguyễn',
  position: 'Developer · Security & Systems Enthusiast',
  location: 'Hanoi, Vietnam',
  bio: 'I love technology, books and coffee. I write about security, system administration, Linux, programming and cryptography - notes from my own journey of learning and building.',
};

export const CATEGORIES = {
  'security':     { name: 'Security',     icon: '🛡️', desc: 'Information security, defense, blue team and vulnerability analysis.' },
  'sysadmin':     { name: 'Sysadmin',     icon: '🖧', desc: 'System and network administration, servers, DevOps and automation.' },
  'linux':        { name: 'Linux',        icon: '🐧', desc: 'Kernel, shell, command-line tools and Linux tips.' },
  'programming':  { name: 'Programming',  icon: '⌨️', desc: 'Python, C/C++, Go, Rust, web development and software engineering.' },
  'cryptography': { name: 'Cryptography', icon: '🔐', desc: 'Cryptography, protocols, hash functions, PKI and real-world applications.' },
  'tech':         { name: 'Tech',         icon: '⚡', desc: 'News, trends and perspectives on technology.' },
} as const;
export type CategoryKey = keyof typeof CATEGORIES;

export async function getPosts(): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getCollection('blog', (p) => import.meta.env.DEV || !p.data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });

export const readingTime = (text: string) =>
  Math.max(1, Math.round(text.split(/\s+/).length / 200));
