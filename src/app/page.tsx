"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  QrCode,
  MapPin,
  FileText,
  MessageCircle,
  Bell,
  Clock,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Camera,
  User
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function Home() {
  const [status, setStatus] = useState<"away" | "school">("away");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [studentName, setStudentName] = useState("");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const studentId = sessionStorage.getItem("student_id");
    if (!studentId) {
      router.push("/login");
      return;
    }

    const name = sessionStorage.getItem("student_name") || "";
    setStudentName(name);

    // Fetch announcements
    const fetchAnn = async () => {
      try {
        const res = await fetch("/api/announcements");
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAnn();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [router]);

  const timeString = currentTime.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const dateString = currentTime.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  return (
    <main className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex justify-between items-center animate-fade">
        <div className="flex flex-col">
          <h2 className="text-gray-500 text-sm font-medium">{dateString}</h2>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              안녕하세요{studentName ? `, ${studentName} 학생` : ""}! 👋
            </h1>
            {studentName && (
              <Link href="/settings/password" className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full hover:bg-slate-200 transition-colors">
                비밀번호 변경
              </Link>
            )}
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
          <User size={24} />
        </div>
      </div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card bg-indigo-600 text-white relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-100 text-sm">현재 등교 상태</p>
              <h3 className="text-3xl font-bold mt-1">
                {status === "school" ? "등교 완료" : "미등교"}
              </h3>
            </div>
            <div className={`p-3 rounded-2xl ${status === "school" ? "bg-green-400/20" : "bg-white/10"}`}>
              {status === "school" ? <CheckCircle2 size={32} /> : <Clock size={32} />}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full text-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            현재 시각 {timeString}
          </div>
        </div>

        {/* Background blobs */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </motion.div>

      {/* Action Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/scan" className="contents">
          <ActionButton
            icon={<QrCode size={28} />}
            label="등하교 스캔"
            sub="QR / NFC"
            color="bg-blue-50 text-blue-600"
          />
        </Link>
        <Link href="/upload" className="contents">
          <ActionButton
            icon={<Camera size={28} />}
            label="활동 사진 제출"
            sub="드라이브 자동 저장"
            color="bg-purple-50 text-purple-600"
          />
        </Link>
        <Link href="/report" className="contents">
          <ActionButton
            icon={<MessageCircle size={28} />}
            label="지각/결석 신고"
            sub="학부모 자동 확인"
            color="bg-orange-50 text-orange-600"
          />
        </Link>
      </div>

      <div className="flex flex-col gap-4 mt-4 pb-8">
        <h3 className="text-lg font-bold flex items-center justify-between">
          중요 공지 및 일정
          <span className="text-[10px] text-indigo-500 font-normal border border-indigo-100 px-2 py-0.5 rounded-full">New</span>
        </h3>
        <div className="flex flex-col gap-3">
          {announcements.length === 0 ? (
            <div className="premium-card p-8 flex flex-col items-center gap-2 text-center bg-gray-50/50 border-dashed border-2">
              <Bell className="text-gray-300" size={32} />
              <p className="text-sm text-gray-400">현재 등록된 주요 일정이 없습니다.</p>
            </div>
          ) : (
            announcements.map((ann, i) => (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="premium-card p-4 flex flex-col gap-2 hover:border-indigo-100 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ann.category === '일정' ? 'bg-blue-50 text-blue-600' :
                        ann.category === '행사' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                      {ann.category}
                    </span>
                    <h5 className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-1">{ann.title}</h5>
                  </div>
                  <span className="text-[10px] text-gray-400">{ann.date}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{ann.content}</p>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Bottom Nav Placeholder */}
      <div className="mt-auto pt-6 flex justify-around border-t border-gray-100">
        <NavIcon icon={<Calendar size={20} />} active />
        <NavIcon icon={<Bell size={20} />} />
        <NavIcon icon={<User size={20} />} />
      </div>
    </main>
  );
}

function ActionButton({ icon, label, sub, color, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="premium-card p-5 flex flex-col gap-3 items-start text-left border-none shadow-sm hover:shadow-md"
    >
      <div className={`p-3 rounded-2xl ${color}`}>
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-gray-800">{label}</h4>
        <p className="text-xs text-gray-500">{sub}</p>
      </div>
    </button>
  );
}

function ActivityItem({ title, time, icon, type }: any) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-50">
      <div className={`p-2 rounded-xl ${type === 'checkin' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h5 className="font-semibold text-gray-800 leading-tight">{title}</h5>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
      <ChevronRight size={16} className="text-gray-300" />
    </div>
  );
}

function NavIcon({ icon, active = false }: any) {
  return (
    <button className={`p-2 rounded-xl transition-colors ${active ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}>
      {icon}
    </button>
  );
}
