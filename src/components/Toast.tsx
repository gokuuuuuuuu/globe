import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let idCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} item={t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  item,
  onRemove,
}: {
  item: ToastItem;
  onRemove: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(item.id), 3000);
    return () => clearTimeout(timer);
  }, [item.id, onRemove]);

  const colors = {
    success: {
      bg: "rgba(34,197,94,0.15)",
      border: "rgba(34,197,94,0.3)",
      color: "#4ade80",
      icon: "\u2713",
    },
    error: {
      bg: "rgba(239,68,68,0.15)",
      border: "rgba(239,68,68,0.3)",
      color: "#f87171",
      icon: "\u2717",
    },
    info: {
      bg: "rgba(59,130,246,0.15)",
      border: "rgba(59,130,246,0.3)",
      color: "#60a5fa",
      icon: "\u2139",
    },
  };
  const c = colors[item.type];

  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 8,
        padding: "10px 16px",
        color: c.color,
        fontSize: 13,
        display: "flex",
        alignItems: "center",
        gap: 8,
        pointerEvents: "auto",
        backdropFilter: "blur(12px)",
        minWidth: 200,
        maxWidth: 400,
        animation: "toast-in 0.25s ease-out",
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 700 }}>{c.icon}</span>
      <span style={{ flex: 1 }}>{item.message}</span>
      <span
        style={{ cursor: "pointer", opacity: 0.6, fontSize: 14 }}
        onClick={() => onRemove(item.id)}
      >
        &times;
      </span>
    </div>
  );
}
