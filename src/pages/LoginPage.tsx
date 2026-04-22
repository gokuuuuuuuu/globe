import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useLanguage } from "../i18n/useLanguage";
import "./LoginPage.css";

export function LoginPage() {
  const { t } = useLanguage();
  const login = useAuthStore((s) => s.login);
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!employeeId || !password) {
      setError(t("请输入联合办公账号和密码", "Please enter employee ID and password"));
      return;
    }
    setLoading(true);
    // 模拟网络延迟
    setTimeout(() => {
      const ok = login(employeeId, password);
      if (!ok) {
        setError(t("联合办公账号或密码错误", "Invalid employee ID or password"));
      }
      setLoading(false);
    }, 400);
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
              "重大风险智能预警平台",
              "Major Risk Intelligence Warning Platform",
            )}
          </h1>
          <p className="login-subtitle">MRIWP</p>
        </div>

        {/* Login Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label>{t("联合办公账号", "Employee ID")}</label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder={t("请输入联合办公账号", "Enter employee ID")}
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="login-field">
            <label>{t("密码", "Password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("请输入密码", "Enter password")}
              autoComplete="current-password"
            />
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
              <span className="login-demo-cred">admin / admin123</span>
              <span className="login-demo-scope">
                {t("全量数据", "Full data")}
              </span>
            </div>
            <div className="login-demo-item">
              <span className="login-demo-role">
                {t("安全管理者", "Safety")}
              </span>
              <span className="login-demo-cred">safety01 / safety123</span>
              <span className="login-demo-scope">
                {t("全量数据", "Full data")}
              </span>
            </div>
            <div className="login-demo-item">
              <span className="login-demo-role">
                {t("飞行总队", "Flight HQ")}
              </span>
              <span className="login-demo-cred">pilot01 / pilot123</span>
              <span className="login-demo-scope">
                {t("本单位数据", "Unit only")}
              </span>
            </div>
            <div className="login-demo-item">
              <span className="login-demo-role">{t("云南", "Yunnan")}</span>
              <span className="login-demo-cred">pilot02 / pilot123</span>
              <span className="login-demo-scope">
                {t("本单位数据", "Unit only")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
