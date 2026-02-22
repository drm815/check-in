"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Lock, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ChangePasswordPage() {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [studentId, setStudentId] = useState("");
    const router = useRouter();

    useEffect(() => {
        const id = sessionStorage.getItem("student_id");
        if (!id) {
            router.push("/login");
            return;
        }
        setStudentId(id);
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!/^\d{4}$/.test(newPassword)) {
            alert("비밀번호는 숫자 4자리로 입력해주세요.");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("새 비밀번호가 일치하지 않습니다.");
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/auth/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId,
                    oldPassword,
                    newPassword,
                })
            });

            const result = await res.json();
            if (result.result === "success") {
                setIsSuccess(true);
            } else {
                alert(result.message || "비밀번호 변경 실패");
            }
        } catch (err) {
            console.error(err);
            alert("오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-6 bg-white h-screen">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center"
                >
                    <CheckCircle2 size={40} />
                </motion.div>
                <h2 className="text-2xl font-bold">비밀번호 변경 완료!</h2>
                <p className="text-gray-500">
                    다음 로그인부터 새로운 비밀번호를 사용해주세요.
                </p>
                <Link href="/" className="btn-primary w-full max-w-xs mt-4">
                    홈으로 돌아가기
                </Link>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex flex-col items-center bg-[#F8FAFC] pt-[10px] font-sans text-slate-900 overflow-y-auto">
            <div className="w-[90%] max-w-[400px] flex flex-col pb-12 gap-[30px]">
                {/* Top Spacer */}
                <div className="h-[5px] shrink-0" />

                {/* Header */}
                <div className="flex items-center justify-between px-[30px]">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="p-2.5 bg-white hover:bg-gray-50 rounded-2xl transition-all shadow-sm border border-gray-100 flex items-center justify-center">
                            <ChevronLeft size={24} className="text-gray-700" />
                        </Link>
                        <h2 className="text-[28px] font-black text-gray-900 leading-none tracking-tight">비밀번호 변경</h2>
                    </div>
                    <LogoutButton className="bg-white rounded-full shadow-sm border border-gray-100" />
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-10 px-[30px]">
                    <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] flex gap-4 items-start shadow-sm">
                        <AlertCircle className="text-indigo-600 flex-shrink-0 mt-1" size={22} />
                        <p className="text-[14px] text-indigo-700 leading-relaxed font-semibold">
                            보안을 위해 초기 비밀번호를 <strong>숫자 4자리</strong>로 변경해 주세요.
                        </p>
                    </div>

                    <div className="flex flex-col gap-8">
                        <div className="space-y-3">
                            <label className="text-[14px] font-[800] text-[#FF4D8D] uppercase tracking-widest ml-5 opacity-90">현재 비밀번호</label>
                            <input
                                type="password"
                                maxLength={4}
                                required
                                placeholder="현재 비밀번호 입력"
                                className="w-full h-[64px] rounded-2xl bg-white border-2 border-gray-100 focus:border-[#FF4D8D]/30 focus:ring-4 focus:ring-[#FF4D8D]/5 outline-none transition-all text-center text-2xl font-bold tracking-[0.8em] shadow-sm text-gray-900 placeholder:text-gray-200 placeholder:tracking-normal placeholder:text-base px-6"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[14px] font-[800] text-[#FF4D8D] uppercase tracking-widest ml-5 opacity-90">새 비밀번호</label>
                            <input
                                type="password"
                                maxLength={4}
                                required
                                placeholder="숫자 4자리 입력"
                                className="w-full h-[64px] rounded-2xl bg-white border-2 border-gray-100 focus:border-[#FF4D8D]/30 focus:ring-4 focus:ring-[#FF4D8D]/5 outline-none transition-all text-center text-2xl font-bold tracking-[0.8em] shadow-sm text-gray-900 placeholder:text-gray-200 placeholder:tracking-normal placeholder:text-base px-6"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[14px] font-[800] text-[#FF4D8D] uppercase tracking-widest ml-5 opacity-90">비밀번호 확인</label>
                            <input
                                type="password"
                                maxLength={4}
                                required
                                placeholder="한 번 더 입력"
                                className="w-full h-[64px] rounded-2xl bg-white border-2 border-gray-100 focus:border-[#FF4D8D]/30 focus:ring-4 focus:ring-[#FF4D8D]/5 outline-none transition-all text-center text-2xl font-bold tracking-[0.8em] shadow-sm text-gray-900 placeholder:text-gray-200 placeholder:tracking-normal placeholder:text-base px-6"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col items-center mt-2 pb-12">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full h-[68px] bg-[#FFD600] text-[#191919] font-[900] rounded-[24px] transition-all flex items-center justify-center gap-3 text-xl active:scale-[0.98] shadow-[0_15px_35px_-10px_rgba(255,214,0,0.6)] ${isSubmitting ? 'opacity-70' : 'hover:scale-[1.02]'}`}
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin" size={26} />
                            ) : (
                                <>
                                    <Lock size={24} />
                                    비밀번호 변경하기
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
