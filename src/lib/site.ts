import { getCollection, type CollectionEntry } from 'astro:content';

export const SITE = {
  title: 'bachns',
  tagline: 'Bảo mật · Hacking · Sysadmin · Linux · Lập trình · Mật mã',
  description: 'Blog cá nhân về bảo mật thông tin, hacking, quản trị hệ thống, Linux, lập trình, mật mã và công nghệ.',
  author: 'bachns',
  github: 'https://github.com/bachns',
};

export const CATEGORIES = {
  'bao-mat':   { name: 'Bảo mật',   icon: '🛡️', desc: 'An toàn thông tin, phòng thủ, blue team, phân tích lỗ hổng.' },
  'hacking':   { name: 'Hacking',   icon: '💀', desc: 'Pentest, red team, CTF, khai thác lỗ hổng (phục vụ học tập).' },
  'sysadmin':  { name: 'Sysadmin',  icon: '🖧', desc: 'Quản trị hệ thống, mạng, server, DevOps, tự động hoá.' },
  'linux':     { name: 'Linux',     icon: '🐧', desc: 'Kernel, shell, công cụ dòng lệnh, mẹo vặt Linux.' },
  'lap-trinh': { name: 'Lập trình', icon: '⌨️', desc: 'Python, C/C++, Go, Rust, Web và kỹ thuật phần mềm.' },
  'mat-ma':    { name: 'Mật mã',    icon: '🔐', desc: 'Mật mã học, giao thức, hàm băm, PKI, ứng dụng thực tế.' },
  'cong-nghe': { name: 'Công nghệ', icon: '⚡', desc: 'Tin tức, xu hướng và góc nhìn về công nghệ.' },
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
  d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });

export const readingTime = (text: string) =>
  Math.max(1, Math.round(text.split(/\s+/).length / 200));
