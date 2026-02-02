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
  const [status, setStatus] = useState<"away" | "school" | "home">("away");
  const [scanTime, setScanTime] = useState<string | null>(null);
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

    // Fetch Status and Announcements
    const fetchData = async () => {
      try {
        const [annRes, attRes] = await Promise.all([
          fetch("/api/announcements"),
          fetch(`/api/admin/attendance?v=${Date.now()}`)
        ]);

        if (annRes.ok) {
          const data = await annRes.json();
          setAnnouncements(data);
        }

        if (attRes.ok) {
          const allAtt = await attRes.json();
          const studentId = sessionStorage.getItem("student_id");
          const today = new Date().toISOString().split('T')[0];

          // Find today's records for this student and take the latest one
          const studentRecords = allAtt.filter((r: any) => {
            const rId = (r.studentid || r["학번"] || "").toString().trim();
            const rDate = new Date(r.timestamp || r["시각"]).toISOString().split('T')[0];
            return rId === studentId && rDate === today;
          });

          if (studentRecords.length > 0) {
            // Sort by timestamp desc to get the latest
            studentRecords.sort((a: any, b: any) =>
              new Date(b.timestamp || b["시각"]).getTime() - new Date(a.timestamp || a["시각"]).getTime()
            );

            const latest = studentRecords[0];
            const type = (latest.type || latest["유형"] || "").toString().trim();

            if (type === "하교") {
              setStatus("home");
            } else {
              setStatus("school");
            }

            const time = new Date(latest.timestamp || latest["시각"]).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit'
            });
            setScanTime(time);
          } else {
            setStatus("away");
            setScanTime(null);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();

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
    <div className="min-h-screen bg-[#F8FAFC] flex justify-center">
      <main className="w-full max-w-[480px] flex flex-col px-10 py-16 gap-12 overflow-y-auto min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center animate-fade px-2">
          <div className="flex flex-col gap-2">
            <h2 className="text-gray-400 text-[11px] font-black uppercase tracking-[0.3em]">{dateString}</h2>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black text-gray-900 leading-tight">
                {studentName ? `${studentName}님,` : "안녕하세요!"} <br />
                오늘도 기분 좋은 하루 되세요! ☀️
              </h1>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-indigo-600 shrink-0">
            <User size={28} />
          </div>
        </div>

        {/* Status Card */}
        <div className="px-[20%]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative overflow-hidden rounded-3xl p-5 shadow-sm border-2 transition-all duration-300 flex items-center justify-center gap-6 ${status === "school" ? "bg-[#FFF1F2] border-[#FFE4E6] text-[#9F1239]" :
              status === "home" ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                "bg-[#F0F9FF] border-[#E0F2FE] text-[#075985]"
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-4 rounded-2xl shadow-sm ${status === "school" ? "bg-white text-rose-500" :
                status === "home" ? "bg-white text-emerald-500" :
                  "bg-white text-sky-500"
                }`}>
                {status === "school" ? <CheckCircle2 size={32} strokeWidth={2.5} /> :
                  status === "home" ? <MapPin size={32} strokeWidth={2.5} /> :
                    <Clock size={32} strokeWidth={2.5} />}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  {status === "school" ? "In School" : status === "home" ? "Returned Home" : "Away"}
                </span>
                <h3 className="text-2xl font-black tracking-tight">
                  {status === "school" ? "등교 완료" : status === "home" ? "하교 완료" : "미등교 상태"}
                </h3>
              </div>
            </div>

            {scanTime && (
              <>
                <div className="w-px h-10 bg-current opacity-10" />
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold opacity-60">최종 스캔</span>
                  <span className="text-xl font-black">{scanTime}</span>
                </div>
              </>
            )}
          </motion.div>
        </div>

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
    </div>
  );
}

function ActionButton({ icon, label, sub, color, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="premium-card p-5 flex flex-col gap-3 items-start text-left border-none shadow-sm hover:shadow-md"
    >
      <div className={`p-3 rounded-2xl shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <h4 className="font-bold text-gray-800 leading-tight break-keep">{label}</h4>
        <p className="text-[10px] text-gray-500 leading-tight opacity-80">{sub}</p>
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
