"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Camera, Upload, X, CheckCircle2, Loader2, Image as ImageIcon, ChevronDown } from "lucide-react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { motion, AnimatePresence } from "framer-motion";

export default function PhotoUploadPage() {
    const [topics, setTopics] = useState<string[]>([]);
    const [selectedTopic, setSelectedTopic] = useState("");
    const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [studentName, setStudentName] = useState("");

    useEffect(() => {
        const name = sessionStorage.getItem("student_name") || "";
        setStudentName(name);

        async function fetchTopics() {
            try {
                const res = await fetch("/api/topics");
                if (res.ok) {
                    const data = await res.json();
                    setTopics(data);
                    if (data.length > 0) setSelectedTopic(data[0]);
                }
            } catch (err) {
                console.error("Failed to fetch topics", err);
            }
        }
        fetchTopics();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const newFiles = Array.from(e.target.files);
        if (images.length + newFiles.length > 3) {
            alert("최대 3장까지만 업로드 가능합니다.");
            return;
        }

        const newImages = newFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));

        setImages(prev => [...prev, ...newImages]);
    };

    const removeImage = (index: number) => {
        setImages(prev => {
            URL.revokeObjectURL(prev[index].preview);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (images.length === 0) {
            alert("최소 1장의 사진을 선택해주세요.");
            return;
        }
        if (!selectedTopic) {
            alert("주제를 선택해주세요.");
            return;
        }

        setIsSubmitting(true);

        try {
            // Convert images to base64
            const imagePromises = images.map(img => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve({ name: img.file.name, base64: reader.result });
                    reader.readAsDataURL(img.file);
                });
            });

            const base64Images = await Promise.all(imagePromises);

            const res = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: studentName,
                    topic: selectedTopic,
                    images: base64Images
                })
            });

            if (res.ok) {
                setIsSuccess(true);
            } else {
                alert("업로드 실패");
            }
        } catch (err) {
            console.error(err);
            alert("연결 오류가 발생했습니다.");
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
                    className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center"
                >
                    <CheckCircle2 size={40} />
                </motion.div>
                <h2 className="text-2xl font-bold">업로드 완료!</h2>
                <p className="text-gray-500">
                    사진이 구글 드라이브에 안전하게 저장되었습니다.<br />
                    선생님이 확인하실 예정입니다.
                </p>
                <Link href="/" className="btn-primary w-full max-w-xs mt-4">
                    홈으로 돌아가기
                </Link>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex flex-col items-center bg-[#F8FAFC] pt-[10px] font-sans overflow-y-auto">
            <div className="w-[90%] max-w-[400px] flex flex-col pb-12 gap-[30px]">
                {/* Top Spacer */}
                <div className="h-[5px] shrink-0" />

                {/* Header */}
                <div className="flex items-center justify-between px-[30px]">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="p-2.5 bg-white hover:bg-gray-50 rounded-2xl transition-all shadow-sm border border-gray-100 flex items-center justify-center">
                            <ChevronLeft size={24} className="text-gray-700" />
                        </Link>
                        <h2 className="text-[28px] font-black text-gray-900 leading-none tracking-tight">사진 업로드</h2>
                    </div>
                    <LogoutButton className="bg-white rounded-full shadow-sm border border-gray-100" />
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-12 px-[30px]">
                    {/* Topic Selection Dropdown */}
                    <section className="flex flex-col gap-4">
                        <label className="text-[14px] font-[800] text-[#FF4D8D] uppercase tracking-widest ml-5 opacity-90">활동 주제 선택</label>
                        <div className="relative group">
                            <select
                                value={selectedTopic}
                                onChange={(e) => setSelectedTopic(e.target.value)}
                                className="w-full h-[64px] bg-white border-2 border-gray-100 rounded-2xl px-12 text-[16px] font-bold text-gray-800 outline-none focus:border-[#FF4D8D]/30 focus:ring-4 focus:ring-[#FF4D8D]/5 transition-all appearance-none cursor-pointer shadow-sm text-center"
                            >
                                <option value="" disabled>활동 주제를 선택해 주세요</option>
                                {topics.map((topic) => (
                                    <option key={topic} value={topic}>{topic}</option>
                                ))}
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-[#FF4D8D] transition-colors">
                                <ChevronDown size={22} />
                            </div>
                        </div>
                    </section>

                    {/* Photo Upload Area - Wide Ratio */}
                    <section className="flex flex-col gap-4">
                        <label className="text-[14px] font-[800] text-[#FF4D8D] uppercase tracking-widest ml-5 opacity-90">사진 첨부 (최대 3장)</label>
                        <div className="flex flex-col gap-3">
                            <AnimatePresence>
                                {images.length > 0 && (
                                    <div className="grid grid-cols-3 gap-3">
                                        {images.map((img, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="relative aspect-square rounded-2xl overflow-hidden border border-white shadow-md"
                                            >
                                                <img src={img.preview} alt="upload preview" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full backdrop-blur-md hover:bg-red-500 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </AnimatePresence>

                            {images.length < 3 && (
                                <label className="w-full aspect-[16/7.2] rounded-[32px] border-2 border-dashed border-gray-200 bg-white flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#FF4D8D] hover:bg-pink-50/20 transition-all text-gray-400 hover:text-[#FF4D8D] shadow-sm overflow-hidden group">
                                    <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 group-hover:bg-pink-100 group-hover:text-[#FF4D8D] flex items-center justify-center transition-all duration-300">
                                        <Camera size={32} />
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-[15px] font-bold text-gray-900">사진 추가하기</span>
                                        <span className="text-[12px] font-medium text-gray-400 italic">이미지 파일을 터치해 주세요</span>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </label>
                            )}
                        </div>
                    </section>

                    {/* Info Tooltip */}
                    <div className="p-6 bg-[#EFF6FF] rounded-[24px] border border-blue-100/50 shadow-sm flex gap-4 items-center">
                        <div className="w-11 h-11 rounded-xl bg-white text-blue-500 flex items-center justify-center shadow-sm shrink-0">
                            <ImageIcon size={22} />
                        </div>
                        <p className="text-[14px] text-blue-800/80 leading-snug font-semibold">
                            업로드된 사진은 <strong className="text-blue-900">{studentName}</strong> 학생의 이름으로 전송됩니다.
                        </p>
                    </div>

                    {/* Submit Button */}
                    <div className="flex flex-col items-center mt-2 pb-12">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full h-[68px] bg-[#FFD600] text-[#191919] font-[900] rounded-[24px] transition-all flex items-center justify-center gap-3 text-xl active:scale-[0.98] shadow-[0_15px_35px_-10px_rgba(255,214,0,0.6)] ${isSubmitting ? 'opacity-70' : 'hover:scale-[1.02]'}`}
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin" size={26} />
                            ) : (
                                <>
                                    <Upload size={24} />
                                    사진 제출하기
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
