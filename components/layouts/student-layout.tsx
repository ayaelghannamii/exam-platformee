"use client";

import type React from "react";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { LogOut, LayoutDashboard, FileText, User } from "lucide-react";

export function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (user.role !== "student") {
      router.push("/teacher/dashboard");
    }
  }, [user, router]);

  if (!user || user.role !== "student") {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <div className="w-64 bg-card border-r p-4 flex flex-col">
        <div className="text-xl font-bold mb-6">Plateforme d'Examen</div>

        <nav className="space-y-1 flex-1">
          <Link href="/student/dashboard">
            <Button variant="ghost" className="w-full justify-start">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Tableau de bord
            </Button>
          </Link>
        </nav>

        <Button variant="outline" className="mt-auto w-full" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>

      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
