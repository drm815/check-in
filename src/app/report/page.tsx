"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Send, AlertTriangle, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ReportPage() {
    const [type, setType] = useState<string>("absence");
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [studentInfo, setStudentInfo] = useState({ id: "", name: "", email: "" });

    useEffect(() => {
        const id = sessionStorage.getItem("student_id") || "";
        const name = sessionStorage.getItem("student_name") || "";
        const email = sessionStorage.getItem("parent_email") || "";
        setStudentInfo({ id, name, email });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const reportId = Math.random().toString(36).substr(2, 9);
        try {
            const response = await fetch("/api/report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentName: studentInfo.name,
                    type:
                        type === 'absence' ? '결석' :
                            type === 'late' ? '지각' :
                                type === 'leave' ? '조퇴' : '기타',
                    reason: reason,
                    parentEmail: studentInfo.email,
                    reportId: reportId,
                    studentId: studentInfo.id
                }),
            });
            if (response.ok) {
                setIsSuccess(true);
            } else {
                alert("전송 실패");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-6 bg-white">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center"
                >
                    <Send size={40} />
                </motion.div>
                <h2 className="text-2xl font-bold">전송 완료!</h2>
                <p className="text-gray-500">
                    신고 내용이 선생님께 전달되었습니다.<br />
                    <strong>부모님께 확인 링크가 자동으로 발송됩니다.</strong>
                </p>
                <Link href="/" className="btn-primary w-full max-w-xs mt-4">
                    홈으로 돌아가기
                </Link>
            </main>
        );
    }

    return (
        <main className="flex-1 flex flex-col bg-[#F8FAFC]">
            <div className="p-6 flex items-center gap-4 bg-white border-bottom border-gray-100">
                <Link href="/" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <ChevronLeft size={24} />
                </Link>
                <h2 className="text-lg font-bold">결석 / 지각 신고</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
                <section className="flex flex-col gap-3">
                    <label className="text-sm font-semibold text-gray-500 ml-1">신고 유형</label>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'absence', label: '결석', icon: <AlertTriangle size={18} /> },
                            { id: 'late', label: '지각', icon: <Clock size={18} /> },
                            { id: 'leave', label: '조퇴', icon: <MapPin size={18} /> },
                            { id: 'other', label: '기타', icon: <AlertTriangle size={18} /> }
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setType(item.id)}
                                className={`p-4 rounded-2xl flex items-center justify-center gap-3 border-2 transition-all ${type === item.id
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                                    : 'border-white bg-white text-gray-400'
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="flex flex-col gap-3">
                    <label className="text-sm font-semibold text-gray-500 ml-1">사유 입력</label>
                    <textarea
                        placeholder="사유를 입력해주세요 (예: 감기 몸살로 인한 병원 방문)"
                        className="w-full p-4 rounded-2xl border-none bg-white shadow-sm h-32 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                    />
                </section>

                <section className="premium-card bg-orange-50 border-orange-100 p-4">
                    <p className="text-xs text-orange-700 leading-relaxed">
                        ⚠️ 신고를 완료하면 등록된 <strong>학부모님 이메일</strong>로 확인 링크가 포함된 메일이 발송됩니다.
                        학부모님이 메일 내의 링크를 클릭하여 확인을 완료해야 최종 승인이 됩니다.
                    </p>
                </section>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary mt-2 py-4 text-lg disabled:opacity-50 w-1/2 mx-auto"
                >
                    {isSubmitting ? "전송 중..." : "신고하기"}
                </button>
            </form>
        </main>
    );
}
