import { Droplets } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header with logo */}
      <header className="p-4">
        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
          <Droplets className="h-8 w-8" />
          <span className="text-xl font-bold">AgroWater</span>
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>&copy; {new Date().getFullYear()} AgroWater. Wszelkie prawa zastrzezone.</p>
      </footer>
    </div>
  );
}
