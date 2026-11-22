import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../../../shared/components/Button";

interface Props {
    liked: boolean;
    count: number;
    label: string;
    onToggle: () => void;
}

export default function LikeButton({ liked, count, label, onToggle }: Props) {
    const { t, i18n } = useTranslation("front/reviews");

    return (
        <Button
            variant="ghost"
            size="sm"
            aria-pressed={liked}
            aria-label={`${label} (${t("card.likes", { count })})`}
            leftIcon={<Heart className={`h-4 w-4 ${liked ? "fill-current text-errorLight dark:text-errorDark" : ""}`} aria-hidden="true" />}
            onClick={onToggle}
            className="min-h-10 tabular-nums"
        >
            {new Intl.NumberFormat(i18n.resolvedLanguage).format(count)}
        </Button>
    );
}
