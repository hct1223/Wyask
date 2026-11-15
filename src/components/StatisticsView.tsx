import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileDown,
  FileEdit,
  FileSpreadsheet,
  Gavel,
  LineChart,
  PieChart,
  RefreshCw,
  Share2,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trees,
  TrendingUp,
  Vote,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import communityHeroImg from '../assets/images/community_hero_1794580588365.jpg';
import type { FilterGroup, SurveyStats } from '../types/survey';
import { exportFilteredDetailsCsv, exportStatsSummaryCsv } from '../utils/csvExport';
import { formatClockTime } from '../utils/format';
import { readJsonSafe } from '../utils/http';
import { exportStatsPdf } from '../utils/pdfExport';

interface StatisticsViewProps {
  refreshTrigger: number;
  onGoToFill: () => void;
  onOpenShare: () => void;
}

export function StatisticsView({
  refreshTrigger,
  onGoToFill,
  onOpenShare,
}: StatisticsViewProps) {
  const [filterGroup, setFilterGroup] = useState<FilterGroup>('all');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [csvDrawerOpen, setCsvDrawerOpen] = useState(false);
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [feedbackIdx, setFeedbackIdx] = useState(0);
  const [exportState, setExportState] = useState<'idle' | 'generating' | 'done'>('idle');
  const [csvExportState, setCsvExportState] = useState<'idle' | 'exporting' | 'done'>('idle');
  const [heroError, setHeroError] = useState(false);

  const fetchStats = useCallback(async () => {
    setFetchError('');
    try {
      const res = await fetch(`/api/stats?arrears=${filterGroup}`);
      const parsed = await readJsonSafe<SurveyStats & { message?: string }>(res);
      if (!parsed.ok || !parsed.data) {
        throw new Error(parsed.data?.message || parsed.errorMessage || '统计数据加载失败');
      }
      setStats(parsed.data);
      setFeedbackIdx(0);
    } catch (err) {
      console.error(err);
      setFetchError(err instanceof Error ? err.message : '统计数据加载失败，请刷新重试');
    } finally {
      setLoading(false);
    }
  }, [filterGroup]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshTrigger]);

  const handleExportPdf = async () => {
    if (!stats || exportState === 'generating') return;
    setExportState('generating');
    try {
      await exportStatsPdf(stats);
      setExportState('done');
      setTimeout(() => setExportState('idle'), 2500);
    } catch (err) {
      console.error(err);
      setExportState('idle');
    }
  };

  const handleExportSummaryCsv = () => {
    if (!stats || csvExportState === 'exporting') return;
    setCsvExportState('exporting');
    try {
      exportStatsSummaryCsv(stats);
      setCsvExportState('done');
      setCsvDrawerOpen(false);
      setTimeout(() => setCsvExportState('idle'), 2500);
    } catch (err) {
      console.error(err);
      setCsvExportState('idle');
    }
  };

  const handleExportDetailsCsv = async () => {
    if (csvExportState === 'exporting') return;
    setCsvExportState('exporting');
    try {
      await exportFilteredDetailsCsv(filterGroup);
      setCsvExportState('done');
      setCsvDrawerOpen(false);
      setTimeout(() => setCsvExportState('idle'), 2500);
    } catch (err) {
      console.error(err);
      setCsvExportState('idle');
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 pb-8 space-y-4">
        <div className="h-36 rounded-xl bg-surface-container animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-surface-container-lowest animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-surface-container-lowest animate-pulse" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 pb-8">
        <div className="rounded-xl bg-surface-container-lowest p-8 text-center space-y-3 shadow-sm">
          <p className="text-[15px] font-semibold text-on-surface">
            {fetchError || '统计数据加载失败'}
          </p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchStats();
            }}
            className="h-10 px-4 rounded-lg bg-primary text-on-primary text-[13px] font-semibold cursor-pointer"
          >
            重新加载统计数据
          </button>
        </div>
      </div>
    );
  }

  const filterLabel =
    filterGroup === 'none'
      ? `无欠费组 (${stats.general.noArrearsCount})`
      : filterGroup === 'exist'
      ? `欠费户组 (${stats.general.arrearsCount})`
      : `全小区 (${stats.totalHouseholds}户)`;

  // Dynamically determine leading intention from real stats
  const leadingOption =
    stats.submittedCount === 0
      ? { rate: 0, label: '暂无表决数据' }
      : stats.q1.planB.count >= stats.q1.planA.count &&
        stats.q1.planB.count >= stats.q1.planC.count
      ? { rate: stats.q1.planB.rate, label: '方案B：更换新物业' }
      : stats.q1.planA.count >= stats.q1.planC.count
      ? { rate: stats.q1.planA.rate, label: '方案A：续聘整改' }
      : { rate: stats.q1.planC.rate, label: '暂不表态 / 观望' };

  const feedbacks = stats.general.feedbacks;
  const activeFeedback = feedbacks.length
    ? feedbacks[feedbackIdx % feedbacks.length]
    : null;

  const totalSamplesAll = stats.general.noArrearsCount + stats.general.arrearsCount;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-8 flex flex-col gap-4">
      {/* 社区实景氛围卡片与更新状态栏 */}
      <section className="flex flex-col gap-2.5">
        <div className="relative w-full h-36 sm:h-44 rounded-xl overflow-hidden shadow-sm bg-gradient-to-br from-primary via-primary-container to-secondary">
          {!heroError ? (
            <img
              src={communityHeroImg}
              alt="利安花园现代化住宅社区实景"
              referrerPolicy="no-referrer"
              onError={() => setHeroError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-25">
              <Building2 className="w-16 h-16 text-on-primary" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/90 via-inverse-surface/40 to-transparent flex flex-col justify-end p-4 text-surface-container-lowest">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[16px] sm:text-[18px] font-bold tracking-tight text-surface-container-lowest drop-shadow">
                全区12项议题民意总览
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary text-on-secondary text-[11px] font-semibold whitespace-nowrap">
                {stats.quorumMet ? '已达法定研判门槛' : '正在征集表决中'}
              </span>
            </div>
            <p className="text-[13px] text-surface-variant opacity-95 mt-0.5 truncate">
              利安花园2025年度物业履职评估暨处置表决案
            </p>
          </div>
        </div>

        {/* 快捷操作与筛选栏 */}
        <div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <RefreshCw className="w-4 h-4 text-secondary shrink-0" />
              <span className="text-[12px] font-medium tabular-nums">
                实时接口同步 · 更新于 {formatClockTime(stats.lastUpdated)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={exportState === 'generating'}
                className="h-8 px-2.5 rounded-lg bg-surface-container text-primary text-[12px] font-semibold flex items-center gap-1 hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer whitespace-nowrap disabled:opacity-60"
              >
                {exportState === 'generating' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>生成PDF</span>
                  </>
                ) : exportState === 'done' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-secondary" />
                    <span className="text-secondary">已导出PDF</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-3.5 h-3.5" />
                    <span>导出PDF</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCsvDrawerOpen((v) => !v);
                  setFilterDrawerOpen(false);
                }}
                disabled={csvExportState === 'exporting'}
                title="导出当前统计结果或逐户答卷明细为 CSV 文件"
                className="h-8 px-2.5 rounded-lg bg-surface-container text-on-surface-variant text-[12px] font-semibold flex items-center gap-1 hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer whitespace-nowrap disabled:opacity-60"
              >
                {csvExportState === 'exporting' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-secondary" />
                    <span>导出中</span>
                  </>
                ) : csvExportState === 'done' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-secondary" />
                    <span className="text-secondary">已导出CSV</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-3.5 h-3.5 text-secondary" />
                    <span>导出CSV</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterDrawerOpen((v) => !v);
                  setCsvDrawerOpen(false);
                }}
                className="h-8 px-2.5 rounded-lg bg-surface-container-high text-on-surface text-[12px] font-semibold flex items-center gap-1 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{filterLabel}</span>
              </button>
            </div>
          </div>

          {csvDrawerOpen && (
            <div className="pt-1 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportSummaryCsv}
                className="py-2 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-left transition-colors cursor-pointer"
              >
                <span className="block text-[12px] font-semibold text-primary">
                  统计结果汇总表 (.csv)
                </span>
                <span className="block text-[11px] text-on-surface-variant">
                  含Q01-Q12各项票数、占比与交叉分析
                </span>
              </button>
              <button
                type="button"
                onClick={handleExportDetailsCsv}
                className="py-2 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-left transition-colors cursor-pointer"
              >
                <span className="block text-[12px] font-semibold text-secondary">
                  逐户答卷明细表 (.csv)
                </span>
                <span className="block text-[11px] text-on-surface-variant">
                  按当前口径导出全部实名核验答卷行
                </span>
              </button>
            </div>
          )}

          {filterDrawerOpen && (
            <div className="pt-1 grid grid-cols-3 gap-1.5">
              {(
                [
                  { key: 'all', label: '全区总体' },
                  { key: 'none', label: `无欠费组(${stats.general.noArrearsCount})` },
                  { key: 'exist', label: `欠费户组(${stats.general.arrearsCount})` },
                ] as Array<{ key: FilterGroup; label: string }>
              ).map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => {
                    setFilterGroup(pill.key);
                    setFilterDrawerOpen(false);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    filterGroup === pill.key
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 空状态引导横幅（仅在全库暂无真实答卷时展示） */}
      {totalSamplesAll === 0 && (
        <section className="rounded-xl bg-surface-container-low p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-[14px] font-semibold text-on-surface">
              当前尚未收到业主提交的真实答卷
            </p>
            <p className="text-[12px] text-on-surface-variant">
              所有统计指标已清空模拟数据，提交问卷或分享链接后此处将实时自动更新。
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onGoToFill}
              className="h-9 px-3.5 rounded-lg bg-primary text-on-primary text-[12px] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>去填写</span>
            </button>
            <button
              type="button"
              onClick={onOpenShare}
              className="h-9 px-3.5 rounded-lg bg-surface-container text-primary text-[12px] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>分享链接</span>
            </button>
          </div>
        </section>
      )}

      {/* 顶部统计概览看板（4个核心指标卡） */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-on-surface-variant">
              {filterGroup === 'all' ? '问卷回收户数' : '当前组别样本'}
            </span>
            <span className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
              <Vote className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1 tabular-nums">
              <span className="text-[22px] font-bold text-primary">{stats.submittedCount}</span>
              <span className="text-[11px] text-on-surface-variant">
                / {stats.totalHouseholds} 户
              </span>
            </div>
            <span className="text-[11px] font-medium text-secondary flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>一户一票排重核验</span>
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-on-surface-variant">投票覆盖率</span>
            <span className="w-7 h-7 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary">
              <PieChart className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1 tabular-nums">
              <span className="text-[22px] font-bold text-secondary">
                {stats.coverageRate}%
              </span>
            </div>
            <span className="text-[11px] text-on-surface-variant mt-0.5 block truncate">
              {stats.quorumMet ? '超法定2/3门槛 (66.7%)' : '法定门槛为 66.7%'}
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-on-surface-variant">主流意向归向</span>
            <span className="w-7 h-7 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1 tabular-nums">
              <span className="text-[22px] font-bold text-tertiary-container">
                {leadingOption.rate}%
              </span>
            </div>
            <span className="text-[11px] font-semibold text-tertiary mt-0.5 block truncate">
              {leadingOption.label}
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-on-surface-variant">数据核验有效率</span>
            <span className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1 tabular-nums">
              <span className="text-[22px] font-bold text-on-surface">{stats.validRate}%</span>
            </div>
            <span className="text-[11px] text-on-surface-variant mt-0.5 block truncate">
              {stats.submittedCount > 0 ? '0作废 · 房产确权匹配' : '等待首份有效答卷'}
            </span>
          </div>
        </div>
      </section>

      {/* 第一部分：核心意向倾向（第1题） */}
      <section className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary text-on-primary text-[11px] font-bold">
              Q01
            </span>
            <h2 className="text-[16px] font-bold text-on-surface">整体处置方案核心意向</h2>
          </div>
          <span className="text-[12px] font-medium text-on-surface-variant tabular-nums">
            共 {stats.q1.total} 票
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-full rounded-full bg-surface-container flex overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${stats.q1.planB.rate}%` }}
            />
            <div
              className="h-full bg-tertiary-fixed-dim transition-all duration-500"
              style={{ width: `${stats.q1.planA.rate}%` }}
            />
            <div
              className="h-full bg-outline-variant transition-all duration-500"
              style={{ width: `${stats.q1.planC.rate}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-medium text-on-surface-variant px-0.5 tabular-nums">
            <span>方案B ({stats.q1.planB.rate}%)</span>
            <span>方案A ({stats.q1.planA.rate}%)</span>
            <span>观望 ({stats.q1.planC.rate}%)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
          <div className="p-3.5 rounded-xl bg-surface-container-low flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold text-[15px] shrink-0">
                B
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-[15px] font-bold text-primary truncate">
                  更换新的物业公司
                </span>
                <span className="text-[12px] text-on-surface-variant truncate">
                  重新公开招投标优质服务
                </span>
              </div>
            </div>
            <div className="text-right shrink-0 tabular-nums">
              <span className="text-[17px] font-bold text-primary">
                {stats.q1.planB.count} 票
              </span>
              <span className="block text-[11px] font-semibold text-secondary">
                {stats.q1.planB.rate}%
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center font-bold text-[15px] shrink-0">
                A
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-semibold text-on-surface truncate">
                  继续聘用现有物业公司
                </span>
                <span className="text-[12px] text-on-surface-variant truncate">
                  限期1个月整改后评估
                </span>
              </div>
            </div>
            <div className="text-right shrink-0 tabular-nums">
              <span className="text-[17px] font-semibold text-on-surface">
                {stats.q1.planA.count} 票
              </span>
              <span className="block text-[11px] text-on-surface-variant">
                {stats.q1.planA.rate}%
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant flex items-center justify-center font-bold text-[15px] shrink-0">
                C
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-semibold text-on-surface truncate">
                  暂不表态 / 需更多信息
                </span>
                <span className="text-[12px] text-on-surface-variant truncate">
                  视后续宣讲会方案决定
                </span>
              </div>
            </div>
            <div className="text-right shrink-0 tabular-nums">
              <span className="text-[17px] font-medium text-on-surface-variant">
                {stats.q1.planC.count} 票
              </span>
              <span className="block text-[11px] text-on-surface-variant">
                {stats.q1.planC.rate}%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 第二部分 & 第三部分 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 第二部分：方案A定向统计 */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-4 bg-tertiary-container rounded-full" />
              <h2 className="text-[17px] font-bold text-on-surface">
                方案A定向细则研判 ({stats.planA.sampleCount}人样本)
              </h2>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
              第2~5题
            </span>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-semibold text-on-surface">
                  Q02. 整改1个月且满意度须达90%
                </span>
                <span className="text-[12px] font-bold text-secondary tabular-nums shrink-0">
                  {stats.planA.q2.agree.rate}% 同意
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-container flex overflow-hidden">
                <div
                  className="bg-secondary h-full transition-all"
                  style={{ width: `${stats.planA.q2.agree.rate}%` }}
                />
                <div
                  className="bg-error h-full transition-all"
                  style={{ width: `${stats.planA.q2.disagree.rate}%` }}
                />
                <div
                  className="bg-outline-variant h-full transition-all"
                  style={{ width: `${stats.planA.q2.reserved.rate}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-on-surface-variant tabular-nums">
                <span className="text-secondary">
                  同意 {stats.planA.q2.agree.count}人 ({stats.planA.q2.agree.rate}%)
                </span>
                <span className="text-error">
                  不同意 {stats.planA.q2.disagree.count}人 ({stats.planA.q2.disagree.rate}%)
                </span>
                <span>
                  保留 {stats.planA.q2.reserved.count}人 ({stats.planA.q2.reserved.rate}%)
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-semibold text-on-surface">
                  Q03. 满意度达标后配合补齐欠费
                </span>
                <span className="text-[12px] font-bold text-secondary tabular-nums shrink-0">
                  {stats.planA.q3.agree.rate}% 履约意向
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-container flex overflow-hidden">
                <div
                  className="bg-secondary h-full transition-all"
                  style={{ width: `${stats.planA.q3.agree.rate}%` }}
                />
                <div
                  className="bg-error h-full transition-all"
                  style={{ width: `${stats.planA.q3.disagree.rate}%` }}
                />
                <div
                  className="bg-outline-variant h-full transition-all"
                  style={{ width: `${stats.planA.q3.reserved.rate}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-on-surface-variant tabular-nums">
                <span className="text-secondary">
                  同意 {stats.planA.q3.agree.count}人 ({stats.planA.q3.agree.rate}%)
                </span>
                <span className="text-error">
                  不同意 {stats.planA.q3.disagree.count}人 ({stats.planA.q3.disagree.rate}%)
                </span>
                <span>
                  保留 {stats.planA.q3.reserved.count}人 ({stats.planA.q3.reserved.rate}%)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-on-surface">
                Q04. 优先整改服务迫切度排行 (Top 5)
              </span>
              <span className="text-[11px] text-on-surface-variant">多选题</span>
            </div>
            {stats.planA.q4Top5.length === 0 ? (
              <p className="text-[12px] text-on-surface-variant py-2">
                暂无选择方案A的整改项目统计数据。
              </p>
            ) : (
              <div className="space-y-3">
                {stats.planA.q4Top5.map((item, idx) => (
                  <div key={item.key} className="space-y-1">
                    <div className="flex justify-between items-center text-[12px] gap-2">
                      <span className="font-semibold text-on-surface flex items-center gap-1.5 min-w-0 truncate">
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            idx === 0
                              ? 'bg-error-container text-error'
                              : 'bg-surface-container-high text-on-surface'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="truncate">{item.shortLabel}</span>
                      </span>
                      <span
                        className={`font-bold shrink-0 tabular-nums ${
                          idx === 0 ? 'text-error' : 'text-on-surface'
                        }`}
                      >
                        {item.rate}% ({item.count}人)
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-surface-container overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 0
                            ? 'bg-error'
                            : idx === 1
                            ? 'bg-primary-container'
                            : idx === 2
                            ? 'bg-surface-tint'
                            : 'bg-outline'
                        }`}
                        style={{ width: `${item.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-on-surface">
                Q05. 续聘方案整改重点词频萃取
              </span>
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            {stats.planA.q5Keywords.length === 0 ? (
              <p className="text-[12px] text-on-surface-variant">暂无方案A整改重点词频数据。</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stats.planA.q5Keywords.map((kw, i) => (
                  <span
                    key={i}
                    className={`px-2.5 py-1 rounded-lg text-[12px] tabular-nums ${
                      kw.highlight
                        ? 'bg-error-container text-error font-bold'
                        : i === 1
                        ? 'bg-surface-container-high text-on-surface font-semibold'
                        : 'bg-surface-container text-on-surface-variant font-medium'
                    }`}
                  >
                    {kw.label} ({kw.count}次)
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 第三部分：方案B定向统计 */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-4 bg-primary rounded-full" />
              <h2 className="text-[17px] font-bold text-on-surface">
                方案B新选聘机制意向 ({stats.planB.sampleCount}人样本)
              </h2>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-primary-fixed text-primary">
              第6~10题
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm space-y-1.5">
              <div className="flex justify-between items-center gap-2">
                <span className="text-[14px] font-bold text-on-surface">
                  Q06. 按收支平衡测算匹配新物业
                </span>
                <span className="text-[16px] font-bold text-secondary tabular-nums">
                  {stats.planB.q6.agree.rate}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-container flex overflow-hidden">
                <div
                  className="bg-secondary h-full"
                  style={{ width: `${stats.planB.q6.agree.rate}%` }}
                />
                <div
                  className="bg-error h-full"
                  style={{ width: `${stats.planB.q6.disagree.rate}%` }}
                />
                <div
                  className="bg-outline-variant h-full"
                  style={{ width: `${stats.planB.q6.reserved.rate}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-on-surface-variant tabular-nums">
                <span>
                  同意 {stats.planB.q6.agree.count}人 ({stats.planB.q6.agree.rate}%)
                </span>
                <span>反对 {stats.planB.q6.disagree.count}人</span>
                <span>保留 {stats.planB.q6.reserved.count}人</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm space-y-1.5">
              <div className="flex justify-between items-center gap-2">
                <span className="text-[14px] font-bold text-on-surface">
                  Q08. 引入公共广告经营性收益补足
                </span>
                <span className="text-[16px] font-bold text-primary tabular-nums">
                  {stats.planB.q8.agree.rate}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-container flex overflow-hidden">
                <div
                  className="bg-primary h-full"
                  style={{ width: `${stats.planB.q8.agree.rate}%` }}
                />
                <div
                  className="bg-error h-full"
                  style={{ width: `${stats.planB.q8.disagree.rate}%` }}
                />
                <div
                  className="bg-outline-variant h-full"
                  style={{ width: `${stats.planB.q8.reserved.rate}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-on-surface-variant tabular-nums">
                <span>
                  赞成 {stats.planB.q8.agree.count}人 ({stats.planB.q8.agree.rate}%)
                </span>
                <span>反对 {stats.planB.q8.disagree.count}人</span>
                <span>保留 {stats.planB.q8.reserved.count}人</span>
              </div>
            </div>
          </div>

          {/* Q07 */}
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[14px] font-bold text-on-surface">
                Q07. 若现行收费标准不足以聘优质物业
              </span>
              <span className="text-[11px] font-bold text-primary shrink-0">调价接受度</span>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-surface-container space-y-1">
                <div className="flex justify-between text-[12px] gap-2">
                  <span className="font-semibold text-on-surface">
                    暂不确定，看上调幅度与具体服务明细
                  </span>
                  <span className="font-bold text-primary tabular-nums shrink-0">
                    {stats.planB.q7.uncertain.rate}% ({stats.planB.q7.uncertain.count}人)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${stats.planB.q7.uncertain.rate}%` }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-container-low space-y-1">
                <div className="flex justify-between text-[12px] gap-2">
                  <span className="font-semibold text-on-surface">
                    可以接受适当上调 (参考周边品质盘标准)
                  </span>
                  <span className="font-bold text-secondary tabular-nums shrink-0">
                    {stats.planB.q7.accept.rate}% ({stats.planB.q7.accept.count}人)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full"
                    style={{ width: `${stats.planB.q7.accept.rate}%` }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-surface-container space-y-1">
                <div className="flex justify-between text-[12px] gap-2">
                  <span className="font-semibold text-on-surface-variant">
                    严格不接受上调，按现有费用水平选聘
                  </span>
                  <span className="font-bold text-on-surface-variant tabular-nums shrink-0">
                    {stats.planB.q7.reject.rate}% ({stats.planB.q7.reject.count}人)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className="h-full bg-outline-variant rounded-full"
                    style={{ width: `${stats.planB.q7.reject.rate}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-[12px] text-on-surface-variant bg-surface-variant/40 p-2.5 rounded-lg leading-relaxed">
              {stats.planB.sampleCount > 0 ? (
                <>
                  <b>分析研判：</b>
                  {(stats.planB.q7.uncertain.rate + stats.planB.q7.accept.rate).toFixed(1)}%{' '}
                  的倾向更换物业业主具备协商弹性，主要诉求在于“质价相符”与透明度。
                </>
              ) : (
                <>
                  <b>分析研判：</b>暂无方案B调价问卷样本，收集答卷后将自动生成调价弹性分析。
                </>
              )}
            </p>
          </div>

          {/* Q09 */}
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm space-y-3">
            <span className="text-[14px] font-bold text-on-surface block">
              Q09. 新物业公司选聘权重考核要素
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-surface-container-low flex flex-col items-center gap-1">
                <Building2 className="w-6 h-6 text-primary" />
                <span className="text-[11px] text-on-surface-variant">电梯及设施安全</span>
                <span className="text-[16px] font-bold text-primary tabular-nums">
                  {stats.planB.q9Weights.elevatorFacilityRate}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low flex flex-col items-center gap-1">
                <Shield className="w-6 h-6 text-secondary" />
                <span className="text-[11px] text-on-surface-variant">安保与门禁管理</span>
                <span className="text-[16px] font-bold text-secondary tabular-nums">
                  {stats.planB.q9Weights.securityAccessRate}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low flex flex-col items-center gap-1">
                <Trees className="w-6 h-6 text-tertiary" />
                <span className="text-[11px] text-on-surface-variant">保洁与绿化养护</span>
                <span className="text-[16px] font-bold text-tertiary tabular-nums">
                  {stats.planB.q9Weights.cleaningGreeningRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Q10 */}
          <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
              <Gavel className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[15px] font-bold text-on-surface">
                Q10. 准入硬性门槛民意共识
              </span>
              <p className="text-[12px] text-on-surface-variant leading-relaxed">
                {stats.planB.sampleCount > 0 && stats.planB.q10GuaranteeMentionRate > 0 ? (
                  <>
                    在填写第10题文字要求的方案B业主中，{stats.planB.q10GuaranteeMentionRate}%{' '}
                    明确提及资质业绩、考核或{' '}
                    <span className="text-primary font-semibold">“履约保证金机制”</span>。
                  </>
                ) : (
                  '在收到方案B业主第10题文字要求后，将自动汇总准入资质与保证金等核心诉求占比。'
                )}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* 第四部分：通用问题交叉分析（第11题、第12题） */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-4 bg-secondary rounded-full" />
          <h2 className="text-[17px] font-bold text-on-surface">
            Q11 &amp; Q12 全局交叉透视与决议建议
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Q11 Cross-tab */}
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-on-surface">
                Q11. 现行物业费缴纳情况及意向关联
              </span>
              <span className="text-[11px] text-on-surface-variant">交叉数据</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1">
                <div className="flex items-center gap-1 text-secondary text-[12px] font-bold">
                  <Check className="w-4 h-4" />
                  <span className="tabular-nums">
                    无欠费户 ({stats.general.noArrearsRate}%)
                  </span>
                </div>
                <span className="text-[22px] font-bold text-on-surface tabular-nums">
                  {stats.general.noArrearsCount} 户
                </span>
                <span className="text-[11px] text-on-surface-variant tabular-nums">
                  其中支持换物业比例：<b>{stats.general.noArrearsPlanBRate}%</b>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-error-container/45 flex flex-col gap-1">
                <div className="flex items-center gap-1 text-error text-[12px] font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="tabular-nums">
                    有欠费户 ({stats.general.arrearsRate}%)
                  </span>
                </div>
                <span className="text-[22px] font-bold text-error tabular-nums">
                  {stats.general.arrearsCount} 户
                </span>
                <span className="text-[11px] text-error font-medium tabular-nums">
                  其中支持换物业比例：<b>{stats.general.arrearsPlanBRate}%</b>
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface-container text-on-surface text-[12px] flex items-start gap-2">
              <LineChart className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {totalSamplesAll > 0 ? (
                  <>
                    <b>交叉洞察：</b>无欠费户中支持更换新物业占比{' '}
                    {stats.general.noArrearsPlanBRate}%，有欠费户中支持更换新物业占比{' '}
                    {stats.general.arrearsPlanBRate}%，系统将随真实交卷持续动态测算两者相关性。
                  </>
                ) : (
                  <>
                    <b>交叉洞察：</b>暂无样本数据，收集答卷后将自动对比无欠费户与欠费户的换聘意愿差异。
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Q12 Feedback Carousel & Recommendation */}
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-on-surface">
                Q12. 业主建言精选与业委会工作结论
              </span>
              {feedbacks.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="上一条业主建言"
                    onClick={() =>
                      setFeedbackIdx(
                        (i) => (i - 1 + feedbacks.length) % feedbacks.length
                      )
                    }
                    className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high active:scale-90 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="下一条业主建言"
                    onClick={() => setFeedbackIdx((i) => (i + 1) % feedbacks.length)}
                    className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high active:scale-90 transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {activeFeedback ? (
              <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-bold text-primary">
                    {activeFeedback.author}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                    {activeFeedback.tag}
                  </span>
                </div>
                <p className="text-[13px] text-on-surface leading-relaxed">
                  {activeFeedback.text}
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-surface-container-low text-[12px] text-on-surface-variant">
                暂无业主文字建言，业主在问卷第12题提交建议后将实时展示于此。
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-primary text-on-primary flex flex-col gap-1 shadow-sm">
              <div className="flex items-center gap-1.5 text-[14px] font-bold">
                <ClipboardCheck className="w-4 h-4" />
                <span>业委会下步依法推进建议</span>
              </div>
              <p className="text-[12px] opacity-95 leading-relaxed">
                {stats.submittedCount === 0
                  ? '问卷已正式开启一户一票实时征集，待回收达到一定比例后，系统将根据实时统计结果生成业委会推进建议。'
                  : `当前已回收有效答卷 ${stats.submittedCount} 份（覆盖率 ${stats.coverageRate}%），主流倾向为「${leadingOption.label}」（占比 ${leadingOption.rate}%）。业委会将依据《民法典》第278条及真实汇总民意推进下一步表决公示。`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom quick export bar */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={exportState === 'generating'}
          className="h-11 px-5 rounded-xl bg-surface-container text-primary text-[13px] font-semibold flex items-center gap-2 hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          <span>
            {exportState === 'generating'
              ? '正在生成可视化统计报告...'
              : '下载完整可视化统计 PDF 报告'}
          </span>
        </button>

        <button
          type="button"
          onClick={handleExportSummaryCsv}
          disabled={csvExportState === 'exporting'}
          className="h-11 px-5 rounded-xl bg-surface-container text-secondary text-[13px] font-semibold flex items-center gap-2 hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-60"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>导出当前统计结果 CSV</span>
        </button>
      </div>
    </div>
  );
}
