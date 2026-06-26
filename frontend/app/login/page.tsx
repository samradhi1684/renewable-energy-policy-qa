"use client";

import Link from "next/link";
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
    <div className="min-h-screen bg-[#f8f8f8] p-4 md:p-6">

      <div className="flex h-[95vh] rounded-[28px] overflow-hidden gap-4">

        {/* LEFT SECTION */}
        <div className="w-1/2 bg-white rounded-[28px] border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.06)] px-20 py-10 relative flex flex-col">

          {/* HEADER */}
          <div className="flex items-center justify-between">

            {/* BRAND */}
            <div className="flex items-center gap-4">

              <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-semibold text-sm">
                PL
              </div>

              <div>
                <p className="text-lg font-semibold text-gray-900">
                  PolicyLens
                </p>

                <p className="text-sm text-gray-400">
                  Renewable Policy Intelligence
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="flex gap-2">
              <div className="w-7 h-1 rounded-full bg-indigo-500" />
              <div className="w-7 h-1 rounded-full bg-gray-200" />
              <div className="w-7 h-1 rounded-full bg-gray-200" />
            </div>
          </div>

          {/* FORM SECTION */}
          <div className="flex flex-col justify-center flex-1 max-w-[520px] mx-auto w-full -mt-20">

            {/* TOP TEXT */}
            <p className="text-indigo-500 font-semibold text-xl mb-4">
              Welcome back
            </p>

            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Sign In
            </h1>

            <p className="text-gray-500 text-lg mb-10">
              Continue your renewable policy research journey.
            </p>

            {user && (
              <p className="mb-6 text-gray-500">
                Logged in as {user.email}
              </p>
            )}

            {/* EMAIL */}
            <label className="text-sm font-medium mb-2">
              Email
            </label>

            <input
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              className="h-14 rounded-full border border-gray-300 px-6 text-sm mb-5 outline-none focus:border-indigo-500"
            />

            {/* PASSWORD */}
            <label className="text-sm font-medium mb-2">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              className="h-14 rounded-full border border-gray-300 px-6 text-sm outline-none focus:border-indigo-500"
            />

            {/* FORGOT */}
            <div className="text-right mt-3 mb-8">

              <button className="text-sm text-indigo-600 hover:underline">
                Forgot Password?
              </button>

            </div>

            {/* LOGIN BUTTON */}
            <button
              onClick={handleLogin}
              className="bg-indigo-600 hover:bg-indigo-700 transition text-white font-semibold rounded-2xl h-14 w-[280px] text-lg mx-auto"
            >
              Sign In
            </button>

            {/* SIGN UP */}
            <p className="text-center text-gray-500 mt-8">

              Don’t have an account?{" "}

              <Link
                href="/register"
                className="text-indigo-600 font-semibold"
              >
                Create account
              </Link>

            </p>
          </div>
        </div>

        {/* RIGHT IMAGE */}
        <div className="w-1/2 relative rounded-[28px] overflow-hidden">

          <img
            src="/login.jpg"
            alt="renewable energy"
            className="w-full h-full object-cover"
          />

          {/* OVERLAY */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {/* TEXT */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-white max-w-[500px]">

            <p className="text-sm opacity-90 leading-relaxed">
              Explore renewable energy policies,
              incentives, EV programs and federal
              climate initiatives powered by trusted data.
            </p>

            <p className="mt-4 text-sm opacity-80">
              © 2026 PolicyLens. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}