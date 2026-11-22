import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Ban, CircleCheck, ShieldCheck, Undo2 } from "lucide-react";
import Badge from "../../../shared/components/Badge";
import Button from "../../../shared/components/Button";
import DataTable, { Column, TableFilter } from "../../../shared/components/table/DataTable";
import { DEFAULT_AVATAR, serverAssetUrl } from "../../../shared/utils/assets";
import { useAdminUsers, useUnbanUser } from "../hooks/useAdminUsers";
import { useAuthStore } from "../stores/useAuthStore";
import { USER_ROLE, type AdminUser } from "../userTypes";
import BanUserModal from "./BanUserModal";

type Status = "active" | "banned" | "locked";

const statusOf = (user: AdminUser): Status => (user.is_banned ? "banned" : user.is_locked ? "locked" : "active");

const ROLE_KEYS = { [USER_ROLE.ADMIN]: "admin", [USER_ROLE.FREE]: "free", [USER_ROLE.PREMIUM]: "premium" } as const;

const ICON_BUTTON = "min-h-10 min-w-10 justify-center";

export default function UsersAdminTable() {
    const { t, i18n } = useTranslation("front/users");
    const currentUserId = useAuthStore((state) => state.user?.id);
    const { data: users = [], isLoading, isError, refetch } = useAdminUsers();
    const unban = useUnbanUser();
    const [banning, setBanning] = useState<AdminUser | null>(null);
    const dateFormat = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: "medium" });
    const dateTimeFormat = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: "medium", timeStyle: "short" });

    const statusLabel = (user: AdminUser) => {
        if (user.is_banned) {
            return user.banned_until
                ? t("admin.bannedUntil", { date: dateTimeFormat.format(new Date(user.banned_until)) })
                : t("admin.bannedPermanently");
        }
        if (user.is_locked && user.locked_until) return t("admin.lockedUntil", { date: dateTimeFormat.format(new Date(user.locked_until)) });
        return t("admin.active");
    };

    const filters: TableFilter<AdminUser>[] = [
        {
            kind: "select",
            key: "status",
            label: t("admin.status"),
            icon: CircleCheck,
            options: [
                { value: "", label: t("admin.allStatuses") },
                { value: "active", label: t("admin.active") },
                { value: "banned", label: t("admin.banned") },
                { value: "locked", label: t("admin.locked") },
            ],
            matches: (user, value) => statusOf(user) === value,
        },
        {
            kind: "select",
            key: "role",
            label: t("admin.role"),
            icon: ShieldCheck,
            options: [
                { value: "", label: t("admin.allRoles") },
                ...Object.entries(ROLE_KEYS).map(([role, key]) => ({ value: role, label: t(`roles.${key}`) })),
            ],
            matches: (user, value) => String(user.role) === value,
        },
    ];

    const columns: Column<AdminUser>[] = [
        {
            key: "username",
            label: t("admin.user"),
            render: (user) => (
                <span className="flex min-w-0 items-center gap-2">
                    <img src={serverAssetUrl(user.avatar_url) ?? DEFAULT_AVATAR} alt="" loading="lazy" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                    <span className="min-w-0">
                        <span className="block truncate font-semibold">{user.display_name ?? user.username}</span>
                        <span className="block truncate text-xs text-fontMutedLight dark:text-fontMutedDark">@{user.username}</span>
                    </span>
                </span>
            ),
        },
        { key: "role", label: t("admin.role"), width: "7rem", render: (user) => t(`roles.${ROLE_KEYS[user.role]}`) },
        { key: "created_at", label: t("admin.joined"), width: "8rem", render: (user) => dateFormat.format(new Date(user.created_at)) },
        {
            key: "status",
            label: t("admin.status"),
            render: (user) => (
                <span className="flex flex-col items-start gap-0.5">
                    <Badge success={statusOf(user) === "active"}>{statusLabel(user)}</Badge>
                    {user.is_banned && user.ban_reason && (
                        <span className="line-clamp-2 break-words text-xs text-fontMutedLight dark:text-fontMutedDark">{user.ban_reason}</span>
                    )}
                </span>
            ),
        },
    ];

    const rowActions = (user: AdminUser) => {
        if (user.is_banned) {
            return (
                <Button
                    variant="ghost"
                    size="sm"
                    icon={Undo2}
                    aria-label={t("admin.unban", { username: user.username })}
                    title={t("admin.unban", { username: user.username })}
                    loading={unban.isPending && unban.variables === user.id}
                    onClick={() => unban.mutate(user.id)}
                    className={ICON_BUTTON}
                />
            );
        }
        if (user.role === USER_ROLE.ADMIN || user.id === currentUserId) return null;
        return (
            <Button
                variant="ghost"
                size="sm"
                icon={Ban}
                aria-label={t("admin.ban", { username: user.username })}
                title={t("admin.ban", { username: user.username })}
                onClick={() => setBanning(user)}
                className={ICON_BUTTON}
            />
        );
    };

    return (
        <>
            <DataTable
                stateKey="admin.users"
                data={users}
                columns={columns}
                isLoading={isLoading}
                isError={isError}
                onRetry={() => void refetch()}
                searchKeys={["username", "display_name"]}
                filters={filters}
                rowLabel={(user) => user.username}
                rowActions={rowActions}
            />
            {banning && <BanUserModal user={banning} onClose={() => setBanning(null)} />}
        </>
    );
}
