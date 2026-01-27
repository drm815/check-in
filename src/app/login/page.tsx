"use client";

import { useState } from "react";
import { User, LogIn, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
    const [studentId, setStudentId] = useState("");
    const [password, setPassword] = useState(""); // Default: last 4 digits of phone
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/students");
            if (res.ok) {
                const students = await res.json();
                const student = students.find((s: any) => s.id === studentId);

                if (student) {
                    // Store real info from Google Sheets
                    sessionStorage.setItem("student_id", student.id);
                    sessionStorage.setItem("student_name", student.name);
                    sessionStorage.setItem("parent_email", student.parentemail); // This field comes from GAS

                    router.push("/");
                } else {
                    alert("등록되지 않은 학번입니다. 선생님께 문의하세요.");
                }
            } else {
                alert("로그인 서버 오류가 발생했습니다.");
            }
        } catch (err) {
            console.error(err);
            alert("연결 오류가 발생했습니다.");
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
                    <label className="text-sm font-bold text-gray-700 ml-1">비밀번호 (초기: 부모님 전화번호 뒤 4자리)</label>
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

            <p className="text-center text-sm text-gray-400 mt-8">
                학번을 모르거나 로그인이 안 되나요? <br />
                <span className="text-indigo-600 font-bold underline">선생님께 문의하기</span>
            </p>
        </main>
    );
}
