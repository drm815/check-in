"use client";

import { Power } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LogoutButton({ className = "" }: { className?: string }) {
    const router = useRouter();

    const handleLogout = () => {
        sessionStorage.clear();
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
