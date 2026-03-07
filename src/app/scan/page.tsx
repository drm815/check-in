"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { ChevronLeft, Camera, RefreshCw, Flashlight, FlashlightOff } from "lucide-react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { motion } from "framer-motion";
import { attendanceStorage } from "@/lib/attendance-storage";

export default function ScanPage() {
    const [scanResult, setScanResult] = useState<string | null>(null);
    // pageStatus: 페이지 UI 상태 (idle/scanning/success)
    const [pageStatus, setPageStatus] = useState<"idle" | "scanning" | "success">("idle");
    // 하교 확인 모달
    const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
    const pendingScannedIdRef = useRef<string | null>(null);
    // 처리된 유형 (성공 화면 메시지용)
    const [processedType, setProcessedType] = useState<"등교" | "하교" | null>(null);
    // 손전등
    const [torchOn, setTorchOn] = useState(false);
    const torchRef = useRef<boolean>(false);

    // ── 출결 상태 (ref가 항상 최신값 유지) ──────────────────
    const [currentStatus, setCurrentStatus] = useState<"away" | "school" | "home">("away");
    const currentStatusRef = useRef<"away" | "school" | "home">("away");
    const updateCurrentStatus = (s: "away" | "school" | "home") => {
        currentStatusRef.current = s;
        setCurrentStatus(s);
    };

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scanReadyRef = useRef<boolean>(false);
    const processingRef = useRef<boolean>(false);

    // ── 페이지 진입 시 오늘 출결 상태 조회 ─────────────────
    useEffect(() => {
        const studentId = sessionStorage.getItem("student_id");
        if (!studentId) return;

        // attendanceStorage로 오늘 스캔 결과 읽기 (try-catch + 버전 키 내장)
        const lastType = attendanceStorage.getType();
        const lastTime = attendanceStorage.getTime();
        const today = new Date().toISOString().split('T')[0];
        if (lastType && lastTime && new Date(lastTime).toISOString().split('T')[0] === today) {
            updateCurrentStatus(lastType === "하교" ? "home" : "school");
        }

        // GAS에서도 확인 (더 최신이면 덮어씀)
        fetch(`/api/attendance/status?studentId=${encodeURIComponent(studentId)}`).then(async (res) => {
            if (!res.ok) return;
            const studentRecords = (await res.json() as Record<string, string>[]).filter((r) => {
                const rDate = new Date(r.timestamp || r["시각"]).toISOString().split('T')[0];
                return rDate === today;
            });
            if (studentRecords.length === 0) return;
            studentRecords.sort((a, b) =>
                new Date(b.timestamp || b["시각"]).getTime() - new Date(a.timestamp || a["시각"]).getTime()
            );
            const gasType = (studentRecords[0].type || studentRecords[0]["유형"] || "").toString().trim();
            const gasTime = new Date(studentRecords[0].timestamp || studentRecords[0]["시각"]);
            // attendanceStorage보다 GAS가 더 최신이면 GAS 값 사용
            const lastTimestamp = lastTime ? new Date(lastTime) : new Date(0);
            if (gasTime >= lastTimestamp) {
                updateCurrentStatus(gasType === "하교" ? "home" : gasType === "등교" ? "school" : "away");
            }
        }).catch(() => {});
    }, []);

    // ── 출결 API 호출 ────────────────────────────────────────
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
                // 상태 즉시 업데이트
                const newStatus = scanType === "하교" ? "home" : "school";
                updateCurrentStatus(newStatus);
                // attendanceStorage에 저장 (로그아웃 후에도 오늘 출결 상태 유지)
                attendanceStorage.set(scanType, new Date().toISOString());
                setProcessedType(scanType);
                setScanResult(decodedText);
                setPageStatus("success");
            } else {
                alert(result.message || "스캔 처리 중 오류가 발생했습니다.");
                setPageStatus("idle");
            }
        } catch {
            alert("네트워크 통신 오류가 발생했습니다.");
            setPageStatus("idle");
        } finally {
            processingRef.current = false;
        }
    }, []);

    // ── QR 인식 핸들러 (ref 없이 직접 currentStatusRef 읽음) ─
    const handleScanResult = useCallback(async (decodedText: string) => {
        if (!scanReadyRef.current) return;
        if (processingRef.current) return;

        processingRef.current = true;

        // 스캐너 정지
        if (scannerRef.current?.isScanning) {
            try { await scannerRef.current.stop(); } catch { /* ignore */ }
        }

        const isHomeQR = decodedText === "CLASS_MATES_HOME_QR";
        // ref에서 직접 읽어야 항상 최신값
        const st = currentStatusRef.current;

        if (isHomeQR) {
            await submitAttendance(decodedText, "하교");
            return;
        }

        if (st === "school") {
            pendingScannedIdRef.current = decodedText;
            setShowCheckoutConfirm(true);
            processingRef.current = false;
        } else if (st === "home") {
            alert("이미 하교 처리가 완료되었습니다.");
            setPageStatus("idle");
            processingRef.current = false;
        } else {
            // away → 등교
            await submitAttendance(decodedText, "등교");
        }
    }, [submitAttendance]);

    // ── 스캐너 시작/정지 ─────────────────────────────────────
    useEffect(() => {
        if (pageStatus !== "scanning") return;

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

        html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: qrboxSize, height: qrboxSize }, aspectRatio: 1.0, disableFlip: false },
            handleScanResult,
            () => {}
        ).then(() => {
            // 카메라 켜지고 3초 후부터 인식 활성화 (너무 빠른 스캔 방지)
            setTimeout(() => { scanReadyRef.current = true; }, 3000);
        }).catch(err => {
            console.error("Scanner start error", err);
            setPageStatus("idle");
            alert("카메라를 시작할 수 없습니다. 권한을 확인해 주세요.");
        });

        return () => {
            if (html5QrCode.isScanning) {
                html5QrCode.stop().catch(() => {});
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageStatus]);
    // ↑ handleScanResult를 의존성에서 제외: 스캐너가 재시작되면 processingRef가 리셋돼
    //   중복 등록 발생. handleScanResult는 ref(currentStatusRef)를 직접 읽으므로 안전.

    // ── 하교 확인 ────────────────────────────────────────────
    const handleCheckoutConfirm = useCallback(async () => {
        setShowCheckoutConfirm(false);
        const scannedId = pendingScannedIdRef.current;
        if (!scannedId) return;
        processingRef.current = true;
        await submitAttendance(scannedId, "하교");
    }, [submitAttendance]);

    const handleCheckoutCancel = useCallback(() => {
        setShowCheckoutConfirm(false);
        pendingScannedIdRef.current = null;
        setPageStatus("idle");
    }, []);

    // ── 손전등 ───────────────────────────────────────────────
    const handleTorchToggle = useCallback(async () => {
        if (!scannerRef.current) return;
        const next = !torchRef.current;
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (scannerRef.current as any).applyVideoConstraints({ advanced: [{ torch: next }] });
            torchRef.current = next;
            setTorchOn(next);
        } catch { /* 미지원 기기 무시 */ }
    }, []);

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

                <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">

                    {/* Idle */}
                    {pageStatus === "idle" && !showCheckoutConfirm && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6">
                            <div className="w-64 h-64 border-2 border-dashed border-indigo-400 rounded-3xl flex items-center justify-center relative">
                                <Camera size={64} className="text-indigo-400 opacity-50" />
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl" />
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl" />
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold mb-2">책상의 QR 코드를 보여주세요</h3>
                                {currentStatus === "school" && (
                                    <p className="text-sm text-slate-400">현재 등교 중입니다. QR을 찍으면 하교 처리됩니다.</p>
                                )}
                                    {currentStatus === "home" && (
                                    <p className="text-sm text-red-400 font-semibold">오늘 하교 처리가 완료되었습니다.<br />내일 다시 이용해 주세요.</p>
                                )}
                            </div>
                            <button
                                onClick={() => setPageStatus("scanning")}
                                disabled={currentStatus === "home"}
                                className="btn-primary w-full max-w-xs mt-4 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                스캔 시작하기
                            </button>
                        </motion.div>
                    )}

                    {/* 하교 확인 다이얼로그 */}
                    {showCheckoutConfirm && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6 text-center">
                            <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20 text-4xl">🏠</div>
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

                    {/* Scanning */}
                    {pageStatus === "scanning" && (
                        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                            <div className="w-full rounded-3xl overflow-hidden shadow-2xl relative">
                                <div id="reader" />
                                <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40" />
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

                    {/* Success */}
                    {pageStatus === "success" && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-6 text-center">
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
                            <Link href="/" className="btn-primary w-full max-w-xs">홈으로 돌아가기</Link>
                        </motion.div>
                    )}
                </div>
            </div>
        </main>
    );
}
