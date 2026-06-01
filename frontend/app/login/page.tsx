"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { user, login } = useAuth();

  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  async function handleLogin() {
    try {
      const form =
        new URLSearchParams();

      form.append(
        "username",
        email
      );

      form.append(
        "password",
        password
      );

      const response =
        await fetch(
          "http://localhost:8000/auth/login",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded",
            },
            body: form,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.detail ??
          "Login failed"
        );
        return;
      }

      await login(
        data.access_token
      );

      router.push("/");
    } catch (error) {
      console.error(error);
    }
    }
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-[400px] border rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">
          Login
        </h1>

        {user && (
          <p className="mb-4">
            Logged in as:
            {" "}
            {user.email}
          </p>
        )}

        <input
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          className="border p-3 w-full mb-4 rounded"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          className="border p-3 w-full mb-4 rounded"
        />

        <button
          onClick={handleLogin}
          className="border px-4 py-2 rounded w-full"
        >
          Login
        </button>
      </div>
    </div>
  );
}