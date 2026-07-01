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
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const result = await signInWithPassword(email, password);
      if (result && !result.ok) setError(result.error);
    } catch {
      // redirect throws
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const result = await signUp(email, password, displayName);

      if (!result) return;

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setMessage("登録が完了しました。ログインしてください。");
      setMode("login");
    } catch {
      // redirect throws
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-neutral-900">URL管理アプリ</h1>
        <p className="mt-1 text-sm text-neutral-500">REPLUSWORKS</p>
      </div>

      <div className="mb-6 flex rounded-lg bg-neutral-100 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError(null);
            setMessage(null);
          }}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === "login" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600"
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
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === "signup" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600"
          }`}
        >
          新規登録
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </div>
      )}

      {mode === "login" ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">メールアドレス</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">パスワード</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "ログイン中..." : "ログイン"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">表示名</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isSubmitting}
              placeholder="任意"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">メールアドレス</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">パスワード</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              minLength={6}
            />
            <p className="mt-1 text-xs text-neutral-500">6文字以上</p>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "登録中..." : "アカウント作成"}
          </Button>
          <p className="text-xs text-neutral-500">
            最初に登録したユーザーが管理者になります。
          </p>
        </form>
      )}
    </div>
  );
}
