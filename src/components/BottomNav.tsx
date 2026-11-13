import { BarChart3, FileEdit, LayoutList } from 'lucide-react';
import type { ActiveTab } from './Header';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
}

export function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  const items: Array<{ key: ActiveTab; label: string; Icon: typeof LayoutList }> = [
    { key: 'list', label: '问卷列表', Icon: LayoutList },
    { key: 'fill', label: '问卷填写', Icon: FileEdit },
    { key: 'stats', label: '结果统计', Icon: BarChart3 },
  ];

  return (
    <nav
      aria-label="主导航"
      className="fixed bottom-0 left-0 right-0 z-40 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-2px_12px_rgba(11,28,48,0.05)] border-t border-surface-container"
    >
      <div className="h-16 max-w-5xl mx-auto px-4 grid grid-cols-3 gap-2 items-center">
        {items.map(({ key, label, Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChangeTab(key)}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 min-h-[48px] rounded-xl transition-colors cursor-pointer ${
                isActive
                  ? 'text-primary font-semibold bg-surface-container-low'
                  : 'text-on-surface-variant hover:text-on-surface font-medium'
              }`}
            >
              <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.4 : 1.9} />
              <span className="text-[12px] leading-tight whitespace-nowrap">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
