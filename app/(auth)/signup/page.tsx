"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Swords } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    // Auto sign-in after successful registration
    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInRes?.error) {
      setError("Account created but sign-in failed. Please log in.");
      router.push("/login");
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

        {/* Sign up window */}
        <div className="game-window rounded-sm overflow-hidden">
          <div className="game-window-title px-4 py-2.5">
            <span className="font-pixel text-[9px] text-mmorpg-parchment tracking-widest uppercase">
              <Swords className="inline-block mr-1" size={10} />
              Create Adventurer
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-pixel text-[8px] text-mmorpg-steel uppercase tracking-widest">
                Adventurer Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="game-input"
                placeholder="Sir Richpocket"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-pixel text-[8px] text-mmorpg-steel uppercase tracking-widest">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="game-input"
                placeholder="hero@example.com"
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

            <div className="flex flex-col gap-1">
              <label className="font-pixel text-[8px] text-mmorpg-steel uppercase tracking-widest">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? "Creating Account..." : "⚔ Start Adventure"}
            </button>

            <div className="text-center">
              <p className="text-[9px] text-mmorpg-steel/60 font-pixel">
                Already an adventurer?{" "}
                <Link
                  href="/login"
                  className="text-mmorpg-gold hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-[9px] text-mmorpg-steel/40">
            ⚔ This app is for tracking only, not financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}
