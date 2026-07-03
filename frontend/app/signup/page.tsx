"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "../../components/authLayout";
import FormField from "../../components/formField";
import GoogleButton from "../../components/googleButton";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    // No auth backend exists yet — store locally so onboarding/chat can
    // read it, and move on. Replace with a real signup call once an
    // auth API is available.
    window.localStorage.setItem("policylens_user_name", name.trim());
    window.localStorage.setItem("policylens_user_email", email.trim());

    router.push("/onboarding");
  }

  return (
    <AuthLayout
        step={1}
        imageSrc="/images/signup.png"
        imageAlt="Solar panels"
    >
      <form onSubmit={handleCreateAccount} style={{ width: "100%" }}>
        <h1 style={{ fontSize: "30px", fontWeight: 700, margin: "0 0 8px", color: "var(--foreground)" }}>
          Create Account
        </h1>
        <p style={{ fontSize: "14px", color: "var(--placeholder-text)", margin: "0 0 28px" }}>
          Fill in your details to personalize your experience.
        </p>

        {error && (
          <p style={{ fontSize: "13px", color: "#e5484d", margin: "0 0 12px" }}>{error}</p>
        )}

        <FormField label="Name" required placeholder="Enter your Name" value={name} onChange={setName} />
        <FormField label="Email" type="email" required placeholder="Enter your email" value={email} onChange={setEmail} />
        <FormField label="Password" type="password" required placeholder="Create a password" value={password} onChange={setPassword} />

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
            marginTop: "4px",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--primary-hover)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--primary)")}
        >
          Create Account
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--input-border)" }} />
          <span style={{ fontSize: "12px", color: "var(--placeholder-text)" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "var(--input-border)" }} />
        </div>

        <GoogleButton onClick={() => router.push("/onboarding")} />

        <p style={{ textAlign: "center", fontSize: "13px", color: "var(--placeholder-text)", marginTop: "20px" }}>
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/signin")}
            style={{ border: "none", background: "none", padding: 0, color: "var(--primary)", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
          >
            Sign in
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}