import Image from "next/image";
import Link from "next/link";

type Props = {
  subtitle: string;
  href: string;
  /** "light" = logo sur fond bordeaux (sidebar DA précédente), "dark" = logo sur fond beige */
  variant?: "dark" | "light";
};

export function HandalLogo({ subtitle, href, variant = "dark" }: Props) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-6 py-5 transition-opacity hover:opacity-80"
      style={{ textDecoration: "none" }}
    >
      <Image
        src="/brand/origina-logo-sm.png"
        alt="Handal"
        width={40}
        height={27}
        className="h-10 w-auto object-contain"
        priority
      />
      <div>
        <p
          className="text-xl font-black uppercase tracking-widest leading-none"
          style={{ color: variant === "dark" ? "var(--primary)" : "#fff" }}
        >
          ORIGINA
        </p>
        <p
          className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider leading-none"
          style={{ color: variant === "dark" ? "var(--text-soft)" : "rgba(255,255,255,0.65)" }}
        >
          {subtitle}
        </p>
      </div>
    </Link>
  );
}
