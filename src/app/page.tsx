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

          // Find today's latest scan for this student
          const todayScan = allAtt.find((r: any) => {
            const rId = (r.studentid || r["학번"] || "").toString().trim();
            const rDate = new Date(r.timestamp || r["시각"]).toISOString().split('T')[0];
            return rId === studentId && rDate === today;
          });

          if (todayScan) {
            setStatus("school");
            const time = new Date(todayScan.timestamp || todayScan["시각"]).toLocaleTimeString('ko-KR', {
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
    <main className="flex-1 flex flex-col px-[15%] pt-[20rem] pb-[15rem] gap-16 overflow-y-auto bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex justify-between items-center animate-fade px-2">
        <div className="flex flex-col gap-2">
          <h2 className="text-gray-400 text-[11px] font-black uppercase tracking-[0.3em] mb-2">{dateString}</h2>
          <div className="flex items-center gap-2 text-wrap">
            <h1 className="text-2xl font-black text-gray-900 leading-[1.3] break-keep">
              {studentName ? `${studentName}님,` : "안녕하세요!"} <br />
              멋진 하루 보내세요! 🌟
            </h1>
          </div>
        </div>
        <div className="w-14 h-14 rounded-[1.2rem] bg-white shadow-sm border border-gray-100 flex items-center justify-center text-indigo-600 shrink-0">
          <User size={30} />
        </div>
      </div>

      {/* Status Card */}
      <div className="px-0">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-[1.8rem] px-[35px] py-10 shadow-sm border-2 transition-all duration-500 ${status === "school"
            ? "bg-[#FFF1F2] text-[#9F1239] border-[#FFE4E6]"
            : "bg-[#F0F9FF] text-[#075985] border-[#E0F2FE]"
            }`}
        >
          {/* Subtle Background Elements */}
          <div className={`absolute top-[-10%] right-[-5%] w-48 h-48 rounded-full blur-3xl ${status === 'school' ? 'bg-rose-400/10' : 'bg-sky-400/10'
            }`}></div>

          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-0.5">
                <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${status === 'school' ? 'text-rose-500/70' : 'text-sky-500/70'
                  }`}>Current Status</span>
                <h3 className="text-2xl font-black tracking-tight leading-tight break-keep">
                  {status === "school" ? "등교 완료" : "미등교 상태"}
                </h3>
              </div>
              <div className={`p-3 rounded-2xl shrink-0 ${status === "school" ? "bg-white text-rose-500" : "bg-white text-sky-500"
                }`}>
                {status === "school" ? <CheckCircle2 size={24} strokeWidth={3} /> : <Clock size={24} strokeWidth={3} />}
              </div>
            </div>

            <div className={`h-px w-full ${status === 'school' ? 'bg-rose-200/50' : 'bg-sky-200/50'}`}></div>

            <div className="flex justify-between items-end">
              <div className="flex flex-col gap-1.5">
                <p className={`text-[10px] font-bold ${status === 'school' ? 'text-rose-400' : 'text-sky-400'
                  }`}>활동 시각 정보</p>
                <div className="flex items-center gap-1.5 w-fit">
                  <div className={`w-2 h-2 rounded-full ${status === 'school' ? 'bg-rose-400' : 'bg-sky-400'} animate-pulse`}></div>
                  <span className="text-sm font-extrabold tracking-tight">{timeString}</span>
                </div>
              </div>
              {scanTime && (
                <div className="text-right">
                  <p className={`text-[10px] font-bold mb-0.5 ${status === 'school' ? 'text-rose-400' : 'text-sky-400'
                    }`}>최종 스캔</p>
                  <p className="text-lg font-black">{scanTime}</p>
                </div>
              )}
            </div>
          </div>
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
