import type { Metadata } from 'next';
import './globals.css';

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
const siteUrl = isGitHubPages
  ? 'https://rzachaey-ctrl.github.io/kedu-todo'
  : 'https://kedu-todo.rhuan6963.chatgpt.site';
const socialImage = `${siteUrl}/og.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: '刻度 · 今日待办',
  description: '一个清爽、专注的个人待办事项工具。',
  openGraph: {
    title: '刻度 · 今日待办',
    description: '把今天，稳稳完成。',
    images: [socialImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: '刻度 · 今日待办',
    description: '把今天，稳稳完成。',
    images: [socialImage],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
