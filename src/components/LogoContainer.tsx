import { cn } from "@/lib/utils";

interface LogoContainerProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Wraps logos in a container that adds a white pill background in dark mode
 * to ensure logo visibility against dark backgrounds.
 */
export function LogoContainer({ className, children }: LogoContainerProps) {
  return (
    <div className={cn(
      "flex items-center justify-center flex-shrink-0 dark:bg-white dark:rounded-md dark:p-0.5",
      className
    )}>
      {children}
    </div>
  );
}
