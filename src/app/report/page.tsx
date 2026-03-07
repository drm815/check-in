"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Send, AlertTriangle, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { motion } from "framer-motion";

export default function ReportPage() {
    const [type, setType] = useState<string>("absence");
    const [reason, setReason] = useState("");
    const [date, setDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [studentInfo, setStudentInfo] = useState({ id: "", name: "", email: "" });

    const [myReports, setMyReports] = useState<any[]>([]);

    useEffect(() => {
        const id = sessionStorage.getItem("student_id") || "";
        const name = sessionStorage.getItem("student_name") || "";
        const email = sessionStorage.getItem("parent_email") || "";
        setStudentInfo({ id, name, email });

        // Set default date to today in local time
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        setDate(`${year}-${month}-${day}`);

        // Fetch My Reports
        const fetchReports = async () => {
            try {
                const res = await fetch(`/api/attendance/status?studentId=${encodeURIComponent(id)}`);
                if (res.ok) {
                    const myAllRecords = await res.json();

                    // Sort by timestamp desc
                    myAllRecords.sort((a: any, b: any) => {
                        const tA = new Date(a.timestamp || a["시각"] || 0).getTime();
                        const tB = new Date(b.timestamp || b["시각"] || 0).getTime();
                        return tB - tA;
                    });

                    // Filter for reports (not check-in/out)
                    // If type is missing, we assume it's a report (safe default)
                    const reports = myAllRecords.filter((r: any) => {
                        const type = String(r.type || r["유형"] || "").trim();
                        return type !== "등교" && type !== "하교";
                    });
                    setMyReports(reports);
                }
            } catch (error) {
                console.error("Failed to fetch reports:", error);
            }
        };
        fetchReports();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const reportId = crypto.randomUUID();
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
                    studentId: studentInfo.id,
                    targetDate: date
                }),
            });
            if (response.ok) {
                setIsSuccess(true);
            } else {
                alert("전송 실패");
            }
        } catch (error) {
            console.error(error);
            alert("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
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
                        <h2 className="text-[28px] font-black text-gray-900 leading-none tracking-tight">결석 / 지각 신고</h2>
                    </div>
                </div>

                <div className="flex flex-col gap-10 px-[30px]">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                        <section className="flex flex-col gap-4">
                            <label className="text-[14px] font-[800] text-[#FF4D8D] uppercase tracking-widest ml-5 opacity-90">날짜 선택</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-6 py-4 rounded-[1.5rem] border-2 border-gray-100 bg-white shadow-sm text-lg font-bold text-gray-800 outline-none focus:border-[#FF4D8D]/30 focus:ring-4 focus:ring-pink-500/5 text-center appearance-none"
                                required
                            />
                        </section>
                        <section className="flex flex-col gap-4">
                            <label className="text-[14px] font-[800] text-[#FF4D8D] uppercase tracking-widest ml-5 opacity-90">신고 유형 선택</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { id: 'absence', label: '결석' },
                                    { id: 'late', label: '지각' },
                                    { id: 'leave', label: '조퇴' },
                                    { id: 'other', label: '기타' }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setType(item.id)}
                                        className={`py-3 rounded-[1rem] flex flex-col items-center justify-center gap-1 border transition-all shadow-sm ${type === item.id
                                            ? 'border-[#FF4D8D] bg-pink-50/40 text-[#FF4D8D] font-black'
                                            : 'border-slate-100 bg-white text-gray-400 font-bold hover:border-pink-100'
                                            }`}
                                    >
                                        <span className="text-sm tracking-tight">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="flex flex-col gap-4">
                            <label className="text-[14px] font-[800] text-[#FF4D8D] uppercase tracking-widest ml-5 opacity-90">상세 사유 입력</label>
                            <textarea
                                placeholder="사유를 입력해주세요"
                                className="w-full px-6 py-4 rounded-[1.5rem] border-2 border-gray-100 bg-white shadow-sm h-20 resize-none focus:border-[#FF4D8D]/30 focus:ring-4 focus:ring-pink-500/5 outline-none text-[15px] text-gray-900 font-semibold placeholder-gray-300 leading-relaxed text-center"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                required
                            />
                        </section>

                        <div className="p-4 bg-orange-50 rounded-[1.5rem] border border-orange-100 shadow-sm">
                            <p className="text-[12px] text-orange-700 leading-relaxed font-semibold text-center">
                                ⚠️ 부모님의 최종 확인이 필요합니다.
                            </p>
                        </div>

                        <div className="flex flex-col items-center">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-1/3 min-w-[120px] h-[52px] bg-[#FFD600] text-[#191919] font-[900] rounded-[18px] transition-all flex items-center justify-center gap-2 text-lg active:scale-[0.98] shadow-[0_10px_20px_-10px_rgba(255,214,0,0.5)] ${isSubmitting ? 'opacity-70' : 'hover:scale-[1.02]'}`}
                            >
                                {isSubmitting ? "전송 중..." : "신고하기"}
                            </button>
                        </div>
                    </form>

                    {/* My Reports Section */}
                    <div className="flex flex-col gap-4 w-full border-t border-slate-100 pt-8">
                        <h3 className="text-xl font-black flex items-center gap-2 text-slate-800">
                            나의 출결 신고 내역
                        </h3>
                        <div className="flex flex-col gap-3">
                            {myReports.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 font-bold bg-white rounded-[1.5rem] border border-slate-100 shadow-sm text-sm">
                                    신고 내역이 없습니다.
                                </div>
                            ) : (
                                myReports.map((report, i) => {
                                    // Status Localization
                                    const statusRaw = String(report.status || "").toUpperCase();
                                    const isConfirmed = statusRaw === "CONFIRMED" || statusRaw === "승인";
                                    const isRejected = statusRaw === "REJECTED" || statusRaw === "거절";

                                    const statusText = isConfirmed ? "승인됨" : isRejected ? "거절됨" : "대기중";
                                    const statusColor = isConfirmed ? "bg-emerald-100 text-emerald-600" : isRejected ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600";

                                    // Data Clean up (if type is incorrectly showing status due to data shift)
                                    let displayType = report.type || report["유형"];
                                    const displayTypeUpper = String(displayType).toUpperCase();
                                    if (displayTypeUpper === "CONFIRMED" || displayTypeUpper === "PENDING") {
                                        displayType = "기타(유형없음)";
                                    }

                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="flex flex-col gap-1.5 py-4 border-b border-slate-100 last:border-0"
                                        >
                                            <div className="flex items-center gap-2 w-full">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor} shrink-0`}>
                                                    {statusText}
                                                </span>
                                                <span className="text-sm font-black text-slate-700">
                                                    {displayType}
                                                </span>
                                                <span className="text-xs text-gray-400 font-medium ml-auto">
                                                    {report.targetDate || new Date(report.timestamp).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {report.reason && (
                                                <div className="flex items-start gap-2 pl-1">
                                                    <div className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                                                    <span className="text-xs text-slate-500 font-medium leading-relaxed break-keep">
                                                        {report.reason}
                                                    </span>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
