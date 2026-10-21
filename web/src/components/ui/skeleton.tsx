import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-[#E8E8E8] dark:bg-[#30363D]",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.5s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent dark:after:via-white/10",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
