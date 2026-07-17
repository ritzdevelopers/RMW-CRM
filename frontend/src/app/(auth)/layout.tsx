import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted/30">
      {/* Main content */}
      <div className="flex flex-1 items-center justify-center p-4">
        {/* Card container with shadow */}
        <div className="flex h-[min(580px,85vh)] w-full max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-xl">
          <div className="grid flex-1 lg:grid-cols-2">
            {/* Left: Form */}
            <div className="flex flex-col overflow-y-auto p-6 sm:p-8">
              {/* Logo */}
              <div className="mb-4 shrink-0">
                <Image
                  src="/images/logo-light.png"
                  alt="Ritz Media World CRM"
                  width={140}
                  height={48}
                  className="h-10 w-auto"
                  priority
                />
              </div>

              <div className="flex-1">{children}</div>
            </div>

            {/* Right: Promotional */}
            <div className="hidden bg-gradient-to-br from-slate-50 to-blue-50 p-6 lg:flex lg:flex-col lg:items-center lg:justify-center">
              <div className="text-center">
                {/* Small video */}
                <div className="mx-auto mb-4 h-32 w-32 overflow-hidden rounded-xl">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  >
                    <source src="/images/Real Estate Application.mp4" type="video/mp4" />
                  </video>
                </div>

                <h3 className="mb-2 text-base font-semibold text-slate-800">
                  Secure & Powerful CRM
                </h3>
                <p className="mx-auto max-w-[240px] text-sm leading-relaxed text-slate-600">
                  Manage your leads, track deals, and grow your business with our comprehensive CRM solution.
                </p>

                <button className="mt-4 rounded-full border border-primary px-5 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5">
                  Learn more
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 py-2 text-center text-xs text-muted-foreground">
        © 2026 Ritz Media World . All Rights Reserved
      </div>
    </div>
  );
}
