import { useCallback, useEffect, useState } from 'react';
import { AdminLoginView } from './components/AdminLoginView';
import { AdminManageView } from './components/AdminManageView';
import { BottomNav } from './components/BottomNav';
import { Header, type ActiveTab } from './components/Header';
import { ShareSheet } from './components/ShareSheet';
import { StatisticsView } from './components/StatisticsView';
import { SubmissionListView } from './components/SubmissionListView';
import { SurveyFillView } from './components/SurveyFillView';
import type { SurveySubmission } from './types/survey';
import { readJsonSafe } from './utils/http';

const ADMIN_TOKEN_STORAGE_KEY = 'lian_admin_token';

function parseInitialRoute(): { tab: ActiveTab; search: string } {
  if (typeof window === 'undefined') return { tab: 'list', search: '' };
  const params = new URLSearchParams(window.location.search);
  const rawTab = params.get('tab');
  const search = params.get('search') || '';
  if (rawTab === 'fill' || rawTab === 'stats' || rawTab === 'list' || rawTab === 'admin') {
    return { tab: rawTab, search };
  }
  return { tab: 'list', search };
}

function getStoredAdminToken(): string {
  try {
    return window.sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export default function App() {
  const initial = parseInitialRoute();
  const [activeTab, setActiveTab] = useState<ActiveTab>(initial.tab);
  const [initialSearch] = useState<string>(initial.search);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [lastSubmittedRoom, setLastSubmittedRoom] = useState<string | undefined>(undefined);

  const [adminToken, setAdminToken] = useState<string>(getStoredAdminToken);
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [checkingAdminSession, setCheckingAdminSession] = useState<boolean>(true);

  // Verify existing admin session (cookie or sessionStorage bearer token) on mount
  useEffect(() => {
    let active = true;
    const verifyAdmin = async () => {
      try {
        const storedToken = getStoredAdminToken();
        const headers: Record<string, string> = {};
        if (storedToken) {
          headers.Authorization = `Bearer ${storedToken}`;
        }
        const res = await fetch('/api/admin/me', {
          headers,
          credentials: 'include',
        });
        const parsed = await readJsonSafe<{ authenticated?: boolean; username?: string }>(res);
        if (!active) return;
        if (parsed.ok && parsed.data?.authenticated && parsed.data.username) {
          setAdminUsername(parsed.data.username);
          if (storedToken) setAdminToken(storedToken);
        } else {
          setAdminUsername('');
          setAdminToken('');
          try {
            window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
          } catch {
            // ignore storage access issues
          }
        }
      } catch {
        if (active) {
          setAdminUsername('');
        }
      } finally {
        if (active) setCheckingAdminSession(false);
      }
    };
    verifyAdmin();
    return () => {
      active = false;
    };
  }, []);

  // Keep URL query param synced cleanly for shareable browser state
  const handleTabChange = useCallback((nextTab: ActiveTab) => {
    setActiveTab(nextTab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', nextTab);
    if (nextTab !== 'list') {
      url.searchParams.delete('search');
    }
    window.history.replaceState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Real-time Server-Sent Events subscription so stats, public list & admin list stay synced
  useEffect(() => {
    let source: EventSource | null = null;
    try {
      source = new EventSource('/api/stream');
      const bump = () => setRefreshTrigger((n) => n + 1);
      source.addEventListener('submission_created', bump);
      source.addEventListener('submission_updated', bump);
      source.addEventListener('submission_deleted', bump);
    } catch {
      // Fallback polling if SSE unavailable
    }
    return () => {
      source?.close();
    };
  }, []);

  const handleSubmitted = (sub: SurveySubmission) => {
    setLastSubmittedRoom(sub.roomNumber);
    setRefreshTrigger((n) => n + 1);
  };

  const handleAdminLoginSuccess = (token: string, username: string) => {
    setAdminToken(token);
    setAdminUsername(username);
    try {
      window.sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    } catch {
      // ignore storage errors
    }
    setRefreshTrigger((n) => n + 1);
  };

  const handleAdminLogout = useCallback(async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // ignore network error on logout
    }
    setAdminToken('');
    setAdminUsername('');
    try {
      window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Header
        activeTab={activeTab}
        isAdminAuthenticated={Boolean(adminUsername)}
        onOpenShare={() => setShareOpen(true)}
        onOpenAdmin={() => handleTabChange('admin')}
      />

      <main className="flex-1 w-full pt-20 pb-24">
        {activeTab === 'list' && (
          <SubmissionListView
            initialSearch={initialSearch}
            refreshTrigger={refreshTrigger}
            onGoToFill={() => handleTabChange('fill')}
          />
        )}

        {activeTab === 'fill' && (
          <SurveyFillView
            onSubmitted={handleSubmitted}
            onGoToStats={() => handleTabChange('stats')}
            onGoToList={() => handleTabChange('list')}
            onOpenShare={() => setShareOpen(true)}
          />
        )}

        {activeTab === 'stats' && (
          <StatisticsView
            refreshTrigger={refreshTrigger}
            onGoToFill={() => handleTabChange('fill')}
            onOpenShare={() => setShareOpen(true)}
          />
        )}

        {activeTab === 'admin' &&
          (checkingAdminSession ? (
            <div className="w-full max-w-md mx-auto px-4 pt-6">
              <div className="h-56 rounded-2xl bg-surface-container-lowest p-6 animate-pulse" />
            </div>
          ) : adminUsername ? (
            <AdminManageView
              adminToken={adminToken}
              adminUsername={adminUsername}
              refreshTrigger={refreshTrigger}
              onDataChanged={() => setRefreshTrigger((n) => n + 1)}
              onLogout={handleAdminLogout}
              onBackToPublic={() => handleTabChange('list')}
            />
          ) : (
            <AdminLoginView
              onLoginSuccess={handleAdminLoginSuccess}
              onBack={() => handleTabChange('list')}
            />
          ))}
      </main>

      <BottomNav activeTab={activeTab} onChangeTab={handleTabChange} />

      <ShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        defaultTarget={activeTab === 'admin' ? 'list' : activeTab}
        highlightRoom={lastSubmittedRoom}
      />
    </div>
  );
}
