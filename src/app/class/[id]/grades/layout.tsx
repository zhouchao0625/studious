"use client";

import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import { useParams, usePathname, useRouter } from "next/navigation";

export default function GradesLayout({ children }: { children: React.ReactNode }) {
    const appState = useSelector((state: RootState) => state.app);  
    const router = useRouter();
    const pathname = usePathname();
    const { id } = useParams();
    if (appState.user.student && pathname !== `/class/${id}/grades/student/${appState.user.id}`) {
        router.push(`/class/${id}/grades/student/${appState.user.id}`);
    }
    return children;
}