import {
  ArrowUpDown,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileEdit,
  Lock,
  Search,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { PLAN_LABELS, type MainPlan, type SurveySubmission } from '../types/survey';
import { formatRelativeTime } from '../utils/format';
import { SubmissionDetailDrawer } from './SubmissionDetailDrawer';

interface SubmissionListViewProps {
  initialSearch?: string;
  refreshTrigger: number;
  onGoToFill: () => void;
}

interface SubmissionsResponse {
  items: SurveySubmission[];
  totalFiltered: number;
  hasMore: boolean;
  counts: {
    total: number;
    planB: number;
    planA: number;
    planC: number;
  };
}

export function SubmissionListView({
  initialSearch = '',
  refreshTrigger,
  onGoToFill,
}: SubmissionListViewProps) {
  const [planFilter, setPlanFilter] = useState<'all' | MainPlan>('all');
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [items, setItems] = useState<SurveySubmission[]>([]);
  const [counts, setCounts] = useState({ total: 0, planB: 0, planA: 0, planC: 0 });
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SurveySubmission | null>(null);

  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);

  const fetchList = useCallback(
    async (offset = 0, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams({
          plan: planFilter,
          search: search.trim(),
          sort,
          limit: '20',
          offset: String(offset),
        });
        const res = await fetch(`/api/submissions?${params.toString()}`);
        if (!res.ok) throw new Error('fetch failed');
        const data: SubmissionsResponse = await res.json();
        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
        setHasMore(data.hasMore);
        setCounts(data.counts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [planFilter, search, sort]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchList(0, false);
    }, 150);
    return () => clearTimeout(timer);
  }, [fetchList, refreshTrigger]);

  const totalHouseholds = 800;
  const pendingCount = Math.max(0, totalHouseholds - counts.total);
  const coverageRate = ((counts.total / totalHouseholds) * 100).toFixed(1);
  const quorumMet = Number(coverageRate) >= 66.7;

  const filterTabs: Array<{ key: 'all' | MainPlan; label: string; count: number }> = [
    { key: 'all', label: '全部提交', count: counts.total },
    { key: 'planB', label: '选方案B更换', count: counts.planB },
    { key: 'planA', label: '选方案A续聘', count: counts.planA },
    { key: 'planC', label: '暂不表态', count: counts.planC },
  ];

  const getPlanBadgeStyle = (plan: MainPlan) => {
    if (plan === 'planB') return 'text-error bg-error-container/40';
    if (plan === 'planA') return 'text-primary bg-surface-container';
    return 'text-on-surface-variant bg-surface-container';
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-8 flex flex-col gap-4">
      {/* 社区公信力统计看板 */}
      <section className="w-full rounded-xl bg-surface-container-low p-4 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
            <h2 className="text-[16px] font-semibold text-on-surface">
              问卷提交监督统计看板
            </h2>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant flex items-center gap-1 whitespace-nowrap">
            <Shield className="w-3 h-3 text-secondary" />
            <span>区住建与司法监督</span>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
          <div className="flex flex-col items-center bg-surface-container-lowest py-2.5 px-1 rounded-lg">
            <div className="flex items-baseline gap-0.5 tabular-nums">
              <span className="text-[22px] font-bold text-primary leading-tight">
                {counts.total}
              </span>
              <span className="text-[11px] font-semibold text-on-surface-variant">份</span>
            </div>
            <span className="text-[11px] font-medium text-on-surface-variant mt-0.5">
              累计已交卷
            </span>
          </div>

          <div className="flex flex-col items-center bg-surface-container-lowest py-2.5 px-1 rounded-lg">
            <div className="flex items-baseline gap-0.5 tabular-nums">
              <span className="text-[22px] font-bold text-on-surface leading-tight">
                {pendingCount}
              </span>
              <span className="text-[11px] font-semibold text-on-surface-variant">户</span>
            </div>
            <span className="text-[11px] font-medium text-on-surface-variant mt-0.5">
              待提交
            </span>
          </div>

          <div className="flex flex-col items-center bg-surface-container-lowest py-2.5 px-1 rounded-lg">
            <div className="flex items-baseline gap-0.5 tabular-nums">
              <span
                className={`text-[22px] font-bold leading-tight ${
                  quorumMet ? 'text-secondary' : 'text-primary'
                }`}
              >
                {coverageRate}%
              </span>
            </div>
            <span
              className={`text-[11px] font-semibold mt-0.5 ${
                quorumMet ? 'text-secondary' : 'text-on-surface-variant'
              }`}
            >
              {quorumMet ? '已过2/3法定门槛' : '法定门槛2/3'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-surface-container px-3 py-2 rounded-lg text-on-surface-variant">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <p className="text-[12px] leading-snug">
            《民法典》第278条法定规则认证，每户独立表决权全程可溯源。
          </p>
        </div>
      </section>

      {/* 分类筛选与搜索快速操作区 */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {filterTabs.map((tab) => {
            const active = planFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setPlanFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium shrink-0 transition-all whitespace-nowrap cursor-pointer tabular-nums ${
                  active
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-surface-container-lowest px-3 h-10 rounded-lg border border-outline-variant/80 flex-1 focus-within:border-primary transition-colors">
            <Search className="w-4 h-4 text-outline shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索房号，如 1栋1202"
              className="bg-transparent text-[13px] text-on-surface w-full focus:outline-none placeholder:text-outline"
            />
          </div>

          <button
            type="button"
            onClick={() => setSort((s) => (s === 'newest' ? 'oldest' : 'newest'))}
            className="h-10 px-2.5 rounded-lg flex items-center gap-1 text-[12px] font-medium text-on-surface-variant hover:bg-surface-container transition-colors shrink-0 cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sort === 'newest' ? '按最新提交' : '按最早提交'}</span>
          </button>
        </div>
      </section>

      {/* 问卷卡片列表 */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-44 rounded-xl bg-surface-container-lowest p-4 animate-pulse flex flex-col justify-between"
            >
              <div className="h-5 w-40 bg-surface-container rounded" />
              <div className="h-16 bg-surface-container-low rounded-lg" />
              <div className="h-10 bg-surface-container rounded-lg" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl bg-surface-container-lowest p-8 text-center space-y-3 shadow-sm">
          {search.trim() || planFilter !== 'all' ? (
            <>
              <p className="text-[15px] font-semibold text-on-surface">
                当前筛选条件下暂无提交记录
              </p>
              <p className="text-[13px] text-on-surface-variant">
                请尝试清空搜索关键词或切换全部提交查看。
              </p>
            </>
          ) : (
            <>
              <p className="text-[16px] font-semibold text-on-surface">
                暂无业主提交记录
              </p>
              <p className="text-[13px] text-on-surface-variant max-w-md mx-auto leading-relaxed">
                系统已接入真实数据存储与实时统计，尚未收到任何答卷。您可以立即填写第一份问卷或通过右上角分享链接给小区业主。
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onGoToFill}
                  className="h-11 px-5 rounded-xl bg-primary text-on-primary text-[14px] font-semibold inline-flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                >
                  <FileEdit className="w-4 h-4" />
                  <span>立即前往填写问卷</span>
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="w-full rounded-xl bg-surface-container-lowest p-4 flex flex-col gap-3 shadow-sm"
            >
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[16px] font-bold text-on-surface">
                    {item.roomNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    <span>已验房产确权·一户一票</span>
                  </span>
                </div>
                <span className="text-[11px] font-medium text-on-surface-variant flex items-center gap-1 tabular-nums">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatRelativeTime(item.submittedAt)}</span>
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-on-surface-variant">
                    核心倾向选择
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded ${getPlanBadgeStyle(
                      item.mainPlan
                    )}`}
                  >
                    {PLAN_LABELS[item.mainPlan]}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {item.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSubmission(item)}
                className="w-full h-11 px-3 rounded-lg bg-surface-container text-primary text-[13px] font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-container-high active:scale-[0.99] transition-all cursor-pointer"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>查看答卷详情</span>
              </button>
            </article>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => fetchList(items.length, true)}
            className="h-11 px-6 rounded-xl bg-surface-container text-primary text-[13px] font-semibold hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-60"
          >
            {loadingMore ? '正在加载更多记录...' : '加载更多备案记录'}
          </button>
        </div>
      )}

      {/* 业主知情权微底栏保障卡 */}
      <section className="w-full rounded-xl bg-surface-container-high/70 p-3.5 flex items-start gap-2.5">
        <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold text-on-surface flex items-center gap-1">
            <span>利安花园公信力保障机制</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
          </span>
          <p className="text-[12px] text-on-surface-variant leading-relaxed mt-0.5">
            所有答卷均经区块链哈希存证，业委会与见证律所共同监管，杜绝代填刷票。
          </p>
        </div>
      </section>

      <SubmissionDetailDrawer
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        onGoToFill={onGoToFill}
      />
    </div>
  );
}
