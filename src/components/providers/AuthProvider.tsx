"use client";

import { trpc } from "@/lib/trpc";
import { setAuth } from "@/store/appSlice";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { Spinner } from "../ui/spinner";
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const { data: user, isLoading } = trpc.auth.check.useQuery();
    const dispatch = useDispatch();
    if (isLoading) {
        return <div className="flex h-[calc(100vh)] w-screen items-center justify-center">
            <div className="flex flex-col items-center justify-center space-y-3">
                <img src="/logo.png" alt="Logo" className="w-10 h-10" />
                <Spinner size={18} variant="circle" color="grey" />
            </div>
        </div>;
    }

    if (user && user.user.id) {
        dispatch(setAuth({
            loggedIn: true,
            username: user.user.username,
            id: user.user.id,
        }));
    }
    
    return <>{children}</>;
}