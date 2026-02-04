import { ReactNode } from "react";
import { PSBHeader } from "./PSBHeader";
import { Footer } from "./Footer";

interface PSBLayoutProps {
  children: ReactNode;
}

export function PSBLayout({ children }: PSBLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col font-body bg-slate-50">
      <PSBHeader />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}
