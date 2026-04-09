"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError("");
        const result = await signIn("credentials", {
            email, password, redirect: false,
        });
        console.log(result)
        if (result?.ok) {
            router.push("/");
        } else {
            setError("Invalid email or password");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M3 7h18M3 12h18M3 17h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Peppol Portal</h1>
                    <p className="text-sm text-gray-500 mt-1">KASA Advisory Service FZE</p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800 mb-6">Sign in to your account</h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                            <input
                                type="email" value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="admin@kasaadvisory.com"
                                required autoFocus
                                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                            <input
                                type="password" value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                {error}
                            </div>
                        )}
                        <button type="submit" disabled={loading}
                            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>
                    {/* <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 font-medium mb-1">Demo credentials</p>
            <p className="text-xs font-mono text-gray-600">admin@kasaadvisory.com</p>
            <p className="text-xs font-mono text-gray-600">Admin@2026</p>
          </div> */}
                </div>
                <div className="text-center mt-4 space-y-2">
                    <p className="text-xs text-gray-400">
                        New client?{" "}
                        <a href="/register" className="text-blue-600 hover:underline text-xs">Create account</a>
                    </p>
                    <p className="text-xs text-gray-400">UAE PINT-AE · Seat PAE001045 · OpenPeppol Certified</p>
                </div>
            </div>
        </div>
    );
}
