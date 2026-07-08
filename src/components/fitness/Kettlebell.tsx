import daumenUrl from "@/assets/kettlebell_daumenhoch.png";
import tippUrl from "@/assets/kettlebell_tipp.png";

export type KettlebellMood = "good" | "tip";

export function Kettlebell({
  mood = "good",
  size = 96,
  className = "",
}: {
  mood?: KettlebellMood;
  size?: number;
  className?: string;
}) {
  const src = mood === "good" ? daumenUrl : tippUrl;
  const alt = mood === "good" ? "Kettlebell zeigt Daumen hoch – im grünen Bereich" : "Kettlebell zeigt Tipp – hier lohnt sich ein Blick";
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      className={className}
    />
  );
}
