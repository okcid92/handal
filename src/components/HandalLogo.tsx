import Image from "next/image";
import Link from "next/link";

type Props = {
  subtitle: string;
  href: string;
  variant?: "dark" | "light";
};

export function HandalLogo({ subtitle, href, variant = "dark" }: Props) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-6 py-5 transition-opacity hover:opacity-90"
      style={{ textDecoration: "none" }}
    >
      <Image
        src="/brand/handal-lamp.png"
        alt="Handal"
        width={48}
        height={48}
        className="h-12 w-auto object-contain"
        style={{ height: "auto" }}
        priority
      />
      <div>
        <p
          className="text-[1.35rem] font-black uppercase tracking-[0.08em] leading-none"
          style={{ color: variant === "dark" ? "var(--primary)" : "#fff" }}
        >
          HANDAL
        </p>
        <p
          className="mt-1 text-[10px] font-semibold uppercase tracking-[0.09em] leading-none"
          style={{
            color:
              variant === "dark"
                ? "var(--text-soft)"
                : "rgba(255,255,255,0.65)",
          }}
        >
          {subtitle}
        </p>
      </div>
    </Link>
  );
}
