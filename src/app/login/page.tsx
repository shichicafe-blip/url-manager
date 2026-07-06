import { AuthForm } from "@/components/auth/AuthForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ログイン | URL管理アプリ",
  description: "URL管理アプリにログイン",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-100 px-4 py-8 pb-safe">
      <AuthForm />
    </div>
  );
}
