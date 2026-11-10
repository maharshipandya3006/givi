import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#166534]/15 border border-[#166534]/30 flex items-center justify-center text-[#166534] mb-4">
        <Zap className="w-6 h-6 fill-[#166534]" />
      </div>
      <h2 className="text-2xl font-bold text-ink mb-2">Page Not Found</h2>
      <p className="text-xs text-ink-muted max-w-sm mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-xl bg-[#166534] text-white font-bold text-xs flex items-center gap-2 hover:bg-[#14532d] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return Home</span>
      </Link>
    </div>
  );
}

