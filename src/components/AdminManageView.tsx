import {
  AlertTriangle,
  ArrowUpDown,
  ClipboardCheck,
  Edit3,
  LogOut,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { PLAN_LABELS, type MainPlan, type SurveySubmission } from '../types/survey';
import { formatRelativeTime } from '../utils/format';
import { readJsonSafe } from '../utils/http';
import { AdminSubmissionModal } from './AdminSubmissionModal';
import { SubmissionDetailDrawer } from './SubmissionDetailDrawer';

interface AdminManageViewProps {
  adminToken: string;
  adminUsername: string;
  refreshTrigger: number;
  onDataChanged: () => void;
  onLogout: () => void;
  onBackToPublic: () => void;
}

interface AdminSubmissionsResponse {
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

export function AdminManageView({
  adminToken,
  adminUsername,
  refreshTrigger,
  onDataChanged,
  onLogout,
  onBackToPublic,
}: AdminManageViewProps) {
  const [planFilter, setPlanFilter] = useState<'all' | MainPlan>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [items, setItems] = useState<SurveySubmission[]>([]);
  const [counts, setCounts] = useState({ total: 0, planB: 0, planA: 0, planC: 0 });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [detailTarget, setDetailTarget] = useState<SurveySubmission | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SurveySubmission | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SurveySubmission | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAdminList = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const params = new URLSearchParams({
        plan: planFilter,
        search: search.trim(),
        sort,
        limit: '100',
        offset: '0',
      });
      const headers: Record<string, string> = {};
      if (adminToken) {
        headers.Authorization = `Bearer ${adminToken}`;
      }
      const res = await fetch(`/api/admin/submissions?${params.toString()}`, {
        headers,
        credentials: 'include',
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      const parsed = await readJsonSafe<AdminSubmissionsResponse & { message?: string }>(res);
      if (!parsed.ok || !parsed.data) {
        throw new Error(parsed.data?.message || parsed.errorMessage || '获取管理列表失败');
      }
      setItems(parsed.data.items);
      setCounts(parsed.data.counts);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : '加载问卷管理列表失败');
    } finally {
      setLoading(false);
    }
  }, [adminToken, onLogout, planFilter, search, sort]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdminList();
    }, 120);
    return () => clearTimeout(timer);
  }, [fetchAdminList, refreshTrigger]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      const headers: Record<string, string> = {};
      if (adminToken) {
        headers.Authorization = `Bearer ${adminToken}`;
      }
      const res = await fetch(
        `/api/admin/submissions/${encodeURIComponent(deleteTarget.id)}`,
        {
          method: 'DELETE',
          headers,
          credentials: 'include',
        }
      );
      if (res.status === 401) {
        onLogout();
        return;
      }
      const parsed = await readJsonSafe<{ ok?: boolean; message?: string }>(res);
      if (!parsed.ok) {
        setFetchError(parsed.data?.message || parsed.errorMessage || '删除失败');
        setDeleteTarget(null);
        return;
      }
      setDeleteTarget(null);
      await fetchAdminList();
      onDataChanged();
    } catch {
      setFetchError('删除请求失败，请稍后重试');
    } finally {
      setDeleting(false);
    }
  };

  const getPlanBadgeStyle = (plan: MainPlan) => {
    if (plan === 'planB') return 'text-error bg-error-container/45';
    if (plan === 'planA') return 'text-primary bg-surface-container';
    return 'text-on-surface-variant bg-surface-container';
  };

  const filterTabs: Array<{ key: 'all' | MainPlan; label: string; count: number }> = [
    { key: 'all', label: '全部记录', count: counts.total },
    { key: 'planB', label: '方案B更换', count: counts.planB },
    { key: 'planA', label: '方案A续聘', count: counts.planA },
    { key: 'planC', label: '暂不表态', count: counts.planC },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-8 space-y-4">
      {/* Admin Top Control Card */}
      <section className="rounded-xl bg-surface-container-low p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[17px] font-bold text-on-surface">问卷列表管理中心</h1>
                <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-semibold">
                  管理员：{adminUsername}
                </span>
              </div>
              <p className="text-[12px] text-on-surface-variant mt-0.5">
                支持查看完整实名信息，执行新增、修改与删除操作并实时同步统计结果
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setEditTarget(null);
                setModalOpen(true);
              }}
              className="h-9 px-3.5 rounded-lg bg-primary text-on-primary text-[13px] font-semibold flex items-center gap-1.5 shadow-sm hover:bg-primary-container active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>新增答卷</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="h-9 px-3 rounded-lg bg-surface-container text-on-surface-variant hover:text-error hover:bg-error-container/40 text-[12px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>退出登录</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {filterTabs.map((tab) => {
            const active = planFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setPlanFilter(tab.key)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold shrink-0 transition-all cursor-pointer tabular-nums ${
                  active
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-surface-container-lowest px-3 h-10 rounded-lg border border-outline-variant/80 flex-1 focus-within:border-primary">
            <Search className="w-4 h-4 text-outline shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索房号、业主姓名、手机号或存证哈希"
              className="bg-transparent text-[13px] text-on-surface w-full focus:outline-none placeholder:text-outline"
            />
          </div>

          <button
            type="button"
            onClick={() => setSort((s) => (s === 'newest' ? 'oldest' : 'newest'))}
            className="h-10 px-2.5 rounded-lg bg-surface-container-lowest flex items-center gap-1 text-[12px] font-medium text-on-surface-variant hover:bg-surface-container shrink-0 cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sort === 'newest' ? '最新提交' : '最早提交'}</span>
          </button>
        </div>
      </section>

      {/* Records List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 rounded-xl bg-surface-container-lowest p-4 animate-pulse" />
          ))}
        </div>
      ) : fetchError ? (
        <div className="rounded-xl bg-surface-container-lowest p-6 text-center space-y-3 shadow-sm">
          <p className="text-[14px] font-semibold text-error">{fetchError}</p>
          <button
            type="button"
            onClick={fetchAdminList}
            className="h-9 px-4 rounded-lg bg-primary text-on-primary text-[13px] font-semibold cursor-pointer"
          >
            重新加载
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl bg-surface-container-lowest p-8 text-center space-y-3 shadow-sm">
          <p className="text-[15px] font-semibold text-on-surface">
            {search.trim() || planFilter !== 'all' ? '当前筛选条件下暂无问卷记录' : '暂无已备案问卷记录'}
          </p>
          <p className="text-[13px] text-on-surface-variant">
            点击上方「新增答卷」可由管理员代录或核验入库。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl bg-surface-container-lowest p-4 shadow-sm border border-surface-container flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[16px] font-bold text-on-surface">
                      {item.roomNumber}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${getPlanBadgeStyle(
                        item.mainPlan
                      )}`}
                    >
                      {PLAN_LABELS[item.mainPlan]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[12px] text-on-surface-variant mt-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 font-medium text-on-surface">
                      <User className="w-3.5 h-3.5 text-primary" />
                      <span>{item.ownerName || '未登记'}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-on-surface">
                      <Phone className="w-3.5 h-3.5 text-secondary" />
                      <span>{item.ownerPhone || '未登记'}</span>
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
                    item.q11Arrears === 'none'
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-error-container text-on-error-container'
                  }`}
                >
                  {item.q11Arrears === 'none' ? '无欠费' : '有欠费'}
                </span>
              </div>

              <div className="rounded-lg bg-surface-container-low px-3 py-2 flex items-center justify-between text-[11px] text-on-surface-variant">
                <span className="font-mono">哈希：{item.receiptHash}</span>
                <span>
                  {item.fillDate} · {formatRelativeTime(item.submittedAt)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setDetailTarget(item)}
                  className="h-9 rounded-lg bg-surface-container text-on-surface text-[12px] font-semibold flex items-center justify-center gap-1 hover:bg-surface-container-high cursor-pointer"
                >
                  <ClipboardCheck className="w-3.5 h-3.5 text-primary" />
                  <span>详情</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditTarget(item);
                    setModalOpen(true);
                  }}
                  className="h-9 rounded-lg bg-surface-container text-primary text-[12px] font-semibold flex items-center justify-center gap-1 hover:bg-surface-container-high cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>编辑</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(item)}
                  className="h-9 rounded-lg bg-error-container/55 text-error text-[12px] font-semibold flex items-center justify-center gap-1 hover:bg-error-container cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>删除</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      <SubmissionDetailDrawer
        submission={detailTarget}
        onClose={() => setDetailTarget(null)}
        onGoToFill={onBackToPublic}
      />

      {/* Create / Edit Modal */}
      <AdminSubmissionModal
        isOpen={modalOpen}
        submission={editTarget}
        adminToken={adminToken}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          fetchAdminList();
          onDataChanged();
        }}
        onUnauthorized={onLogout}
      />

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/45 backdrop-blur-sm p-4"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-surface-container-lowest p-5 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-error-container text-error flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[16px] font-bold text-on-surface">确认删除该问卷记录？</h3>
                <p className="text-[13px] text-on-surface-variant leading-relaxed">
                  即将永久删除房号「<span className="font-semibold text-on-surface">{deleteTarget.roomNumber}</span>」（业主：{deleteTarget.ownerName}）的问卷备案，删除后实时统计与公开列表将同步更新。
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-10 rounded-xl bg-surface-container text-on-surface text-[13px] font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="flex-1 h-10 rounded-xl bg-error text-on-error text-[13px] font-semibold cursor-pointer disabled:opacity-70"
              >
                {deleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
