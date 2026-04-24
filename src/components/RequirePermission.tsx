import { useAuthStore, type Permission } from "../store/useAuthStore";
import { useLanguage } from "../i18n/useLanguage";

interface Props {
  permission: Permission;
  children: React.ReactNode;
}

export function RequirePermission({ permission, children }: Props) {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const { t } = useLanguage();

  if (!hasPermission(permission)) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
          color: "#64748b",
          fontSize: 16,
        }}
      >
        {t("暂无访问权限", "Access Denied")}
      </div>
    );
  }

  return <>{children}</>;
}
