"use client";

import { Power } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LogoutButton({ className = "" }: { className?: string }) {
    const router = useRouter();

    const handleLogout = () => {
        sessionStorage.clear();
        // localStorage의 출결 기록은 로그아웃 후 재로그인 시에도 오늘 상태를 복원할 수 있도록 유지
        router.push("/login");
    };

    return (
        <button
            onClick={handleLogout}
            className={`flex items-center justify-center w-10 h-10 rounded-full text-red-500 hover:bg-red-50 transition-colors active:scale-95 ${className}`}
            title="로그아웃"
        >
            <Power size={22} strokeWidth={2.5} />
        </button>
    );
}
