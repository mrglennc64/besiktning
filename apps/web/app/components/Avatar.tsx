import Image from "next/image";
import { existsSync } from "node:fs";
import path from "node:path";

interface AvatarProps {
  slug: string;
  alt: string;
  className?: string;
  size?: number;
}

/**
 * Renders the member's headshot from /public/medlemmar/<slug>.jpg if present,
 * else a warm gradient placeholder. No broken-image flash on the slow path.
 *
 * Server component — file existence is checked at render time, so dropping a
 * new photo into /public/medlemmar/ shows up on the next request.
 */
export function Avatar({ slug, alt, className = "", size = 240 }: AvatarProps) {
  const candidates = ["jpg", "jpeg", "png", "webp"];
  const publicDir = path.join(process.cwd(), "public", "medlemmar");
  const found = candidates.find((ext) =>
    existsSync(path.join(publicDir, `${slug}.${ext}`)),
  );

  if (found) {
    return (
      <Image
        src={`/medlemmar/${slug}.${found}`}
        alt={alt}
        width={size}
        height={size}
        className={`aspect-square w-full rounded-2xl object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`aspect-square w-full rounded-2xl bg-gradient-to-br from-amber-100 via-stone-100 to-stone-200 ${className}`}
      aria-label={`${alt} (foto saknas)`}
    />
  );
}
