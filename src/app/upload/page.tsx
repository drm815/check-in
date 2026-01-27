"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Camera, Upload, X, CheckCircle2, Loader2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
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
        setImages(prev => prev.filter((_, i) => i !== index));
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
        <main className="flex-1 flex flex-col bg-[#F8FAFC] min-h-screen">
            <div className="p-6 flex items-center gap-4 bg-white border-b border-gray-100">
                <Link href="/" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <ChevronLeft size={24} />
                </Link>
                <h2 className="text-lg font-bold">사진 업로드</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
                <section className="flex flex-col gap-3">
                    <label className="text-sm font-semibold text-gray-500 ml-1">주제 선택</label>
                    <div className="flex flex-wrap gap-2">
                        {topics.map((topic) => (
                            <button
                                key={topic}
                                type="button"
                                onClick={() => setSelectedTopic(topic)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedTopic === topic
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                                    : 'bg-white text-gray-400 border border-gray-100'
                                    }`}
                            >
                                {topic}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="flex flex-col gap-3">
                    <label className="text-sm font-semibold text-gray-500 ml-1">사진 첨부 (최대 3장)</label>
                    <div className="grid grid-cols-3 gap-3">
                        <AnimatePresence>
                            {images.map((img, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100"
                                >
                                    <img src={img.preview} alt="upload preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full backdrop-blur-sm"
                                    >
                                        <X size={14} />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {images.length < 3 && (
                            <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-white flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all text-gray-400 hover:text-indigo-600">
                                <Camera size={24} />
                                <span className="text-[10px] font-bold">사진 추가</span>
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

                <div className="premium-card bg-blue-50 border-blue-100 p-4 mt-2">
                    <div className="flex gap-3">
                        <div className="text-blue-600">
                            <ImageIcon size={20} />
                        </div>
                        <p className="text-xs text-blue-700 leading-relaxed">
                            💡 업로드된 사진은 <strong>{studentName}</strong> 학생의 이름으로 구글 드라이브에 자동 분류되어 저장됩니다.
                        </p>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary mt-4 py-4 text-lg disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            업로드 중...
                        </>
                    ) : (
                        <>
                            <Upload size={20} />
                            사진 제출하기
                        </>
                    )}
                </button>
            </form>
        </main>
    );
}
