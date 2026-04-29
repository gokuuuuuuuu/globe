import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useLanguage } from "../i18n/useLanguage";
import { useToast } from "../components/Toast";
import "./LoginPage.css";

export function LoginPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errs.email = t("请输入邮箱", "Please enter email");
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      errs.email = t("邮箱格式不正确", "Invalid email format");
    }
    if (!password) {
      errs.password = t("请输入密码", "Please enter password");
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast(t("登录成功", "Login successful"), "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      const errMsg = msg || t("邮箱或密码错误", "Invalid email or password");
      setError(errMsg);
      toast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* 背景 */}
      <div className="login-bg">
        <div className="login-bg-gradient" />
        <div className="login-bg-grid" />
      </div>

      <div className="login-container">
        {/* Logo & Title */}
        <div className="login-header">
          <div className="login-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle
                cx="20"
                cy="20"
                r="18"
                stroke="#3b82f6"
                strokeWidth="2"
                opacity="0.3"
              />
              <circle
                cx="20"
                cy="20"
                r="12"
                stroke="#3b82f6"
                strokeWidth="2"
                opacity="0.5"
              />
              <circle cx="20" cy="20" r="6" fill="#3b82f6" opacity="0.8" />
              <path
                d="M8 20 L32 20"
                stroke="#3b82f6"
                strokeWidth="1"
                opacity="0.3"
              />
              <path
                d="M20 8 L20 32"
                stroke="#3b82f6"
                strokeWidth="1"
                opacity="0.3"
              />
            </svg>
          </div>
          <h1 className="login-title">
            {t(
              "风险智能预警与训练支持系统",
              "Major Risk Intelligence Warning Platform",
            )}
          </h1>
          <p className="login-subtitle">MRIWP</p>
        </div>

        {/* Login Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div
            className={`login-field ${fieldErrors.email ? "login-field-error" : ""}`}
          >
            <label>{t("邮箱", "Email")}</label>
            <input
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email)
                  setFieldErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder={t("请输入邮箱", "Enter email")}
              autoFocus
              autoComplete="username"
            />
            {fieldErrors.email && (
              <span className="login-field-hint">{fieldErrors.email}</span>
            )}
          </div>
          <div
            className={`login-field ${fieldErrors.password ? "login-field-error" : ""}`}
          >
            <label>{t("密码", "Password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password)
                  setFieldErrors((p) => ({ ...p, password: undefined }));
              }}
              placeholder={t("请输入密码", "Enter password")}
              autoComplete="current-password"
            />
            {fieldErrors.password && (
              <span className="login-field-hint">{fieldErrors.password}</span>
            )}
          </div>

          {error && <div className="login-error">{error}</div>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? t("登录中...", "Signing in...") : t("登 录", "Sign In")}
          </button>
        </form>

        {/* Demo accounts */}
        <div className="login-demo">
          <div className="login-demo-title">
            {t("演示账号", "Demo Accounts")}
          </div>
          <div className="login-demo-list">
            <div className="login-demo-item">
              <span className="login-demo-role">
                {t("系统管理员", "Admin")}
              </span>
              <span className="login-demo-cred">
                admin@example.com / P@ssw0rd
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
