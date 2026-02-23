"use client";

import { useState } from "react";
import { School, LogIn, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
    const [adminId, setAdminId] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: adminId, password: adminPassword }),
            });

            if (res.ok) {
                sessionStorage.setItem("admin_login", "true");
                sessionStorage.setItem("admin_id", adminId);
                router.push("/admin");
            } else {
                alert("관리자 정보가 일치하지 않습니다.");
            }
        } catch (err) {
            console.error(err);
            alert("서버 연결 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-4 font-sans text-slate-900">
            <div className="w-[90%] max-w-[400px] flex flex-col items-center gap-10">
                {/* Logo Section */}
                <div className="flex flex-col items-center gap-4 mt-5">
                    <div className="w-20 h-20 bg-[#FF4D8D] rounded-[1.8rem] flex items-center justify-center text-white shadow-xl shadow-pink-100">
                        <School size={44} />
                    </div>
                    <div className="text-center">
                        <h1 className="text-[1.8rem] font-[800] tracking-tight text-gray-900 leading-tight">Admin Login</h1>
                        <p className="text-[#64748B] mt-1.5 font-medium text-sm italic">관리자 전용 로그인 페이지</p>
                    </div>
                </div>

                {/* Minimalist Admin Login Form */}
                <motion.form
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleLogin}
                    className="w-full flex flex-col gap-8 px-[30px]"
                >
                    <div className="flex flex-col gap-5">
                        <div className="space-y-2">
                            <label className="text-[11px] font-[700] text-[#FF4D8D] uppercase tracking-widest ml-4 opacity-80">Admin ID</label>
                            <input
                                type="text"
                                required
                                placeholder="관리자 ID를 입력하세요"
                                className="w-full h-[54px] pl-4 pr-4 rounded-[12px] bg-white border border-transparent focus:border-[#FF4D8D] focus:ring-4 focus:ring-pink-500/5 outline-none transition-all text-base text-gray-900 placeholder-gray-300 shadow-sm"
                                value={adminId}
                                onChange={(e) => setAdminId(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-[700] text-[#FF4D8D] uppercase tracking-widest ml-4 opacity-80">Password</label>
                            <input
                                type="password"
                                required
                                placeholder="비밀번호를 입력하세요"
                                className="w-full h-[54px] pl-4 pr-4 rounded-[12px] bg-white border border-transparent focus:border-[#FF4D8D] focus:ring-4 focus:ring-pink-500/5 outline-none transition-all text-base text-gray-900 placeholder-gray-300 shadow-sm"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <button
                            disabled={isLoading}
                            className="w-full h-[58px] bg-[#FFD600] text-[#191919] font-[800] rounded-[14px] hover:bg-[#FADA00] transition-all flex items-center justify-center gap-2 text-lg active:scale-[0.98] shadow-md shadow-yellow-200/50"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <LogIn size={20} />}
                            로그인
                        </button>
                    </div>
                </motion.form>

                {/* Footer Section */}
                <div className="mt-4 mb-5 text-center px-6 py-2 rounded-full bg-white border border-slate-100 shadow-sm">
                    <p className="text-[10px] text-[#FF4D8D] uppercase tracking-[0.2em] font-[800]">Secure Admin Portal</p>
                </div>
            </div>
        </main>
    );
}
