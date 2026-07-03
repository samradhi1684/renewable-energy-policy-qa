"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "../../components/authLayout";
import FormField from "../../components/formField";
import GoogleButton from "../../components/googleButton";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    // No auth backend exists yet — returning users skip onboarding and
    // go straight to chat. Replace with a real signin call once an auth
    // API is available.
    window.localStorage.setItem("policylens_user_email", email.trim());

    router.push("/chat");
  }

  return (
    <AuthLayout
        imageSrc="/images/signin.png"
        imageAlt="Wind farm"
    >
      <form onSubmit={handleSignIn} style={{ width: "100%" }}>
        <h1 style={{ fontSize: "30px", fontWeight: 700, margin: "0 0 8px", color: "var(--foreground)" }}>
          Welcome Back
        </h1>
        <p style={{ fontSize: "14px", color: "var(--placeholder-text)", margin: "0 0 28px" }}>
          Sign in to your PolicyLens account.
        </p>

        {error && (
          <p style={{ fontSize: "13px", color: "#e5484d", margin: "0 0 12px" }}>{error}</p>
        )}

        <FormField label="Email" type="email" required placeholder="Enter your email" value={email} onChange={setEmail} />
        <FormField
          label="Password"
          type="password"
          required
          placeholder="Create a password"
          value={password}
          onChange={setPassword}
          rightSlot={
            <button
              type="button"
              title="Password reset isn't available yet — no auth backend is wired up."
              onClick={() =>
                setError("Password reset isn't available yet — this build has no auth backend.")
              }
              style={{ border: "none", background: "none", padding: 0, color: "var(--primary)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
            >
              Forgot Password?
            </button>
          }
        />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "13px 16px",
            borderRadius: "12px",
            border: "none",
            background: "var(--primary)",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            marginTop: "16px",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--primary-hover)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--primary)")}
        >
          Sign In
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--input-border)" }} />
          <span style={{ fontSize: "12px", color: "var(--placeholder-text)" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "var(--input-border)" }} />
        </div>

        <GoogleButton onClick={() => router.push("/chat")} />

        <p style={{ textAlign: "center", fontSize: "13px", color: "var(--placeholder-text)", marginTop: "20px" }}>
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/signup")}
            style={{ border: "none", background: "none", padding: 0, color: "var(--primary)", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
          >
            Sign up
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}