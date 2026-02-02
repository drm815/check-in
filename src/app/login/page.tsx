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
                    <h1 className="text-3xl font-extrabold tracking-tight">K-Mates</h1>
                    <p className="text-gray-400 mt-1">우리 반 스마트 학교생활</p>
                </div>
            </div>

            <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleLogin}
                className="flex flex-col gap-4"
            >
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">학번 (예: 20301)</label>
                    <input
                        type="text"
                        required
                        placeholder="학번을 입력하세요"
                        className="w-full p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">비밀번호 (초기: 학번 5자리)</label>
                    <input
                        type="password"
                        required
                        placeholder="비밀번호를 입력하세요"
                        className="w-full p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button
                    disabled={isLoading}
                    className="btn-primary mt-4 py-4 text-lg shadow-lg shadow-indigo-200"
                >
                    {isLoading ? "로그인 중..." : "시작하기"}
                </button>
            </motion.form>

            <div className="text-center mt-8 flex flex-col gap-4">
                <p className="text-sm text-gray-400">
                    학번을 모르거나 로그인이 안 되나요? <br />
                    <span className="text-indigo-600 font-bold underline">선생님께 문의하기</span>
                </p>

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
