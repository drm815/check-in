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
            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-6 bg-white h-screen">
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
        <main className="min-h-screen flex flex-col items-center bg-[#F8FAFC] p-4 pt-[80px] font-sans text-slate-900">
            <div className="w-[90%] max-w-[400px] flex flex-col pb-12 gap-[60px] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center gap-3 px-[30px]">
                    <Link href="/" className="p-2.5 bg-white hover:bg-gray-50 rounded-2xl transition-all shadow-sm border border-gray-100 flex items-center justify-center">
                        <ChevronLeft size={24} className="text-gray-700" />
                    </Link>
                    <h2 className="text-[28px] font-black text-gray-900 leading-none tracking-tight">결석 / 지각 신고</h2>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-10 px-[30px]">
                    <section className="flex flex-col gap-4">
                        <label className="text-[14px] font-[800] text-[#FF4D8D] uppercase tracking-widest ml-5 opacity-90">신고 유형 선택</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'absence', label: '결석', icon: <AlertTriangle size={20} /> },
                                { id: 'late', label: '지각', icon: <Clock size={20} /> },
                                { id: 'leave', label: '조퇴', icon: <MapPin size={20} /> },
                                { id: 'other', label: '기타', icon: <AlertTriangle size={20} /> }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setType(item.id)}
                                    className={`p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 border-2 transition-all shadow-sm ${type === item.id
                                        ? 'border-[#FF4D8D] bg-pink-50/40 text-[#FF4D8D] font-black'
                                        : 'border-white bg-white text-gray-400 font-bold hover:border-pink-100'
                                        }`}
                                >
                                    {item.icon}
                                    <span className="text-base tracking-tight">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="flex flex-col gap-4">
                        <label className="text-[14px] font-[800] text-[#FF4D8D] uppercase tracking-widest ml-5 opacity-90">상세 사유 입력</label>
                        <textarea
                            placeholder="사유를 입력해주세요 (예: 감기 몸살로 인한 병원 방문)"
                            className="w-full pl-10 pr-8 py-8 rounded-[2.5rem] border-2 border-gray-100 bg-white shadow-sm h-48 resize-none focus:border-[#FF4D8D]/30 focus:ring-4 focus:ring-pink-500/5 outline-none text-[16px] text-gray-900 font-semibold placeholder-gray-300 leading-relaxed"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        />
                    </section>

                    <div className="p-6 bg-orange-50 rounded-[2rem] border border-orange-100 shadow-sm">
                        <p className="text-[13px] text-orange-700 leading-relaxed font-semibold">
                            ⚠️ 신고를 완료하면 학부모님 이메일로 확인 링크가 전송됩니다. 부모님의 최종 확인이 필요합니다.
                        </p>
                    </div>

                    <div className="flex flex-col items-center mt-4 pb-12">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full h-[68px] bg-[#FFD600] text-[#191919] font-[900] rounded-[24px] transition-all flex items-center justify-center gap-3 text-xl active:scale-[0.98] shadow-[0_15px_35px_-10px_rgba(255,214,0,0.6)] ${isSubmitting ? 'opacity-70' : 'hover:scale-[1.02]'}`}
                        >
                            {isSubmitting ? "전송 중..." : "신고하기"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
