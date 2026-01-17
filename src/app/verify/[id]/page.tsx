"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, ShieldCheck, HeartPulse } from "lucide-react";
import { motion } from "framer-motion";

export default function VerifyPage({ params }: { params: { id: string } }) {
    const [status, setStatus] = useState<"pending" | "confirmed" | "rejected">("pending");

    if (status === "confirmed") {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white h-screen">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={48} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">확인이 완료되었습니다</h2>
                <p className="text-gray-500 mt-2">담임 선생님께 확인 알림이 전달되었습니다. 감사합니다.</p>
            </div>
        );
    }

    return (
        <main className="flex-1 flex flex-col bg-slate-50 min-h-screen p-6">
            <div className="flex flex-col items-center gap-2 mb-8 mt-12">
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg mb-2">
                    <ShieldCheck size={32} />
                </div>
                <h1 className="text-xl font-bold">K-Mates 학부모 확인</h1>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="premium-card bg-white p-6 mb-6"
            >
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        <HeartPulse size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">결석 및 지각 신고 확인</h3>
                        <p className="text-xs text-gray-400">신청 코드: {params.id}</p>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">학생 성명</span>
                        <span className="font-semibold">홍길동 (2학년 3반)</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">신고 유형</span>
                        <span className="font-semibold text-orange-600">지각 (병원 방문)</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">신청 일시</span>
                        <span className="font-semibold">2026.01.17 08:35</span>
                    </div>
                    <div className="flex flex-col gap-1 pt-2">
                        <span className="text-gray-500 text-sm">사유 내용</span>
                        <p className="bg-slate-50 p-3 rounded-lg text-sm text-gray-700">
                            열이 많이 나서 아침 일찍 소아과에 들렀다 가려고 합니다. 9시 30분 전까지는 학교에 도착할 예정입니다.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => setStatus("confirmed")}
                        className="btn-primary w-full py-4 text-lg"
                    >
                        본인 확인 및 승인
                    </button>
                    <button
                        onClick={() => setStatus("rejected")}
                        className="w-full py-3 text-sm text-gray-400 font-medium hover:text-red-500 transition-colors"
                    >
                        내가 보낸 것이 아닙니다 (신고)
                    </button>
                </div>
            </motion.div>

            <p className="text-center text-xs text-gray-400 leading-relaxed px-4">
                본 시스템은 위조가 불가능한 디지털 서명을 기반으로 합니다.<br />
                문의: 한국중학교 교무실 (02-123-4567)
            </p>
        </main>
    );
}
