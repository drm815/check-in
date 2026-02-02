"use client";

import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { ChevronLeft, Camera, RefreshCw } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ScanPage() {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [status, setStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
    const [currentStatus, setCurrentStatus] = useState<"away" | "school" | "home">("away");
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        const fetchCurrentStatus = async () => {
            const studentId = sessionStorage.getItem("student_id");
            if (!studentId) return;

            try {
                const res = await fetch(`/api/admin/attendance?v=${Date.now()}`);
                if (res.ok) {
                    const allAtt = await res.json();
                    const today = new Date().toISOString().split('T')[0];
                    const studentRecords = allAtt.filter((r: any) => {
                        const rId = (r.studentid || r["학번"] || "").toString().trim();
                        const rDate = new Date(r.timestamp || r["시각"]).toISOString().split('T')[0];
                        return rId === studentId && rDate === today;
                    });

                    if (studentRecords.length > 0) {
                        studentRecords.sort((a: any, b: any) =>
                            new Date(b.timestamp || b["시각"]).getTime() - new Date(a.timestamp || a["시각"]).getTime()
                        );
                        const type = (studentRecords[0].type || studentRecords[0]["유형"] || "").toString().trim();
                        setCurrentStatus(type === "하교" ? "home" : "school");
                    } else {
                        setCurrentStatus("away");
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchCurrentStatus();
    }, []);

    useEffect(() => {
        if (status === "scanning") {
            scannerRef.current = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );
            scannerRef.current.render(onScanSuccess, onScanFailure);
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => console.error("Failed to clear scanner", error));
            }
        };
    }, [status]);

    async function onScanSuccess(decodedText: string) {
        setScanResult(decodedText);
        setStatus("scanning"); // Show processing

        const studentId = sessionStorage.getItem("student_id");
        const studentName = sessionStorage.getItem("student_name");

        const scanType = currentStatus === "school" ? "하교" : "등교";

        try {
            const response = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId: studentId,
                    studentName: studentName,
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

        if (scannerRef.current) {
            scannerRef.current.clear();
        }
    }

    function onScanFailure(error: any) {
        // Quietly handle scan failure (which happens every frame if no QR is found)
    }

    return (
        <main className="flex-1 flex flex-col bg-slate-900 text-white min-h-screen">
            {/* Header */}
            <div className="p-6 flex items-center justify-between">
                <Link href="/" className="p-2 bg-white/10 rounded-xl">
                    <ChevronLeft size={24} />
                </Link>
                <h2 className="text-lg font-bold">등하교 QR 스캔</h2>
                <div className="w-10"></div>
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
                            <p className="text-slate-400 px-8">카메라 중앙에 QR 코드를 맞춰주시면 자동으로 인식됩니다.</p>
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

            {/* Help Footer */}
            <div className="p-8 text-center text-slate-500 text-sm">
                QR 인식이 안되시나요? NFC 태그도 가능합니다.
            </div>
        </main>
    );
}
