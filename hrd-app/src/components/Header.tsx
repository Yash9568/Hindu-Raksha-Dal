"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();
  const user = session?.user as { name?: string | null; email?: string | null; image?: string | null } | undefined;
  

  return (
    <header className="bg-[#FF9933] text-white">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span aria-hidden className="text-2xl">🕉️</span>
          <Link href="/" className="text-2xl font-bold">
            Hindu Raksha Dal
          </Link>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <Link href="/posts" className="hover:underline">
            Posts
          </Link>
          <Link href="/membership" className="hover:underline">
            Membership
          </Link>
          <Link href="/search" className="hover:underline">
            Search
          </Link>
          <Link href="/contact" className="hover:underline">
            Contact
          </Link>
          <Link href="/admin" className="hover:underline">
            Admin
          </Link>
          {status === "authenticated" ? (
            <>
              <span className="hidden sm:inline text-sm opacity-90">{user?.name || user?.email}</span>
              <Link href="/profile" className="hover:underline">
                Profile
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                Login
              </Link>
              <Link href="/register" className="bg-white text-[#FF9933] font-semibold px-3 py-1 rounded">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
