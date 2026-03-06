"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { ChevronLeft, Camera, RefreshCw, Flashlight, FlashlightOff } from "lucide-react";
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
    // 이중 스캔 방지 — 스캐너 생명주기 전체에서 유지
    const processingRef = useRef<boolean>(false);
    // 스캔 완료 후 실제로 처리된 type 저장
    const [processedType, setProcessedType] = useState<"등교" | "하교" | null>(null);
    // 하교 확인 모달 상태
    const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
    const pendingScannedIdRef = useRef<string | null>(null);
    // 손전등
    const [torchOn, setTorchOn] = useState(false);
    const torchRef = useRef<boolean>(false);
    // onScanSuccess를 ref로 관리 → useEffect 의존성에서 제외해 스캐너 재시작 방지
    const onScanSuccessRef = useRef<((text: string) => void) | null>(null);

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

    // 실제 출결 API 호출
    const submitAttendance = useCallback(async (decodedText: string, scanType: "등교" | "하교") => {
        const studentId = sessionStorage.getItem("student_id");
        const studentName = sessionStorage.getItem("student_name");

        try {
            const response = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId, studentName, scannedId: decodedText, type: scanType }),
            });

            const result = await response.json();

            if (response.ok) {
                const newStatus = scanType === "하교" ? "home" : "school";
                setCurrentStatus(newStatus);
                currentStatusRef.current = newStatus;
                // 홈 페이지가 GAS 캐시로 인해 상태를 못 받아올 경우를 대비해 저장
                const now = new Date().toISOString();
                sessionStorage.setItem("last_attendance_type", scanType);
                sessionStorage.setItem("last_attendance_time", now);
                setProcessedType(scanType);
                setScanResult(decodedText);
                setStatus("success");
            } else {
                alert(result.message || "스캔 처리 중 오류가 발생했습니다.");
                setStatus("idle");
            }
        } catch (error) {
            console.error(error);
            alert("네트워크 통신 오류가 발생했습니다.");
            setStatus("idle");
        } finally {
            processingRef.current = false;
        }
    }, []);

    // onScanSuccess 최신 버전을 ref에 저장 (스캐너는 재시작하지 않음)
    useEffect(() => {
        onScanSuccessRef.current = async (decodedText: string) => {
            if (!scanReadyRef.current) return;
            if (processingRef.current) return;

            processingRef.current = true;

            // 스캐너 정지
            if (scannerRef.current && scannerRef.current.isScanning) {
                try { await scannerRef.current.stop(); } catch { /* ignore */ }
            }

            const isHomeQR = decodedText === "CLASS_MATES_HOME_QR";
            const currentSt = currentStatusRef.current;

            if (isHomeQR) {
                await submitAttendance(decodedText, "하교");
                return;
            }

            if (currentSt === "school") {
                pendingScannedIdRef.current = decodedText;
                setShowCheckoutConfirm(true);
                processingRef.current = false;
            } else if (currentSt === "home") {
                alert("이미 하교 처리가 완료되었습니다.");
                setStatus("idle");
                processingRef.current = false;
            } else {
                await submitAttendance(decodedText, "등교");
            }
        };
    }, [submitAttendance, currentStatus]);

    // 하교 확인 모달 확인
    const handleCheckoutConfirm = useCallback(async () => {
        setShowCheckoutConfirm(false);
        const scannedId = pendingScannedIdRef.current;
        if (!scannedId) return;
        processingRef.current = true;
        await submitAttendance(scannedId, "하교");
    }, [submitAttendance]);

    // 하교 확인 모달 취소
    const handleCheckoutCancel = useCallback(() => {
        setShowCheckoutConfirm(false);
        pendingScannedIdRef.current = null;
        setStatus("idle");
    }, []);

    // 손전등 토글
    const handleTorchToggle = useCallback(async () => {
        if (!scannerRef.current) return;
        const next = !torchRef.current;
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (scannerRef.current as any).applyVideoConstraints({ advanced: [{ torch: next }] });
            torchRef.current = next;
            setTorchOn(next);
        } catch {
            // torch 미지원 기기 무시
        }
    }, []);

    // 스캐너 시작/정지 — status === "scanning" 일 때만, 의존성 최소화
    useEffect(() => {
        if (status !== "scanning") return;

        scanReadyRef.current = false;
        processingRef.current = false;
        torchRef.current = false;
        setTorchOn(false);

        const html5QrCode = new Html5Qrcode("reader", {
            experimentalFeatures: { useBarCodeDetectorIfSupported: true },
            verbose: false,
        });
        scannerRef.current = html5QrCode;

        const qrboxSize = Math.min(Math.floor(window.innerWidth * 0.75), 300);

        // 스태틱 래퍼로 ref를 통해 항상 최신 핸들러 호출 → 스캐너 재시작 없음
        const stableHandler = (decodedText: string) => {
            onScanSuccessRef.current?.(decodedText);
        };

        html5QrCode.start(
            { facingMode: "environment" },
            { fps: 20, qrbox: { width: qrboxSize, height: qrboxSize }, aspectRatio: 1.0, disableFlip: false },
            stableHandler,
            () => { /* 미인식 프레임 무시 */ }
        ).then(() => {
            setTimeout(() => { scanReadyRef.current = true; }, 1500);
        }).catch(err => {
            console.error("Scanner start error", err);
            setStatus("idle");
            alert("카메라를 시작할 수 없습니다. 권한을 확인해 주세요.");
        });

        return () => {
            if (html5QrCode.isScanning) {
                html5QrCode.stop().catch(() => { /* ignore */ });
            }
        };
    }, [status]); // status만 의존 → 콜백 변경으로 인한 재시작 없음

    return (
        <main className="min-h-screen flex flex-col items-center bg-slate-900 text-white pt-[10px] overflow-y-auto">
            <div className="w-[90%] max-w-[400px] flex flex-col pb-12 gap-[30px]">
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
                    {status === "idle" && !showCheckoutConfirm && (
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
                                {currentStatus === "school" && (
                                    <p className="text-sm text-slate-400">현재 등교 중입니다. QR을 찍으면 하교 처리됩니다.</p>
                                )}
                                {currentStatus === "home" && (
                                    <p className="text-sm text-slate-400">이미 하교 처리가 완료되었습니다.</p>
                                )}
                            </div>
                            <button
                                onClick={() => setStatus("scanning")}
                                className="btn-primary w-full max-w-xs mt-4"
                            >
                                스캔 시작하기
                            </button>
                        </motion.div>
                    )}

                    {/* 하교 확인 다이얼로그 */}
                    {showCheckoutConfirm && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-6 text-center"
                        >
                            <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20 text-4xl">
                                🏠
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white">하교 처리</h3>
                                <p className="text-slate-300 mt-2">하교 처리를 하시겠습니까?</p>
                            </div>
                            <div className="flex flex-col gap-3 w-full max-w-xs">
                                <button onClick={handleCheckoutConfirm} className="btn-primary w-full">확인</button>
                                <button onClick={handleCheckoutCancel} className="w-full py-3 text-sm text-slate-400 font-medium hover:text-white transition-colors">취소</button>
                            </div>
                        </motion.div>
                    )}

                    {status === "scanning" && (
                        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                            <div className="w-full rounded-3xl overflow-hidden shadow-2xl relative">
                                <div id="reader"></div>
                                <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40"></div>
                            </div>
                            <p className="text-xs text-slate-400 text-center">QR 코드를 네모 안에 맞춰주세요<br />어두운 환경에서는 손전등을 켜세요</p>
                            <button
                                onClick={handleTorchToggle}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${torchOn ? "bg-yellow-400 text-slate-900" : "bg-white/10 text-white hover:bg-white/20"}`}
                            >
                                {torchOn ? <Flashlight size={18} /> : <FlashlightOff size={18} />}
                                {torchOn ? "손전등 끄기" : "손전등 켜기"}
                            </button>
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
                                <h3 className="text-2xl font-bold text-green-400">정상 처리 완료!</h3>
                                <p className="text-slate-300 mt-2">{processedType} 처리가 완료되었습니다.</p>
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
