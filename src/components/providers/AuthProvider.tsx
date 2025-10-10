"use client";

import { trpc } from "@/lib/trpc";
import { setAuth } from "@/store/appSlice";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Spinner } from "../ui/spinner";
import { usePathname, useRouter } from "next/navigation";

const AUTHED_PATHS = ['/home', '/class', '/profile', '/agenda', '/chat']

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const { data: user, isLoading } = trpc.auth.check.useQuery();
    const dispatch = useDispatch();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
    if (user && user.user.id) {
        dispatch(setAuth({
            loggedIn: true,
            username: user.user.username,
            profilePicture: user.user.profile?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.user.username}`,
            displayName: user.user.profile?.displayName || user.user.username,
            bio: user.user.profile?.bio || '',
            location: user.user.profile?.location || '',
            website: user.user.profile?.website || '',
            id: user.user.id,
        }));
    }
}, [user]);

    useEffect(() => {
        if (!user && !isLoading && AUTHED_PATHS.some(path => pathname.startsWith(path))) {
            router.push('/login');
        }
    }, [user]);

    if (isLoading) {
        return <div className="flex h-[calc(100vh)] w-screen items-center justify-center">
            <div className="flex flex-col items-center justify-center space-y-3">
                <img src="/logo.png" alt="Logo" className="w-10 h-10" />
                <Spinner size={18} variant="circle" color="grey" />
            </div>
        </div>;
    }
    
    return <>{children}</>;
}