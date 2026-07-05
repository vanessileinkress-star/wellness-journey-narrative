import kettlebell from "@/assets/kettlebell.png";

export function Kettlebell({ size = 96, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={kettlebell}
      alt="Kettlebell-Maskottchen"
      width={size}
      height={size}
      loading="lazy"
      className={className}
      style={{ imageRendering: "auto" }}
    />
  );
}
