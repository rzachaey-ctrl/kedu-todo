import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '刻度 · 今日待办',
  description: '一个清爽、专注的个人待办事项工具。',
  openGraph: {
    title: '刻度 · 今日待办',
    description: '把今天，稳稳完成。',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: '刻度 · 今日待办',
    description: '把今天，稳稳完成。',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
