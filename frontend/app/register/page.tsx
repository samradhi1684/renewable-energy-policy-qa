"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();

  const { login } = useAuth();

  const [email, setEmail] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  async function handleRegister() {
    try {
      const response =
        await fetch(
          "http://localhost:8000/auth/register",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              email,
              username,
              password,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.detail ??
          "Registration failed"
        );
        return;
      }

      await login(
        data.access_token
      );

      router.push("/");
    } catch (error) {
      console.error(error);
      alert(
        "Something went wrong"
      );
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow w-[400px]">
        <h1 className="text-2xl font-bold mb-6">
          Register
        </h1>

        <input
          placeholder="Email"
          className="border p-3 w-full mb-4 rounded"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          placeholder="Username"
          className="border p-3 w-full mb-4 rounded"
          value={username}
          onChange={(e) =>
            setUsername(
              e.target.value
            )
          }
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-3 w-full mb-4 rounded"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
        />

        <button
          onClick={handleRegister}
          className="bg-green-600 text-white w-full p-3 rounded"
        >
          Register
        </button>

        <button
          onClick={() =>
            router.push("/login")
          }
          className="border mt-3 w-full p-3 rounded"
        >
          Already have an account?
        </button>
      </div>
    </div>
  );
}