import { ReactNode } from "react";
import { BottomNavBar } from "@/components/BottomNavBar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="h-[100dvh] w-full flex justify-center">
      <div className="flex flex-col w-full max-w-[34rem] h-full">
        <div className="flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
        <BottomNavBar />
        <div className="pb-[env(safe-area-inset-bottom)] bg-background" />
      </div>
    </div>
  );
}
