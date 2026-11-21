import { ButtonHTMLAttributes, ReactElement, ReactNode, Ref, isValidElement } from "react";
import { Loader2, LucideIcon } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "inverse" | "danger" | "link" | "card" | "menu" | "menuDanger" | "segment" | "field" | "option" | "calendar";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonIcon = LucideIcon | ReactElement;

type BaseProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  rounded?: boolean;
  iconClassName?: string;
  ref?: Ref<HTMLButtonElement>;
};

type LabelledButtonProps = BaseProps & {
  children: ReactNode;
  leftIcon?: ButtonIcon;
  rightIcon?: ButtonIcon;
  icon?: never;
};

type IconOnlyButtonProps = BaseProps & {
  icon: ButtonIcon;
  "aria-label": string;
  children?: never;
  leftIcon?: never;
  rightIcon?: never;
};

export type ButtonProps = LabelledButtonProps | IconOnlyButtonProps;

const BASE =
  "inline-flex items-center font-libre select-none whitespace-nowrap cursor-pointer transition-all duration-200 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primaryLight dark:focus-visible:ring-primaryDark " +
  "ring-offset-paperLight dark:ring-offset-paperDark active:scale-[0.98] " +
  "disabled:cursor-not-allowed disabled:active:scale-100";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primaryLight hover:bg-primaryHoverLight active:bg-primaryActiveLight disabled:bg-primaryDisabledLight " +
    "dark:bg-primaryDark dark:hover:bg-primaryHoverDark dark:active:bg-primaryActiveDark dark:disabled:bg-primaryDisabledDark " +
    "text-onPrimaryLight dark:text-onPrimaryDark shadow-buttonShadow dark:shadow-buttonShadowDark",
  secondary:
    "bg-secondaryLight hover:bg-secondaryHoverLight active:bg-secondaryActiveLight disabled:bg-secondaryDisabledLight " +
    "dark:bg-secondaryDark dark:hover:bg-secondaryHoverDark dark:active:bg-secondaryActiveDark dark:disabled:bg-secondaryDisabledDark " +
    "text-onSecondaryLight dark:text-onSecondaryDark shadow-buttonShadow dark:shadow-buttonShadowDark",
  outline:
    "border border-primaryLight dark:border-primaryDark bg-transparent text-primaryLight dark:text-primaryDark " +
    "hover:bg-primaryLightTone dark:hover:bg-primaryDarkDarkTone/40 disabled:opacity-50",
  ghost:
    "bg-transparent text-fontPrimaryLight dark:text-fontPrimaryDark hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50",
  inverse:
    "bg-transparent text-current hover:bg-white/15 active:bg-white/25 dark:hover:bg-black/10 dark:active:bg-black/20 " +
    "disabled:opacity-50 focus-visible:ring-current",
  danger:
    "bg-errorSolidLight dark:bg-errorSolidDark text-white hover:brightness-110 active:brightness-95 disabled:opacity-50 " +
    "shadow-buttonShadow dark:shadow-buttonShadowDark focus-visible:ring-errorLight dark:focus-visible:ring-errorDark",
  link:
    "bg-transparent text-primaryLight dark:text-primaryDark underline-offset-4 hover:underline disabled:opacity-50 active:scale-100",
  menu:
    "bg-transparent text-fontPrimaryLight dark:text-fontPrimaryDark hover:bg-panelHoverLight dark:hover:bg-panelHoverDark " +
    "aria-expanded:bg-panelHoverLight dark:aria-expanded:bg-panelHoverDark " +
    "aria-[current=page]:bg-panelSelectedLight dark:aria-[current=page]:bg-panelSelectedDark " +
    "aria-[current=page]:text-primaryLight dark:aria-[current=page]:text-primaryDark active:scale-100 disabled:opacity-50",
  menuDanger:
    "bg-transparent text-errorLight dark:text-errorDark hover:bg-errorLightTone dark:hover:bg-errorDarkTone active:scale-100 disabled:opacity-50",
  segment:
    "flex-1 min-w-0 bg-transparent text-primaryLight dark:text-primaryDark hover:bg-panelHoverLight dark:hover:bg-panelHoverDark " +
    "aria-pressed:bg-primaryLight dark:aria-pressed:bg-primaryDark aria-pressed:text-onPrimaryLight dark:aria-pressed:text-onPrimaryDark " +
    "active:scale-100 focus-visible:ring-offset-0 focus-visible:ring-inset disabled:opacity-50",
  field:
    "border border-panelBorderLight dark:border-panelBorderDark bg-panelLight dark:bg-panelDark " +
    "text-primaryLight dark:text-primaryDark hover:bg-panelHoverLight dark:hover:bg-panelHoverDark " +
    "aria-expanded:bg-panelHoverLight dark:aria-expanded:bg-panelHoverDark disabled:opacity-50",
  option:
    "bg-transparent text-fontPrimaryLight dark:text-fontPrimaryDark hover:bg-panelHoverLight dark:hover:bg-panelHoverDark " +
    "aria-pressed:bg-panelSelectedLight dark:aria-pressed:bg-panelSelectedDark " +
    "aria-pressed:text-primaryLight dark:aria-pressed:text-primaryDark active:scale-100 disabled:opacity-50 " +
    "[&>span]:min-w-0 [&>span]:flex-1 [&>span]:self-stretch",
  calendar:
    "bg-transparent text-fontPrimaryLight dark:text-fontPrimaryDark hover:bg-panelHoverLight dark:hover:bg-panelHoverDark " +
    "aria-[current=date]:font-semibold [&[aria-current=date]:not([aria-pressed=true])]:text-primaryLight dark:[&[aria-current=date]:not([aria-pressed=true])]:text-primaryDark " +
    "[&[aria-current=date]:not([aria-pressed=true])]:ring-1 [&[aria-current=date]:not([aria-pressed=true])]:ring-inset " +
    "[&[aria-current=date]:not([aria-pressed=true])]:ring-panelBorderLight dark:[&[aria-current=date]:not([aria-pressed=true])]:ring-panelBorderDark " +
    "aria-pressed:bg-primaryLight dark:aria-pressed:bg-primaryDark aria-pressed:text-onPrimaryLight dark:aria-pressed:text-onPrimaryDark " +
    "aria-pressed:font-semibold aria-pressed:shadow-buttonShadow dark:aria-pressed:shadow-buttonShadowDark " +
    "focus-visible:ring-offset-0 active:scale-95 disabled:opacity-40 disabled:hover:bg-transparent",
  card:
    "flex-col whitespace-normal text-left [&>span]:w-full bg-panelLight dark:bg-panelDark text-fontPrimaryLight dark:text-fontPrimaryDark " +
    "border border-panelBorderLight dark:border-panelBorderDark hover:bg-panelHoverLight dark:hover:bg-panelHoverDark " +
    "shadow-soft-sm dark:shadow-deep-sm hover:shadow-soft-md dark:hover:shadow-deep-md hover:scale-[1.03] " +
    "aria-pressed:bg-panelSelectedLight dark:aria-pressed:bg-panelSelectedDark aria-pressed:border-primaryLight dark:aria-pressed:border-primaryDark " +
    "aria-pressed:ring-1 aria-pressed:ring-primaryLight dark:aria-pressed:ring-primaryDark disabled:opacity-50",
};

const SIZES: Record<ButtonSize, { label: string; iconOnly: string; icon: string }> = {
  sm: { label: "px-3 py-1 text-sm gap-1.5", iconOnly: "p-1.5", icon: "w-4 h-4" },
  md: { label: "px-4 py-2 text-base gap-2", iconOnly: "p-2", icon: "w-5 h-5" },
  lg: { label: "px-5 py-2.5 text-lg gap-2", iconOnly: "p-3", icon: "w-6 h-6" },
};

const renderIcon = (icon: ButtonIcon | undefined, className: string) => {
  if (!icon) return null;
  if (isValidElement(icon)) return icon;
  const Icon = icon;
  return <Icon className={className} aria-hidden="true" focusable="false" />;
};

export default function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    loading = false,
    loadingText,
    fullWidth = false,
    rounded = false,
    iconClassName = "",
    type = "button",
    disabled,
    className = "",
    icon,
    leftIcon,
    rightIcon,
    children,
    ref,
    ...buttonProps
  } = props;

  const sizing = SIZES[size];
  const isIconOnly = Boolean(icon);
  const iconClasses = `${sizing.icon} shrink-0 ${iconClassName}`;
  const spinner = <Loader2 className={`${iconClasses} animate-spin`} aria-hidden="true" />;

  const classes = [
    BASE,
    VARIANTS[variant],
    variant === "link" ? "p-0 gap-1.5" : variant === "card" ? "p-2 text-sm" : variant === "segment" ? "px-1 py-2 gap-1 text-sm" : variant === "calendar" ? "p-0 text-sm tabular-nums" : isIconOnly ? sizing.iconOnly : sizing.label,
    variant === "menu" || variant === "menuDanger" ? "justify-start text-left" : "justify-center",
    rounded || isIconOnly ? "rounded-full" : variant === "card" ? "rounded-panel" : variant === "segment" ? "" : "rounded-control",
    fullWidth ? "w-full" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...buttonProps}
    >
      {isIconOnly ? (
        loading ? spinner : renderIcon(icon, iconClasses)
      ) : (
        <>
          {loading ? spinner : renderIcon(leftIcon, iconClasses)}
          <span>{loading && loadingText ? loadingText : children}</span>
          {!loading && renderIcon(rightIcon, iconClasses)}
        </>
      )}
    </button>
  );
}
