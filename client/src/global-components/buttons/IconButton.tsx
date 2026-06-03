import { LucideProps } from "lucide-react";
import { ForwardRefExoticComponent, memo, RefAttributes } from "react";

interface Props {
  icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  className: string;
  iconClassName?: string;
  onClick?: () => void;
}

const IconButton = memo(function IconButton({ className = "", iconClassName = "", icon: Icon, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`p-2 hover:cursor-pointer transition-transform active:scale-95 ${className}`}
      aria-label="icon-button"
    >
      <Icon className={`w-5 h-5 ${iconClassName}`} />
    </button>
  );
});

export default IconButton;
