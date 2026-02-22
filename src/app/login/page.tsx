"use client";

import { useState } from "react";
import { User, LogIn, School } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LoginPage() {
    const [studentId, setStudentId] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let deviceId = localStorage.getItem("unique_device_id");
            if (!deviceId) {
                deviceId = crypto.randomUUID();
                localStorage.setItem("unique_device_id", deviceId);
            }

            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId: studentId.trim(), password: password.trim(), deviceId }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "로그인에 실패했습니다.");
                return;
            }

            const student = data.student;

            // 기기 미등록 시 바인딩
            if (!student.deviceId || student.deviceId === "") {
                await fetch("/api/bind-device", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ studentId: student.id, deviceId }),
                });
            }

            sessionStorage.setItem("student_id", student.id);
            sessionStorage.setItem("student_name", student.name);
            sessionStorage.setItem("parent_email", student.parentemail);
            router.push("/");
        } catch (error) {
            console.error(error);
            alert("연결 오류가 발생했습니다. 구글 앱 스크립트 배포 주소를 확인해 주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-4 font-sans">
            <div className="w-[90%] max-w-[400px] flex flex-col items-center gap-10">
                {/* Logo & Title */}
                <div className="flex flex-col items-center gap-4 mt-5">
                    <div className="w-20 h-20 bg-[#FF4D8D] rounded-[1.8rem] flex items-center justify-center text-white shadow-xl shadow-pink-100">
                        <School size={44} />
                    </div>
                    <div className="text-center">
                        <h1 className="text-[1.8rem] font-[800] tracking-tight text-gray-900 leading-tight">Class-Mates</h1>
                        <p className="text-[#64748B] mt-1.5 font-medium text-sm">우리 반 스마트 학교생활</p>
                    </div>
                </div>

                {/* Minimalist Login Form */}
                <motion.form
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleLogin}
                    className="w-full flex flex-col gap-8 px-[30px]"
                >
                    <div className="flex flex-col gap-5">
                        <div className="space-y-2">
                            <label className="text-[11px] font-[700] text-[#FF4D8D] uppercase tracking-widest ml-4 opacity-80">Student ID</label>
                            <input
                                type="text"
                                required
                                placeholder="학번을 입력해주세요"
                                className="w-full h-[54px] pl-4 pr-4 rounded-[12px] bg-white border border-transparent focus:border-[#FF4D8D] focus:ring-4 focus:ring-pink-500/5 outline-none transition-all text-base text-gray-900 placeholder-gray-300 shadow-sm"
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-[700] text-[#FF4D8D] uppercase tracking-widest ml-4 opacity-80">Password</label>
                            <input
                                type="password"
                                required
                                placeholder="비밀번호를 입력해주세요"
                                className="w-full h-[54px] pl-4 pr-4 rounded-[12px] bg-white border border-transparent focus:border-[#FF4D8D] focus:ring-4 focus:ring-pink-500/5 outline-none transition-all text-base text-gray-900 placeholder-gray-300 shadow-sm"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <button
                            disabled={isLoading}
                            className="w-full h-[58px] bg-[#FFD600] text-[#191919] font-[800] rounded-[14px] hover:bg-[#FADA00] transition-all flex items-center justify-center gap-2 text-lg active:scale-[0.98] shadow-md shadow-yellow-200/50"
                        >
                            {isLoading ? "로그인 중..." : "로그인"}
                        </button>

                        <div className="flex items-center justify-center">
                            <button type="button" className="text-xs text-slate-400 hover:text-slate-600 font-semibold tracking-tight">사용자 가이드</button>
                        </div>
                    </div>
                </motion.form>

                {/* Admin Link at the Bottom */}
                <div className="mt-4 mb-5">
                    <Link
                        href="/admin"
                        className="px-5 py-2.5 bg-transparent border border-slate-200 rounded-full text-[#94A3B8] text-[0.9rem] font-medium hover:bg-slate-50 hover:text-slate-500 transition-all inline-flex items-center gap-2"
                    >
                        <School size={16} />
                        교사 전용 접속
                    </Link>
                </div>
            </div>
        </main>
    );
}
