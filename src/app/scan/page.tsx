"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { ChevronLeft, Camera, RefreshCw } from "lucide-react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { motion } from "framer-motion";

export default function ScanPage() {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [status, setStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
    const [currentStatus, setCurrentStatus] = useState<"away" | "school" | "home">("away");
    const currentStatusRef = useRef<"away" | "school" | "home">("away");
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scanReadyRef = useRef<boolean>(false);

    useEffect(() => {
        const fetchCurrentStatus = async () => {
            const studentId = sessionStorage.getItem("student_id");
            if (!studentId) return;

            try {
                const res = await fetch(`/api/admin/attendance?v=${Date.now()}`);
                if (res.ok) {
                    const allAtt = await res.json();
                    const today = new Date().toISOString().split('T')[0];
                    const studentRecords = (allAtt as Record<string, string>[]).filter((r) => {
                        const rId = (r.studentid || r["학번"] || "").toString().trim();
                        const rDate = new Date(r.timestamp || r["시각"]).toISOString().split('T')[0];
                        return rId === studentId && rDate === today;
                    });

                    if (studentRecords.length > 0) {
                        studentRecords.sort((a, b) =>
                            new Date(b.timestamp || b["시각"]).getTime() - new Date(a.timestamp || a["시각"]).getTime()
                        );
                        const type = (studentRecords[0].type || studentRecords[0]["유형"] || "").toString().trim();
                        const newStatus = type === "하교" ? "home" : "school";
                        setCurrentStatus(newStatus);
                        currentStatusRef.current = newStatus;
                    } else {
                        setCurrentStatus("away");
                        currentStatusRef.current = "away";
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchCurrentStatus();
    }, []);

    const onScanFailure = useCallback(() => {
        // 매 프레임 QR 미감지 시 조용히 무시
    }, []);

    const onScanSuccess = useCallback(async (decodedText: string) => {
        // 카메라 시작 직후 잔상 QR 인식 방지 (1.5초 딜레이)
        if (!scanReadyRef.current) return;

        // 스캐너 먼저 정지 (이중 스캔 방지)
        if (scannerRef.current && scannerRef.current.isScanning) {
            try { await scannerRef.current.stop(); } catch { /* ignore */ }
        }

        setScanResult(decodedText);

        const studentId = sessionStorage.getItem("student_id");
        const studentName = sessionStorage.getItem("student_name");

        const scanType = currentStatusRef.current === "school" ? "하교" : "등교";

        try {
            const response = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId,
                    studentName,
                    scannedId: decodedText,
                    type: scanType
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setStatus("success");
            } else {
                alert(result.message || "스캔 처리 중 오류가 발생했습니다.");
                setStatus("idle");
            }
        } catch (error) {
            console.error(error);
            alert("네트워크 통신 오류가 발생했습니다.");
            setStatus("idle");
        }
    }, []);

    useEffect(() => {
        if (status === "scanning") {
            scanReadyRef.current = false;
            const html5QrCode = new Html5Qrcode("reader");
            scannerRef.current = html5QrCode;

            html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                onScanSuccess,
                onScanFailure
            ).then(() => {
                // 카메라 시작 후 1.5초 뒤부터 QR 인식 활성화
                setTimeout(() => { scanReadyRef.current = true; }, 1500);
            }).catch(err => {
                console.error("Scanner start error", err);
                setStatus("idle");
                alert("카메라를 시작할 수 없습니다. 권한을 확인해 주세요.");
            });
        }

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
            }
        };
    }, [status, onScanSuccess, onScanFailure]);

    return (
        <main className="min-h-screen flex flex-col items-center bg-slate-900 text-white pt-[10px] overflow-y-auto">
            <div className="w-[90%] max-w-[400px] flex flex-col pb-12 gap-[30px]">
                {/* Top Spacer */}
                <div className="h-[5px] shrink-0" />

                {/* Header */}
                <div className="flex items-center justify-between px-[30px]">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl transition-all shadow-sm border border-white/10 flex items-center justify-center">
                            <ChevronLeft size={24} className="text-white" />
                        </Link>
                        <h2 className="text-[28px] font-black text-white leading-none tracking-tight">등하교 QR 스캔</h2>
                    </div>
                    <LogoutButton className="bg-white/10 text-red-400 rounded-full shadow-sm hover:bg-white/20 active:bg-white/30" />
                </div>

                {/* Scanner Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
                    {status === "idle" && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-6"
                        >
                            <div className="w-64 h-64 border-2 border-dashed border-indigo-400 rounded-3xl flex items-center justify-center relative">
                                <Camera size={64} className="text-indigo-400 opacity-50" />
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl"></div>
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl"></div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold mb-2">책상의 QR 코드를 보여주세요</h3>
                            </div>
                            <button
                                onClick={() => setStatus("scanning")}
                                className="btn-primary w-full max-w-xs mt-4"
                            >
                                스캔 시작하기
                            </button>
                        </motion.div>
                    )}

                    {status === "scanning" && (
                        <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative">
                            <div id="reader"></div>
                            <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40"></div>
                        </div>
                    )}

                    {status === "success" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center gap-6 text-center"
                        >
                            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                                <RefreshCw size={48} className="animate-spin-slow" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-green-400">인식 성공!</h3>
                                <p className="text-slate-300 mt-2">정상적으로 {currentStatus === "school" ? "하교" : "등교"} 처리가 완료되었습니다.</p>
                                <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10 uppercase font-mono tracking-widest">
                                    {scanResult}
                                </div>
                            </div>
                            <Link href="/" className="btn-primary w-full max-w-xs">
                                홈으로 돌아가기
                            </Link>
                        </motion.div>
                    )}
                </div>
            </div>
        </main>
    );
}
