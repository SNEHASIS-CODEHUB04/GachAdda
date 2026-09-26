"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const schema = z.object({
  email:    z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

function LoginFormContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { error: showError } = useToast();
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (res?.error) {
      showError("Invalid email or password. Please try again.");
      return;
    }

    const callbackUrl = params.get("callbackUrl");
    router.push(callbackUrl ?? "/buyer/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-card-lg p-8 border border-[var(--border)]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-dark">Welcome back 🌿</h1>
          <p className="text-[var(--color-sage)] mt-1 text-sm">Sign in to your GachAdda account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            required
            {...register("email")}
          />

          <Input
            label="Password"
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            required
            rightAddon={
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"}>
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            {...register("password")}
          />



          <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-sage)]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md p-8 text-center text-[var(--color-sage)]">Loading...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
