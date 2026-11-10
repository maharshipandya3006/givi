import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-12 px-4 bg-background">
      <div className="mb-6 text-center">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white mx-auto mb-2 shadow-sm">
          <span className="font-black text-sm">g.</span>
        </div>
        <h1 className="text-xl font-black text-ink tracking-tight">Sign in to Givi</h1>
        <p className="text-xs text-ink-muted mt-1">Direct community micro-relief with 0% platform fee</p>
      </div>

      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "bg-surface border border-border shadow-card rounded-3xl",
            formButtonPrimary: "bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold rounded-xl",
            footerActionLink: "text-[#166534] hover:underline",
          },
        }}
        fallbackRedirectUrl="/feed"
        forceRedirectUrl="/feed"
        signUpUrl="/sign-up"
      />
    </div>
  );
}

