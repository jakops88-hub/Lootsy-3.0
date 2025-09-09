import '../styles/globals.css';
import { ReactNode } from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Lootsy – Sveriges bästa deals',
  description: 'Dagens Superdeal, Veckans topp 10 och tusentals erbjudanden.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sv">
      <body>
        <header className="border-b border-white/10">
          <div className="container py-5 flex items-center gap-4">
            <Link href="/" className="text-2xl font-black tracking-tight">
              Lootsy<span className="text-cyan-400">.se</span>
            </Link>
            <nav className="ml-auto flex gap-4 text-sm text-slate-300">
              <Link href="/?cat=Elektronik">Elektronik</Link>
              <Link href="/?cat=Mode">Mode</Link>
              <Link href="/?cat=Sport">Sport</Link>
              <Link href="/?cat=Hem">Hem</Link>
              <Link href="/?cat=Skönhet">Skönhet</Link>
              <Link href="/about">Om</Link>
              <Link href="/contact">Kontakt</Link>
            </nav>
          </div>
        </header>
        <main className="container py-8">{children}</main>
        <footer className="container py-10 text-sm text-slate-400 flex flex-wrap gap-4">
          <span>© {new Date().getFullYear()} Lootsy</span>
          <Link href="/privacy" className="hover:underline">Integritet</Link>
          <Link href="/about" className="hover:underline">Om oss</Link>
          <Link href="/contact" className="hover:underline">Kontakt</Link>
        </footer>
      </body>
    </html>
  );
}
