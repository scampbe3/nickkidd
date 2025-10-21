// components/Skeleton.tsx
type Props = { className?: string };

export default function Skeleton({ className = "" }: Props) {
  return (
    <div
      className={`overflow-hidden rounded-xl bg-[linear-gradient(110deg,#eeeeee_8%,#f5f5f5_18%,#eeeeee_33%)]
                  [background-size:200%_100%] animate-[shimmer_1.2s_infinite]
                  dark:bg-[linear-gradient(110deg,#1f1f1f_8%,#272727_18%,#1f1f1f_33%)]
                  ${className}`}
      style={{
        // fallback if Tailwind can't parse the keyframes
        animation: "shimmer 1.2s infinite",
      }}
    />
  );
}
