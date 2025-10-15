"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Header() {
  const { data: session, status } = useSession();
  const user = session?.user as { name?: string | null; email?: string | null; image?: string | null } | undefined;
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-[#FF9933] text-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-xl md:text-2xl">🕉️</span>
          <Link href="/" className="text-lg md:text-2xl font-bold leading-none">
            Hindu Raksha Dal
          </Link>
        </div>
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center p-3 rounded-md hover:bg-white/10 active:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M4 6H20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M4 12H20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M4 18H20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <nav className="hidden md:flex items-center gap-4">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <Link href="/feed" className="hover:underline">
            Feed
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
      {open && (
        <div className="md:hidden border-t border-white/20">
          <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3">
            <Link href="/" className="hover:underline" onClick={() => setOpen(false)}>
              Home
            </Link>
            <Link href="/feed" className="hover:underline" onClick={() => setOpen(false)}>
              Feed
            </Link>
            <Link href="/posts" className="hover:underline" onClick={() => setOpen(false)}>
              Posts
            </Link>
            <Link href="/membership" className="hover:underline" onClick={() => setOpen(false)}>
              Membership
            </Link>
            <Link href="/search" className="hover:underline" onClick={() => setOpen(false)}>
              Search
            </Link>
            <Link href="/contact" className="hover:underline" onClick={() => setOpen(false)}>
              Contact
            </Link>
            <Link href="/admin" className="hover:underline" onClick={() => setOpen(false)}>
              Admin
            </Link>
            {status === "authenticated" ? (
              <div className="flex items-center gap-3 pt-2">
                <Link href="/profile" className="hover:underline" onClick={() => setOpen(false)}>
                  Profile
                </Link>
                <button
                  onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
                  className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 pt-2">
                <Link href="/login" className="hover:underline" onClick={() => setOpen(false)}>
                  Login
                </Link>
                <Link href="/register" className="bg-white text-[#FF9933] font-semibold px-3 py-1 rounded" onClick={() => setOpen(false)}>
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
