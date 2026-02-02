"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Lock, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
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

        if (newPassword.length !== 4 || isNaN(Number(newPassword))) {
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
                    studentId: studentId,
                    newPassword: newPassword
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
        <main className="flex-1 flex flex-col bg-[#F8FAFC] min-h-screen text-slate-900">
            <div className="p-6 flex items-center gap-4 bg-white border-b border-gray-100">
                <Link href="/" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <ChevronLeft size={24} />
                </Link>
                <h2 className="text-lg font-bold">비밀번호 변경</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 max-w-md mx-auto w-full">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex gap-3">
                    <AlertCircle className="text-indigo-600 flex-shrink-0" size={20} />
                    <p className="text-xs text-indigo-700 leading-relaxed">
                        보안을 위해 초기 비밀번호(학번)를 <strong>숫자 4자리</strong>로 변경하는 것을 권장합니다.
                    </p>
                </div>

                <section className="flex flex-col gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-500 ml-1">새 비밀번호 (숫자 4자리)</label>
                        <input
                            type="password"
                            maxLength={4}
                            required
                            placeholder="****"
                            className="w-full p-4 rounded-2xl bg-white border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-center text-2xl tracking-[1em]"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-500 ml-1">새 비밀번호 확인</label>
                        <input
                            type="password"
                            maxLength={4}
                            required
                            placeholder="****"
                            className="w-full p-4 rounded-2xl bg-white border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-center text-2xl tracking-[1em]"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </section>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary mt-4 py-4 text-lg disabled:bg-gray-400 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                >
                    {isSubmitting ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <>
                            <Lock size={20} />
                            비밀번호 변경하기
                        </>
                    )}
                </button>
            </form>
        </main>
    );
}
