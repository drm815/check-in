"use client";

import { useState } from "react";
import { User, LogIn, ShieldCheck } from "lucide-react";
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
            const res = await fetch("/api/students");
            if (!res.ok) {
                const errorData = await res.json();
                alert(`서버 응답 오류: ${errorData.error || '알 수 없는 오류'}`);
                return;
            }

            const students = await res.json();
            const inputId = studentId.trim();
            const inputPass = password.trim();

            const student = students.find((s: any) =>
                String(s.id).trim() === inputId
            );

            if (student) {
                const correctPassword = String(student.password || student.id).trim();

                if (inputPass === correctPassword) {
                    sessionStorage.setItem("student_id", student.id);
                    sessionStorage.setItem("student_name", student.name);
                    sessionStorage.setItem("parent_email", student.parentemail);
                    router.push("/");
                } else {
                    alert("비밀번호가 일치하지 않습니다. (초기 비밀번호는 학번입니다)");
                }
            } else {
                alert(`등록되지 않은 학번(${inputId})입니다. 시트 정보를 확인하거나 선생님께 문의하세요.`);
            }
        } catch (error) {
            console.error(error);
            alert("연결 오류가 발생했습니다. 구글 앱 스크립트 배포 주소를 확인해 주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex-1 flex flex-col p-8 justify-center bg-white">
            <div className="flex flex-col items-center gap-4 mb-12">
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                    <ShieldCheck size={40} />
                </div>
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold tracking-tight">Class-Mates</h1>
                    <p className="text-gray-400 mt-1">우리 반 스마트 학교생활</p>
                </div>
            </div>

            <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleLogin}
                className="flex flex-col gap-5 max-w-sm mx-auto w-full"
            >
                <div className="flex items-center gap-4">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider w-12 shrink-0">학번</label>
                    <input
                        type="text"
                        required
                        placeholder="학번 (예: 20301)"
                        className="flex-1 p-4 rounded-2xl bg-white border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm text-gray-900"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-4">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider w-12 shrink-0">비번</label>
                    <input
                        type="password"
                        required
                        placeholder="비밀번호"
                        className="flex-1 p-4 rounded-2xl bg-white border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm text-gray-900"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button
                    disabled={isLoading}
                    className="w-1/2 self-center bg-indigo-600 text-white font-black py-4 rounded-2xl mt-4 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                    {isLoading ? "로그인 중..." : "시작하기"}
                </button>
            </motion.form>

            <div className="text-center mt-12 flex flex-col gap-4">

                <div className="h-px bg-gray-100 w-12 mx-auto my-2"></div>

                <Link
                    href="/admin"
                    className="text-gray-400 text-xs hover:text-indigo-600 transition-colors inline-flex items-center justify-center gap-1"
                >
                    <ShieldCheck size={12} />
                    교사용 관리 페이지 접속
                </Link>
            </div>
        </main>
    );
}
