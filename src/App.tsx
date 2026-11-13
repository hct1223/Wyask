import { useEffect, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { Header, type ActiveTab } from './components/Header';
import { ShareSheet } from './components/ShareSheet';
import { StatisticsView } from './components/StatisticsView';
import { SubmissionListView } from './components/SubmissionListView';
import { SurveyFillView } from './components/SurveyFillView';
import type { SurveySubmission } from './types/survey';

function parseInitialRoute(): { tab: ActiveTab; search: string } {
  if (typeof window === 'undefined') return { tab: 'list', search: '' };
  const params = new URLSearchParams(window.location.search);
  const rawTab = params.get('tab');
  const search = params.get('search') || '';
  if (rawTab === 'fill' || rawTab === 'stats' || rawTab === 'list') {
    return { tab: rawTab, search };
  }
  return { tab: 'list', search };
}

export default function App() {
  const initial = parseInitialRoute();
  const [activeTab, setActiveTab] = useState<ActiveTab>(initial.tab);
  const [initialSearch] = useState<string>(initial.search);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [lastSubmittedRoom, setLastSubmittedRoom] = useState<string | undefined>(undefined);

  // Keep URL query param synced cleanly for shareable browser state
  const handleTabChange = (nextTab: ActiveTab) => {
    setActiveTab(nextTab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', nextTab);
    if (nextTab !== 'list') {
      url.searchParams.delete('search');
    }
    window.history.replaceState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Real-time Server-Sent Events subscription so stats & list update immediately
  useEffect(() => {
    let source: EventSource | null = null;
    try {
      source = new EventSource('/api/stream');
      source.addEventListener('submission_created', () => {
        setRefreshTrigger((n) => n + 1);
      });
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

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Header activeTab={activeTab} onOpenShare={() => setShareOpen(true)} />

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
      </main>

      <BottomNav activeTab={activeTab} onChangeTab={handleTabChange} />

      <ShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        defaultTarget={activeTab}
        highlightRoom={lastSubmittedRoom}
      />
    </div>
  );
}
