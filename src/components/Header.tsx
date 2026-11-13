import { BadgeCheck, Share2 } from 'lucide-react';

export type ActiveTab = 'list' | 'fill' | 'stats';

interface HeaderProps {
  activeTab: ActiveTab;
  onOpenShare: () => void;
}

const TAB_TITLES: Record<ActiveTab, { title: string; subtitle: string }> = {
  list: {
    title: '物业处置问卷·业主提交记录',
    subtitle: '利安花园业主大会秘书处 · 一户一票实名备案',
  },
  fill: {
    title: '问卷填写',
    subtitle: '利安花园业主大会秘书处',
  },
  stats: {
    title: '结果统计',
    subtitle: '利安花园业主大会秘书处',
  },
};

export function Header({ activeTab, onOpenShare }: HeaderProps) {
  const { title, subtitle } = TAB_TITLES[activeTab];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(11,28,48,0.05)]">
      <div className="h-16 max-w-5xl mx-auto px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0">
            <BadgeCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[15px] sm:text-[16px] font-semibold text-on-surface tracking-tight leading-none truncate">
                {title}
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-semibold leading-tight shrink-0 whitespace-nowrap">
                业委会认证
              </span>
            </div>
            <span className="text-[11px] font-medium text-on-surface-variant leading-tight mt-1 truncate">
              {subtitle}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenShare}
          aria-label="分享问卷与统计链接"
          className="h-9 px-3 rounded-full bg-primary text-on-primary flex items-center justify-center gap-1.5 shrink-0 text-[12px] font-semibold shadow-sm hover:bg-primary-container active:scale-95 transition-all cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span className="whitespace-nowrap">分享</span>
        </button>
      </div>
    </header>
  );
}
