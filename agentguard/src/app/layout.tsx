import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgentGuard — Visual Workbench for GitAgent',
  description: 'Inspect, test, version, and safely rollback AI agent behavior powered by GitAgent.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
