'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-8 px-6 py-4 sm:px-10 lg:px-12">
        <Link
          href="/"
          className={`text-lg font-semibold transition ${
            isActive('/')
              ? 'text-slate-900'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          capstonehub
        </Link>
        <Link
          href="/projects"
          className={`text-sm font-medium transition ${
            isActive('/projects')
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          projects
        </Link>
      </div>
    </nav>
  );
}
