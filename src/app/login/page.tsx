import { AuthForm } from "@/components/auth/AuthForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ログイン | URL管理アプリ",
};

export default function LoginPage() {
  return (
    <div className="ios-wallpaper mx-auto flex min-h-dvh w-full max-w-md items-center justify-center px-4 py-8 pb-safe">
      <AuthForm />
    </div>
  );
}
