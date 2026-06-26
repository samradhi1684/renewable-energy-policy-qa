"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister() {
    try {
      const response = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail ?? "Registration failed");
        return;
      }

      await login(data.access_token);
      router.push("/");
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
  }

  return (
  <div
    style={{
      minHeight: "100vh",
      background: "#FAFAFA",
      padding: "14px",
      display: "flex",
      gap: "14px",
      fontFamily: "Inter, sans-serif",
    }}
  >
    {/* LEFT SECTION */}
    <div
      style={{
        width: "50%",
        background: "#FFFFFF",
        borderRadius: "28px",
        border: "1px solid #E5E7EB",
        padding: "50px 80px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          {/* PL circle */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "#111",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            PL
          </div>

          {/* text */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: 28,
                color: "#111827",
              }}
            >
              PolicyLens
            </span>

            <div
              style={{
                width: 1,
                height: 24,
                background: "#D1D5DB",
              }}
            />

            <span
              style={{
                color: "#6B7280",
                fontSize: 18,
              }}
            >
              Smarter Policy. Cleaner Future.
            </span>
          </div>
        </div>

        {/* progress */}
        <div
          style={{
            display: "flex",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 28,
              height: 4,
              background: "#4F46E5",
              borderRadius: 999,
            }}
          />
          <div
            style={{
              width: 28,
              height: 4,
              background: "#E5E7EB",
              borderRadius: 999,
            }}
          />
          <div
            style={{
              width: 28,
              height: 4,
              background: "#E5E7EB",
              borderRadius: 999,
            }}
          />
        </div>
      </div>

      {/* FORM SECTION */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: 620,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* welcome */}
        <p
          style={{
            color: "#4F46E5",
            fontSize: 24,
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          Welcome to PolicyLens 
        </p>

        {/* heading */}
        <h1
          style={{
            fontSize: 72,
            fontWeight: 700,
            marginBottom: 12,
            color: "#111827",
            lineHeight: 1.05,
          }}
        >
          Create Account
        </h1>

        <p
          style={{
            color: "#6B7280",
            fontSize: 24,
            marginBottom: 40,
          }}
        >
          Fill in your details to personalize your experience.
        </p>

        {/* FORM */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          {/* NAME */}
          <div>
            <label
              style={{
                fontSize: 16,
                marginBottom: 8,
                display: "block",
                fontWeight: 500,
              }}
            >
              Name *
            </label>

            <input
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              placeholder="Enter your Name"
              style={inputStyle}
            />
          </div>

          {/* EMAIL */}
          <div>
            <label
              style={{
                fontSize: 16,
                marginBottom: 8,
                display: "block",
                fontWeight: 500,
              }}
            >
              Email *
            </label>

            <input
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="Enter your email"
              style={inputStyle}
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label
              style={{
                fontSize: 16,
                marginBottom: 8,
                display: "block",
                fontWeight: 500,
              }}
            >
              Password *
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Create a password"
              style={inputStyle}
            />
          </div>

          {/* BUTTON */}
          <button
            onClick={handleRegister}
            style={{
              width: 340,
              height: 60,
              margin: "20px auto 0 auto",
              border: "none",
              borderRadius: 16,
              background: "#4F46E5",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            Create Account
          </button>

          {/* signin */}
          <p
            style={{
              textAlign: "center",
              fontSize: 16,
              marginTop: 12,
              color: "#6B7280",
            }}
          >
            Already have an account?{" "}
            <span
              onClick={() =>
                router.push("/login")
              }
              style={{
                color: "#4F46E5",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Sign in
            </span>
          </p>
        </div>
      </div>
    </div>

    {/* RIGHT IMAGE */}
    <div
      style={{
        width: "50%",
        position: "relative",
        borderRadius: 28,
        overflow: "hidden",
      }}
    >
      <img
        src="https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1600&q=80"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.45), transparent 55%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: 30,
          left: 0,
          right: 0,
          textAlign: "center",
          padding: "0 40px",
        }}
      >
        <p
          style={{
            color: "rgba(255,255,255,0.8)",
            fontSize: 13,
            maxWidth: 400,
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          PolicyLens is an informational tool only.
          Policy data is sourced from official
          government publications.
        </p>

        <p
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 12,
            marginTop: 8,
          }}
        >
          © 2026 PolicyLens. All rights reserved.
        </p>
      </div>
    </div>
  </div>
);
}

const inputStyle = {
  width: "100%",
  height: "62px",
  borderRadius: "999px",
  border: "1px solid #D1D5DB",
  padding: "0 24px",
  outline: "none",
  fontSize: "16px",
} as React.CSSProperties;