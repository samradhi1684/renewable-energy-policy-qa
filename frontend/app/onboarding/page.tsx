"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "../../components/authLayout";
import FormField from "../../components/formField";
import RoleSelector from "../../components/roleSelector";

const DEFAULT_ROLE = "Citizen";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [role, setRole] = useState(DEFAULT_ROLE);

  // Pre-fill the name if it was captured on the signup screen.
  useEffect(() => {
    const savedName = window.localStorage.getItem("policylens_user_name");
    if (savedName) setName(savedName);
  }, []);

  function handleContinue() {
    window.localStorage.setItem("policylens_user_name", name.trim() || "Guest");
    window.localStorage.setItem("policylens_user_role", role);
    router.push("/chat");
  }

  return (
    <AuthLayout
        step={2}
        showBack
        onBack={() => router.push("/signup")}
        imageSrc="/images/onboarding.png"
        imageAlt="Renewable landscape"
    >
      <div style={{ width: "100%" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, margin: "0 0 8px", color: "var(--foreground)" }}>
          What do we call you?
        </h1>
        <p style={{ fontSize: "14px", color: "var(--placeholder-text)", margin: "0 0 24px" }}>
          Personalize your PolicyLens experience.
        </p>

        <FormField label="Your name" placeholder="Your name" value={name} onChange={setName} />

        <div style={{ marginTop: "8px", marginBottom: "24px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--placeholder-text)", margin: "0 0 10px" }}>
            Your Role
          </p>
          <RoleSelector value={role} onChange={setRole} />
        </div>

        <button
          type="button"
          onClick={handleContinue}
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
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--primary-hover)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--primary)")}
        >
          Continue
        </button>
      </div>
    </AuthLayout>
  );
}