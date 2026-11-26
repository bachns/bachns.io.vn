import { getCollection, type CollectionEntry } from 'astro:content';

export const SITE = {
  title: 'bachns',
  tagline: 'Sysadmin · Linux · Observability · DevOps · Security',
  description: 'A personal blog about system administration, Linux, observability, DevOps, data platforms, security and cryptography.',
  author: 'bachns',
  avatar: '/images/avatar.jpg',
  name: 'Bach Nguyen',
  altName: 'Bách Nguyễn',
  position: 'Systems Administrator · Linux & Observability',
  location: 'Hanoi, Vietnam',
  bio: 'I run Linux infrastructure and observability platforms, and I love technology, books and tea. Here I write about security, system administration, Linux, programming and cryptography: practical notes from my own journey of learning and building.',
};

// Line icons (24x24, stroke = currentColor) so they follow the theme color.
const icon = (d: string) =>
  `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const CATEGORIES = {
  'sysadmin':      { name: 'Sysadmin',      icon: icon('<rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/><path d="M7 7h.01M7 17h.01"/>'), desc: 'System and network administration, server operations and automation.' },
  'linux':         { name: 'Linux',         icon: icon('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M12 15h5"/>'), desc: 'The kernel, the shell, command-line tooling and practical Linux administration.' },
  'observability': { name: 'Observability', icon: icon('<path d="M3 12h4l3-8 4 16 3-8h4"/>'), desc: 'Monitoring, metrics, logging and alerting with Prometheus, Grafana and the ELK Stack.' },
  'devops':        { name: 'DevOps',        icon: icon('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12L4 7.5M12 12v9"/>'), desc: 'DevOps practices, containers, Kubernetes and CI/CD.' },
  'data':          { name: 'Data',          icon: icon('<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>'), desc: 'Databases, Apache Kafka, ClickHouse and Big Data platforms.' },
  'security':      { name: 'Security',      icon: icon('<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z"/>'), desc: 'Information security, defensive practice and vulnerability analysis.' },
  'programming':   { name: 'Programming',   icon: icon('<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>'), desc: 'Python, C/C++, Go, Rust, web development and software engineering.' },
  'cryptography':  { name: 'Cryptography',  icon: icon('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>'), desc: 'Cryptographic primitives, protocols, hash functions, PKI and real-world applications.' },
  'tech':          { name: 'Tech',          icon: icon('<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>'), desc: 'News, trends and perspectives on technology.' },
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
