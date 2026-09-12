"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const schema = z
  .object({
    name:     z.string().trim().min(2, "Name must be at least 2 characters"),
    email:    z.string().trim().email("Enter a valid email"),
    phone:    z.string().trim().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role:     z.enum(["BUYER", "SELLER"]),
    shopName: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "SELLER" && (!data.shopName || data.shopName.trim().length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Shop name must be at least 2 characters",
        path: ["shopName"],
      });
    }
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "BUYER", name: "", email: "", phone: "", password: "", shopName: "" },
  });

  async function onSubmit(data: FormData) {
    const payload = {
      name:     data.name.trim(),
      email:    data.email.trim().toLowerCase(),
      phone:    data.phone?.trim() && data.phone.trim().length > 0 ? data.phone.trim() : null,
      password: data.password,
      role:     "BUYER" as const,
    };

    const res = await fetch("/api/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const json = await res.json();

    if (!res.ok) {
      showError(json.error ?? "Registration failed. Please try again.");
      return;
    }

    success("Account created! Signing you in…");

    const signInRes = await signIn("credentials", {
      email:    payload.email,
      password: payload.password,
      redirect: false,
    });

    if (signInRes?.error) {
      router.push("/login");
      return;
    }

    router.push("/buyer/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white rounded-2xl shadow-card-lg p-8 border border-[var(--border)]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-dark">Join GachAdda 🌱</h1>
          <p className="text-[var(--color-sage)] mt-1 text-sm">Create your buyer account and start shopping</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <input type="hidden" value="BUYER" {...register("role")} />

          <Input
            label="Full Name"
            placeholder="Ananya Chakraborty"
            autoComplete="name"
            error={errors.name?.message}
            required
            {...register("name")}
          />
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
            label="Mobile Number"
            type="tel"
            placeholder="98765 43210"
            autoComplete="tel"
            error={errors.phone?.message}
            {...register("phone")}
          />

          <Input
            label="Password"
            type={showPw ? "text" : "password"}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            error={errors.password?.message}
            required
            rightAddon={
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            {...register("password")}
          />

          <p className="text-xs text-[var(--color-sage)]">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline">Terms</Link>{" "}&{" "}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>

          <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
            Create Account
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--color-sage)]">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
