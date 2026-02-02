"use client";

import { useState } from "react";
import { ShieldCheck, LogIn, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
    const [adminId, setAdminId] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simple admin check: admin / admin
        if (adminId === "admin" && adminPassword === "admin") {
            sessionStorage.setItem("admin_login", "true");
            router.push("/admin");
        } else {
            alert("관리자 정보가 일치하지 않습니다.");
            setIsLoading(false);
        }
    };

    return (
        <main className="flex-1 flex flex-col p-8 justify-center bg-slate-50 h-screen text-slate-900">
            <div className="flex flex-col items-center gap-4 mb-12">
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                    <ShieldCheck size={40} />
                </div>
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold tracking-tight">Admin Login</h1>
                    <p className="text-gray-400 mt-1 text-sm font-medium">관리자 전용 로그인 페이지입니다</p>
                </div>
            </div>

            <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleLogin}
                className="flex flex-col gap-4 max-w-sm mx-auto w-full bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
            >
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider">ID</label>
                    <input
                        type="text"
                        required
                        placeholder="Admin ID"
                        className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={adminId}
                        onChange={(e) => setAdminId(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider">Password</label>
                    <input
                        type="password"
                        required
                        placeholder="Password"
                        className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                    />
                </div>

                <button
                    disabled={isLoading}
                    className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl mt-4 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : <LogIn size={20} />}
                    로그인
                </button>
            </motion.form>
        </main>
    );
}
