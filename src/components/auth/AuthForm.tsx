"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signInWithPassword, signUp } from "@/features/auth/actions";
import { useState } from "react";

type AuthMode = "login" | "signup";

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const result = await signInWithPassword(email, password);
      if (!result.ok) setError(result.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const result = await signUp(email, password);
      if (!result.ok) {
        setError(result.error);
      } else {
        setMessage("登録が完了しました。ログインしています...");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full rounded-3xl bg-white/80 p-6 shadow-sm backdrop-blur-xl sm:p-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-[72px] w-[72px] items-center justify-center rounded-[18px] bg-[#007aff] text-3xl font-bold text-white ios-icon-shadow">
          R
        </div>
        <h1 className="text-[22px] font-bold text-[#1c1c1e]">REPLUSWORKS</h1>
        <p className="mt-1 text-[15px] text-[#8e8e93]">会社専用ホーム画面</p>
      </div>

      <div className="mb-6 flex rounded-xl bg-[#767680]/12 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError(null);
            setMessage(null);
          }}
          className={`flex-1 rounded-lg py-2.5 text-[15px] font-medium transition-colors ${
            mode === "login" ? "bg-white text-[#1c1c1e] shadow-sm" : "text-[#8e8e93]"
          }`}
        >
          ログイン
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError(null);
            setMessage(null);
          }}
          className={`flex-1 rounded-lg py-2.5 text-[15px] font-medium transition-colors ${
            mode === "signup" ? "bg-white text-[#1c1c1e] shadow-sm" : "text-[#8e8e93]"
          }`}
        >
          新規登録
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {message && (
        <div className="mb-4 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div>
      )}

      {mode === "login" ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#8e8e93]">メールアドレス</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isSubmitting} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#8e8e93]">パスワード</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isSubmitting} />
          </div>
          <Button type="submit" className="h-12 w-full rounded-xl bg-[#007aff] text-[17px] hover:bg-[#007aff]/90" disabled={isSubmitting}>
            {isSubmitting ? "ログイン中..." : "ログイン"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#8e8e93]">メールアドレス</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isSubmitting} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#8e8e93]">パスワード</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} disabled={isSubmitting} />
          </div>
          <Button type="submit" className="h-12 w-full rounded-xl bg-[#007aff] text-[17px] hover:bg-[#007aff]/90" disabled={isSubmitting}>
            {isSubmitting ? "登録中..." : "新規登録"}
          </Button>
        </form>
      )}
    </div>
  );
}
