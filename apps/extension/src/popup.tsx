import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { Button } from "@repo/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@repo/ui/avatar";
import { Badge } from "@repo/ui/badge";
import { Spinner } from "@repo/ui/spinner";
import { Switch } from "@repo/ui/switch";
import "./styles.css";

interface User {
  login: string;
  email?: string;
  avatar_url: string;
}

interface Notification {
  id: string;
  repository: {
    full_name: string;
  };
  subject: {
    title: string;
    type: string;
    url: string;
    latest_comment_url?: string;
  };
  reason: string;
  unread: boolean;
  updated_at: string;
}

const IMPORTANT_REASONS = ["mention", "review_requested", "author"];

function filterImportantNotifications(
  notifications: Notification[]
): Notification[] {
  return notifications.filter(
    (n) => n.unread && IMPORTANT_REASONS.includes(n.reason)
  );
}

type View = "notifications" | "settings";

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function getTypeIcon(type: string): string {
  switch (type) {
    case "Issue":
      return "○";
    case "PullRequest":
      return "⎇";
    case "Release":
      return "◆";
    case "Discussion":
      return "◇";
    default:
      return "●";
  }
}

function App() {
  const [view, setView] = useState<View>("notifications");
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const stored = await chrome.storage.local.get(["github_token", "user"]);

      if (!stored.github_token) {
        setLoading(false);
        return;
      }

      if (stored.user) {
        setUser(stored.user);
      }

      const response = await fetch("https://api.github.com/notifications", {
        headers: {
          Authorization: `Bearer ${stored.github_token}`,
          Accept: "application/vnd.github+json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      console.log("data", data);
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    await chrome.tabs.create({
      url: "http://localhost:3000/api/auth/signin?callbackUrl=/auth/success",
    });
    window.close();
  }

  async function handleLogout() {
    await chrome.storage.local.remove(["github_token", "user"]);
    setUser(null);
    setNotifications([]);
  }

  async function markAsRead(notificationId: string, token: string) {
    try {
      console.log("Marking as read:", notificationId);
      const response = await fetch(`https://api.github.com/notifications/threads/${notificationId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      console.log("Mark as read status:", response.status);
      setNotifications((prev) =>
        prev.filter((n) => n.id !== notificationId)
      );
      chrome.runtime.sendMessage({ type: "REFRESH_NOTIFICATIONS" });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  }

  async function openNotification(notification: Notification) {
    const stored = await chrome.storage.local.get(["github_token"]);

    if (!stored.github_token) {
      const fallbackUrl = notification.subject.url
        ?.replace("api.github.com/repos", "github.com")
        ?.replace("/pulls/", "/pull/");
      if (fallbackUrl) chrome.tabs.create({ url: fallbackUrl });
      return;
    }

    if (notification.unread) {
      markAsRead(notification.id, stored.github_token);
    }

    try {
      const threadUrl = `https://api.github.com/notifications/threads/${notification.id}`;
      const response = await fetch(threadUrl, {
        headers: {
          Authorization: `Bearer ${stored.github_token}`,
          Accept: "application/vnd.github+json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.subject?.latest_comment_url) {
          const commentResponse = await fetch(data.subject.latest_comment_url, {
            headers: {
              Authorization: `Bearer ${stored.github_token}`,
              Accept: "application/vnd.github+json",
            },
          });
          if (commentResponse.ok) {
            const commentData = await commentResponse.json();
            if (commentData.html_url) {
              chrome.tabs.create({ url: commentData.html_url });
              return;
            }
          }
        }

        if (data.subject?.url) {
          const subjectResponse = await fetch(data.subject.url, {
            headers: {
              Authorization: `Bearer ${stored.github_token}`,
              Accept: "application/vnd.github+json",
            },
          });
          if (subjectResponse.ok) {
            const subjectData = await subjectResponse.json();
            if (subjectData.html_url) {
              chrome.tabs.create({ url: subjectData.html_url });
              return;
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch notification URL:", error);
    }

    const fallbackUrl = notification.subject.url
      ?.replace("api.github.com/repos", "github.com")
      ?.replace("/pulls/", "/pull/");
    if (fallbackUrl) chrome.tabs.create({ url: fallbackUrl });
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <Spinner className="size-6" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <div className="auth-container">
          <svg
            className="icon"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          <h2 className="mb-2 text-lg font-semibold">Sign in to GitHub</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Connect your GitHub account to view notifications
          </p>
          <Button onClick={handleLogin}>Sign in with GitHub</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <div className="user-info">
          <Avatar>
            <AvatarImage
              src={user.avatar_url}
              alt={user.login}
              className="rounded-full max-h-10 max-w-10"
            />
            <AvatarFallback>
              {user.login?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="user-details">
            <span className="username">{user.login}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              setView(view === "settings" ? "notifications" : "settings")
            }
            className="cursor-pointer text-lg"
          >
            {view === "settings" ? "←" : "⚙"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </div>

      <div className="content">
        {view === "settings" ? (
          <div className="p-5">
            <h3 className="text-base font-semibold mb-4">Settings</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    Desktop notifications
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Get notified about new activity
                  </span>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Badge count</span>
                  <span className="text-xs text-muted-foreground">
                    Show unread count on icon
                  </span>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Auto-refresh</span>
                  <span className="text-xs text-muted-foreground">
                    Refresh every 5 minutes
                  </span>
                </div>
                <Switch />
              </div>
            </div>
            <div className="mt-6 pt-4 border-t flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  chrome.runtime.sendMessage({ type: "TEST_NOTIFICATION" });
                }}
              >
                Test Notification
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const mockNotification: Notification = {
                    id: `mock-${Date.now()}`,
                    repository: { full_name: "octocat/Hello-World" },
                    subject: {
                      title: "@you was mentioned in: Fix bug in auth flow",
                      type: "PullRequest",
                      url: "https://api.github.com/repos/octocat/Hello-World/pulls/1",
                    },
                    reason: "mention",
                    unread: true,
                    updated_at: new Date().toISOString(),
                  };
                  setNotifications((prev) => [mockNotification, ...prev]);
                  chrome.runtime.sendMessage({
                    type: "MOCK_MENTION",
                    notification: mockNotification,
                  });
                }}
              >
                Mock Mention
              </Button>
            </div>
          </div>
        ) : error ? (
          <div className="empty-state">
            <span className="text-2xl">⚠</span>
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : filterImportantNotifications(notifications).length === 0 ? (
          <div className="empty-state">
            <span className="text-3xl">🎉</span>
            <p className="font-medium">All caught up!</p>
            <p>No mentions or review requests</p>
          </div>
        ) : (
          filterImportantNotifications(notifications).map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${notification.unread ? "unread" : ""}`}
              onClick={() => openNotification(notification)}
            >
              <div className="notification-indicator">
                {notification.unread && <div className="unread-dot" />}
              </div>
              <div className="notification-content">
                <div className="notification-header">
                  <span className="notification-repo">
                    {notification.repository.full_name}
                  </span>
                  <span className="notification-time">
                    {formatTime(notification.updated_at)}
                  </span>
                </div>
                <div className="notification-title">
                  {notification.subject.title}
                </div>
                <div className="notification-meta">
                  <Badge variant="outline" size="sm">
                    {getTypeIcon(notification.subject.type)}{" "}
                    {notification.subject.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {notification.reason}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
