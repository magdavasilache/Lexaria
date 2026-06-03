import { Star } from "lucide-react";
import { useState } from "react";

type RatingProps = {
  value?: number;
  onChange?: (value: number) => void;
};

export function StarsRating({ value = 0, onChange }: RatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value;

  const getStarState = (index: number) => {
    const diff = displayValue - index;
    if (diff >= 1) return "full";
    if (diff >= 0.5) return "half";
    return "empty";
  };

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    index: number
  ) => {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const isHalf = e.clientX - left < width / 2;
    setHoverValue(index + (isHalf ? 0.5 : 1));
  };

  const handleClick = () => {
    if (hoverValue && onChange) onChange(hoverValue);
  };

  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const state = getStarState(i);
        const isFull = state === "full";
        const isHalf = state === "half";

        return (
          <div
            key={i}
            onMouseMove={(e) => handleMouseMove(e, i)}
            onMouseLeave={() => setHoverValue(null)}
            onClick={handleClick}
            className="
          relative w-6 h-6
          cursor-pointer
          text-secondaryLight dark:text-secondaryDark
        "
          >
            <Star
              className="absolute inset-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            />

            {isFull && (
              <Star
                className="absolute inset-0"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth={1.5}
              />
            )}

            {isHalf && (
              <div className="absolute inset-0 w-1/2 overflow-hidden">
                <Star
                  className="w-6 h-6"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth={1.5}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
