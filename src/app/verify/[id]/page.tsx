"use client";

import { useState, useEffect, use } from "react";
import { CheckCircle2, XCircle, ShieldCheck, HeartPulse, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [status, setStatus] = useState<"pending" | "confirmed" | "rejected">("pending");
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<any>(null);

    useEffect(() => {
        async function fetchReport() {
            try {
                const res = await fetch(`/api/report/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setReport(data);
                }
            } catch (err) {
                console.error("Failed to fetch report", err);
            } finally {
                setLoading(false);
            }
        }
        fetchReport();
    }, [id]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 h-screen bg-slate-50">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (!report) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white h-screen">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                    <XCircle size={48} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">신고 내역을 찾을 수 없습니다</h2>
                <p className="text-gray-500 mt-2">만료되었거나 잘못된 링크입니다.</p>
            </div>
        );
    }

    const handleVerify = async (newStatus: "confirmed" | "rejected") => {
        try {
            const res = await fetch(`/api/report/${id}/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus.toUpperCase() })
            });
            if (res.ok) {
                setStatus(newStatus);
            }
        } catch (err) {
            console.error(err);
            alert("처리 중 오류가 발생했습니다.");
        }
    };

    if (status === "confirmed") {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white h-screen">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6"
                >
                    <CheckCircle2 size={48} />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900">확인이 완료되었습니다</h2>
                <p className="text-gray-500 mt-2">자녀의 {report.type} 신고를 승인하셨습니다. 감사합니다.</p>
            </div>
        );
    }

    if (status === "rejected") {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white h-screen">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                    <XCircle size={48} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">요청이 거절되었습니다</h2>
                <p className="text-gray-500 mt-2">해당 지각/결석 신고에 대해 승인 거절 처리를 완료했습니다.</p>
            </div>
        );
    }

    return (
        <main className="flex-1 flex flex-col bg-slate-50 min-h-screen pt-[15vh] pb-6 px-6">
            <div className="flex flex-col items-center gap-2 mb-8 mt-12">
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg mb-2">
                    <ShieldCheck size={32} />
                </div>
                <h1 className="text-xl font-bold">Class-Mates 학부모 확인</h1>
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
                        <h3 className="font-bold text-gray-800">지각/결석 신고 확인</h3>
                        <p className="text-xs text-gray-400">관리번호: {id}</p>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">학생 정보</span>
                        <span className="font-semibold">{report.name} (학번: {report.studentid})</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">신고 유형</span>
                        <span className="font-semibold text-orange-600">{report.type}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">신청 시각</span>
                        <span className="font-semibold">{new Date(report.timestamp).toLocaleString('ko-KR')}</span>
                    </div>
                    <div className="flex flex-col gap-1 pt-2">
                        <span className="text-gray-500 text-sm">사유 내용</span>
                        <p className="bg-slate-50 p-3 rounded-lg text-sm text-gray-700">
                            {report.reason || "입력된 사유가 없습니다."}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => handleVerify("confirmed")}
                        className="btn-primary w-full py-4 text-lg"
                    >
                        부모 확인 및 승인
                    </button>
                    <button
                        onClick={() => handleVerify("rejected")}
                        className="w-full py-3 text-sm text-gray-400 font-medium hover:text-red-500 transition-colors"
                    >
                        승인하지 않습니다
                    </button>
                </div>
            </motion.div>

            <p className="text-center text-xs text-gray-400 leading-relaxed px-4">
                본 시스템은 등록된 학부모님의 이메일을 통해 발송되었습니다.<br />
                문의: 학교 교무실 또는 프로젝트 관리자
            </p>
        </main>
    );
}
