import * as React from "react";
import { cn } from "@/lib/utils";

// --- SVG Icons ---

const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const MastercardIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="36"
    height="24"
  >
    <circle cx="8" cy="12" r="7" fill="#EA001B" />
    <circle cx="16" cy="12" r="7" fill="#F79E1B" fillOpacity="0.85" />
  </svg>
);

const PayPalIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    width="28"
    height="24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20.067 8.478c-.492 4.02-3.197 5.4-6.326 5.4h-2.17l-1.07 6.782h-3.6l3.19-20.2h6.195c3.21 0 5.498 1.458 4.781 8.018z"
      fill="#0079C1"
    />
    <path
      d="M17.158 13.878c-.426 3.483-2.77 4.678-5.48 4.678h-1.88l-.928 5.877H5.75l2.763-17.5h5.367c2.781 0 4.763 1.263 4.141 6.945z"
      fill="#00457C"
    />
  </svg>
);

// --- Helper Components ---

const DashedLine = () => (
  <div
    className="w-full border-t-2 border-dashed border-border"
    aria-hidden="true"
  />
);

const Barcode = ({ value }: { value: string }) => {
  const hashCode = (s: string) =>
    s.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
  const seed = hashCode(value);
  const random = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const bars = Array.from({ length: 56 }).map((_, index) => {
    const rand = random(seed + index);
    const width = rand > 0.7 ? 2.5 : 1.5;
    return { width };
  });

  const spacing = 1.5;
  const totalWidth =
    bars.reduce((acc, bar) => acc + bar.width + spacing, 0) - spacing;
  const svgWidth = 230;
  const svgHeight = 56;
  let currentX = (svgWidth - totalWidth) / 2;

  return (
    <div className="flex flex-col items-center py-1">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        aria-label={`Barcode for value ${value}`}
        className="fill-current text-ink"
      >
        {bars.map((bar, index) => {
          const x = currentX;
          currentX += bar.width + spacing;
          return (
            <rect
              key={index}
              x={x}
              y="6"
              width={bar.width}
              height="44"
              rx="0.5"
            />
          );
        })}
      </svg>
      <p className="text-[11px] font-mono text-ink-muted tracking-[0.25em] mt-1.5 uppercase">
        {value}
      </p>
    </div>
  );
};

const ConfettiExplosion = () => {
  const confettiCount = 65;
  // Hallmark green & gold festive palette
  const colors = [
    "#166534",
    "#22c55e",
    "#10b981",
    "#15803d",
    "#f59e0b",
    "#eab308",
    "#d97706",
    "#ffffff",
  ];

  return (
    <>
      <style>
        {`
          @keyframes fall {
            0% {
              transform: translateY(-8vh) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(105vh) rotate(720deg);
              opacity: 0;
            }
          }
        `}
      </style>
      <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden" aria-hidden="true">
        {Array.from({ length: confettiCount }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-3.5 rounded-sm shadow-sm"
            style={{
              left: `${(i * 1.5 + Math.random() * 3) % 100}%`,
              top: `${-15 + Math.random() * 10}%`,
              backgroundColor: colors[i % colors.length],
              transform: `rotate(${Math.random() * 360}deg)`,
              animation: `fall ${2.2 + Math.random() * 2}s ${Math.random() * 1.5}s linear forwards`,
            }}
          />
        ))}
      </div>
    </>
  );
};

// --- Main Ticket Component ---

export interface TicketProps extends React.HTMLAttributes<HTMLDivElement> {
  ticketId: string;
  amount: number;
  date: Date;
  cardHolder: string;
  last4Digits: string;
  barcodeValue: string;
  icon?: React.ReactNode;
  title?: string;
  subtitle?: string;
  paymentMethod?: "paypal" | "card" | string;
}

const AnimatedTicket = React.forwardRef<HTMLDivElement, TicketProps>(
  (
    {
      className,
      ticketId,
      amount,
      date,
      cardHolder,
      last4Digits,
      barcodeValue,
      icon,
      title = "Wallet Filled!",
      subtitle = "Your givi. wallet has been credited successfully",
      paymentMethod = "paypal",
      ...props
    },
    ref
  ) => {
    const [showConfetti, setShowConfetti] = React.useState(false);

    React.useEffect(() => {
      const mountTimer = setTimeout(() => setShowConfetti(true), 100);
      const unmountTimer = setTimeout(() => setShowConfetti(false), 5000);
      return () => {
        clearTimeout(mountTimer);
        clearTimeout(unmountTimer);
      };
    }, []);

    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

    const formattedDate = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date).replace(",", " •");

    return (
      <>
        {showConfetti && <ConfettiExplosion />}
        <div
          ref={ref}
          className={cn(
            "relative w-full max-w-sm bg-surface-elevated/70 border border-border text-ink rounded-3xl shadow-xl font-sans z-10 transition-all",
            "animate-in fade-in-0 zoom-in-95 duration-500",
            className
          )}
          {...props}
        >
          {/* Ticket cut-out effect */}
          <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-surface border border-border shadow-inner" />
          <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-surface border border-border shadow-inner" />

          {/* Ticket Header & Status */}
          <div className="p-6 pb-5 flex flex-col items-center text-center">
            <div className="p-3 bg-[#166534]/15 border border-[#166534]/25 rounded-2xl animate-in zoom-in-50 delay-150 duration-500 shadow-sm shadow-[#166534]/10">
              {icon ?? (
                <CheckCircleIcon className="w-8 h-8 text-[#166534] animate-in zoom-in-75 delay-300 duration-500" />
              )}
            </div>
            <h3 className="text-xl font-black text-ink mt-3">{title}</h3>
            <p className="text-xs text-ink-muted mt-1 max-w-[260px] leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="px-6 pb-6 space-y-4">
            <DashedLine />

            {/* Reference ID & Amount */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div>
                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                  Reference ID
                </p>
                <p className="font-mono font-bold text-xs text-ink mt-0.5">
                  {ticketId}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                  Preloaded Amount
                </p>
                <p className="font-black text-lg text-[#166534] font-mono mt-0.5">
                  {formattedAmount}
                </p>
              </div>
            </div>

            {/* Date & Time */}
            <div>
              <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                Date & Time
              </p>
              <p className="font-semibold text-xs text-ink mt-0.5">
                {formattedDate}
              </p>
            </div>

            {/* Payment Method Badge */}
            <div className="bg-background/80 border border-border p-3 rounded-2xl flex items-center space-x-3.5 shadow-sm">
              {paymentMethod === "paypal" ? (
                <PayPalIcon className="flex-shrink-0" />
              ) : (
                <MastercardIcon className="flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1 text-left">
                <p className="font-bold text-xs text-ink truncate">
                  {cardHolder}
                </p>
                <p className="text-ink-muted font-mono text-[11px] tracking-wider">
                  {paymentMethod === "paypal"
                    ? "PayPal Instant Settlement"
                    : `•••• ${last4Digits}`}
                </p>
              </div>
            </div>

            <DashedLine />

            {/* Barcode */}
            <Barcode value={barcodeValue} />
          </div>
        </div>
      </>
    );
  }
);

AnimatedTicket.displayName = "AnimatedTicket";

export { AnimatedTicket };

