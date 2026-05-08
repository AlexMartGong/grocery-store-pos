import type { NotificationResponse } from "../types";
import { formatRelativeTime } from "../utils/relativeTime";
import { NotificationTypeIcon } from "./NotificationTypeIcon";

interface Props {
  notification: NotificationResponse;
  onMarkRead: (id: string) => void;
  disabled?: boolean;
}

export const NotificationItem = ({ notification, onMarkRead, disabled }: Props) => {
  const { id, type, title, message, created_at } = notification;
  return (
    <li>
      <button
        type="button"
        onClick={() => onMarkRead(id)}
        disabled={disabled}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <NotificationTypeIcon type={type} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-slate-800">{title}</p>
            <span className="shrink-0 text-[11px] text-slate-500">
              {formatRelativeTime(created_at)}
            </span>
          </div>
          {message && (
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{message}</p>
          )}
        </div>
      </button>
    </li>
  );
};
