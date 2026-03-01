"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@coinquest.app");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Ambient background effects */}
      <div className="fixed inset-0 bg-mmorpg-bg overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-mmorpg-accentBlue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-mmorpg-purple/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Shield className="text-mmorpg-gold" size={28} />
            <h1 className="font-pixel text-xl text-mmorpg-gold tracking-widest">
              COINQUEST
            </h1>
          </div>
          <p className="text-mmorpg-steel text-xs">
            Personal Finance — Malaysia Edition
          </p>
          <p className="text-mmorpg-steel/50 text-[10px] mt-1 font-pixel">
            v1.0 MVP
          </p>
        </div>

        {/* Login window */}
        <div className="game-window rounded-sm overflow-hidden">
          <div className="game-window-title px-4 py-2.5">
            <span className="font-pixel text-[9px] text-mmorpg-parchment tracking-widest uppercase">
              Sign In
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-pixel text-[8px] text-mmorpg-steel uppercase tracking-widest">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="game-input"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-pixel text-[8px] text-mmorpg-steel uppercase tracking-widest">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="game-input"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-[10px] text-mmorpg-dangerLight font-pixel">
                ⚠ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold py-3 rounded-sm w-full font-pixel text-[9px] uppercase tracking-widest"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <div className="text-center border-t border-mmorpg-border/40 pt-3">
              <p className="text-[9px] text-mmorpg-steel/70 mb-1">Try the demo account:</p>
              <p className="text-[9px] text-mmorpg-steel/60 font-pixel">
                demo@coinquest.app / demo1234
              </p>
            </div>

            <div className="text-center">
              <p className="font-pixel" style={{ fontSize: "9px", color: "#7a8ba8" }}>
                No account?{" "}
                <Link href="/signup" style={{ color: "#d4a017" }}>
                  Create one free
                </Link>
              </p>
            </div>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-[9px] text-mmorpg-steel/40">
            For expense tracking only — not financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}
