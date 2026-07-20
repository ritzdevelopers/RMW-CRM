import { cn } from '@/lib/utils';

interface AppleSpinnerProps {
  /** Diameter of the spinner in pixels. */
  size?: number;
  className?: string;
}

const BARS = Array.from({ length: 12 });

/**
 * macOS / iOS style activity indicator: 12 fading bars rotating around a center.
 */
export function AppleSpinner({ size = 20, className }: AppleSpinnerProps) {
  return (
    <span
      className={cn('apple-spinner', className)}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    >
      {BARS.map((_, i) => (
        <span
          key={i}
          className="apple-spinner__bar"
          style={{
            transform: `rotate(${i * 30}deg)`,
            animationDelay: `${(i * 100) - 1200}ms`,
          }}
        />
      ))}
    </span>
  );
}
