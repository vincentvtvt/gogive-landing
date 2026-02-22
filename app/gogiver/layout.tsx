// FILE: app/gogiver/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GoGive — Refer & Earn',
  description: 'Earn rewards by sharing great services with people you know.',
};

export default function GoGiverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0C0A1D] text-white">
      {/* Ambient gradient mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/6 rounded-full blur-[100px]" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
