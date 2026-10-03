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
    <html lang="en" className="dark">
      <body className="antialiased bg-[#090d16] text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
