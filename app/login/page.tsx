"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-[440px] shrink-0 flex-col justify-between p-12 border-r border-[#E5E7EB]"
        style={{ background: "#FAFAFA" }}
      >
        <span className="font-serif text-[22px] tracking-tight text-[#0A1628]">
          Markman
        </span>
        <div className="space-y-4">
          <p
            className="font-serif text-[40px] leading-[1.15] tracking-tight text-[#0A1628]"
            style={{ fontStyle: "italic", fontWeight: 500 }}
          >
            Protect what you&apos;ve built.
          </p>
          <p className="text-[15px] text-[#6B7280] leading-relaxed">
            Trademark portfolio management for founders and their attorneys.
          </p>
        </div>
        <p className="text-[12px] text-[#9CA3AF]">
          Not legal advice. Contact your attorney for guidance.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[360px] space-y-8">
          {/* Mobile wordmark */}
          <div className="lg:hidden">
            <span className="font-serif text-[22px] tracking-tight text-[#0A1628]">
              Markman
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-[22px] font-[600] text-[#0A1628] tracking-tight">
              Sign in
            </h1>
            <p className="text-[14px] text-[#6B7280]">
              Welcome back
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[13px] font-[500] text-[#374151]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] text-[#0A1628] bg-white
                  focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent
                  placeholder:text-[#9CA3AF] transition-shadow"
                placeholder="you@company.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[13px] font-[500] text-[#374151]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full h-10 px-3 border border-[#E5E7EB] rounded-md text-[14px] text-[#0A1628] bg-white
                  focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent
                  placeholder:text-[#9CA3AF] transition-shadow"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-md">
                <span className="text-[13px] text-[#DC2626]">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 px-4 bg-[#2563EB] hover:bg-blue-700 text-white text-[14px] font-[500]
                rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-[13px] text-[#6B7280]">
            Attorney?{" "}
            <Link
              href="/signup?type=attorney"
              className="text-[#2563EB] hover:underline font-[500]"
            >
              Create an attorney account &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
