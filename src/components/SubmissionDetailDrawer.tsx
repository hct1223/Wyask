import { ClipboardCheck, FileText, ShieldCheck, Vote, X } from 'lucide-react';
import {
  AGREEMENT_LABELS,
  FEE_ADJUST_LABELS,
  PLAN_LABELS,
  type SurveySubmission,
} from '../types/survey';
import { formatRelativeTime, getPriorityLabel } from '../utils/format';

interface SubmissionDetailDrawerProps {
  submission: SurveySubmission | null;
  onClose: () => void;
  onGoToFill: () => void;
}

export function SubmissionDetailDrawer({
  submission,
  onClose,
  onGoToFill,
}: SubmissionDetailDrawerProps) {
  if (!submission) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-inverse-surface/45 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[86dvh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="relative px-4 pt-3 pb-3 flex items-center justify-between bg-surface-container-low">
          <div className="w-10 h-1 rounded-full bg-outline-variant absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />
          <div className="flex items-center gap-2 mt-1 sm:mt-0">
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-[16px] font-semibold text-on-surface">
              答卷备案详情 · {submission.roomNumber}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-on-surface">
          {/* Meta Card */}
          <div className="bg-surface-container-low rounded-xl p-3.5 space-y-2 text-[12px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-on-surface-variant">备案文号</span>
              <span className="font-semibold text-on-surface">利业秘字[2025]第003号</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-on-surface-variant">房号确权</span>
              <span className="font-semibold text-on-surface">{submission.roomNumber}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-on-surface-variant">业主核验（脱敏）</span>
              <span className="font-semibold text-secondary">
                {submission.ownerName || '已登记'} · {submission.ownerPhone || '已脱敏'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-on-surface-variant">提交时间</span>
              <span className="text-on-surface tabular-nums">
                {submission.fillDate}（{formatRelativeTime(submission.submittedAt)}）
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-on-surface-variant">公证见证方</span>
              <span className="text-secondary font-medium">广东广信君达律师事务所</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-on-surface-variant">区块链存证哈希</span>
              <span className="font-mono text-[11px] text-primary font-semibold">
                {submission.receiptHash}
              </span>
            </div>
          </div>

          {/* Q1 Answer */}
          <div className="space-y-1.5">
            <span className="text-[13px] font-semibold text-on-surface-variant">
              第1题 · 整体处置方案倾向
            </span>
            <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between">
              <span className="text-[15px] font-bold text-primary">
                {PLAN_LABELS[submission.mainPlan]}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold">
                已核验有效
              </span>
            </div>
          </div>

          {/* Plan A Details */}
          {submission.mainPlan === 'planA' && (
            <div className="space-y-2.5">
              <span className="text-[13px] font-semibold text-on-surface-variant block">
                第二部分 · 方案A细则答复
              </span>
              <div className="rounded-xl bg-surface-container-low p-3 space-y-2 text-[13px]">
                {submission.q2Agreement && (
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Q2. 整改期1个月达90%满意</span>
                    <span className="font-semibold text-on-surface">
                      {AGREEMENT_LABELS[submission.q2Agreement]}
                    </span>
                  </div>
                )}
                {submission.q3Agreement && (
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Q3. 达标后1个月补齐欠费</span>
                    <span className="font-semibold text-on-surface">
                      {AGREEMENT_LABELS[submission.q3Agreement]}
                    </span>
                  </div>
                )}
                {submission.q4Priorities && submission.q4Priorities.length > 0 && (
                  <div className="pt-1 space-y-1">
                    <span className="text-on-surface-variant block">Q4. 优先整改项目：</span>
                    <div className="flex flex-wrap gap-1.5">
                      {submission.q4Priorities.map((k) => (
                        <span
                          key={k}
                          className="px-2 py-0.5 rounded bg-surface-container text-on-surface text-[11px]"
                        >
                          {getPriorityLabel(k)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {submission.q4Other && (
                  <div className="pt-1">
                    <span className="text-on-surface-variant block">Q4. 其他整改补充：</span>
                    <p className="text-on-surface mt-0.5 leading-relaxed">{submission.q4Other}</p>
                  </div>
                )}
                {submission.q5Feedback && (
                  <div className="pt-1">
                    <span className="text-on-surface-variant block">Q5. 补充诉求：</span>
                    <p className="text-on-surface mt-0.5 leading-relaxed">
                      {submission.q5Feedback}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Plan B Details */}
          {submission.mainPlan === 'planB' && (
            <div className="space-y-2.5">
              <span className="text-[13px] font-semibold text-on-surface-variant block">
                第三部分 · 方案B选聘答复
              </span>
              <div className="rounded-xl bg-surface-container-low p-3 space-y-2 text-[13px]">
                {submission.q6Agreement && (
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Q6. 按预算匹配新物业</span>
                    <span className="font-semibold text-on-surface">
                      {AGREEMENT_LABELS[submission.q6Agreement]}
                    </span>
                  </div>
                )}
                {submission.q7FeeAdjust && (
                  <div className="space-y-0.5">
                    <span className="text-on-surface-variant block">Q7. 费用标准调整态度：</span>
                    <span className="font-semibold text-primary">
                      {FEE_ADJUST_LABELS[submission.q7FeeAdjust]}
                    </span>
                  </div>
                )}
                {submission.q8Ads && (
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Q8. 公共广告收益补贴</span>
                    <span className="font-semibold text-on-surface">
                      {AGREEMENT_LABELS[submission.q8Ads]}
                    </span>
                  </div>
                )}
                {submission.q9Priorities && submission.q9Priorities.length > 0 && (
                  <div className="pt-1 space-y-1">
                    <span className="text-on-surface-variant block">Q9. 最看重物业服务：</span>
                    <div className="flex flex-wrap gap-1.5">
                      {submission.q9Priorities.map((k) => (
                        <span
                          key={k}
                          className="px-2 py-0.5 rounded bg-surface-container text-on-surface text-[11px]"
                        >
                          {getPriorityLabel(k)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {submission.q9Other && (
                  <div className="pt-1">
                    <span className="text-on-surface-variant block">Q9. 其他看重服务：</span>
                    <p className="text-on-surface mt-0.5 leading-relaxed">{submission.q9Other}</p>
                  </div>
                )}
                {submission.q10Feedback && (
                  <div className="pt-1">
                    <span className="text-on-surface-variant block">Q10. 选聘具体要求：</span>
                    <p className="text-on-surface mt-0.5 leading-relaxed">
                      {submission.q10Feedback}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* General Questions */}
          <div className="space-y-2">
            <span className="text-[13px] font-semibold text-on-surface-variant block">
              第四部分 · 通用核验信息
            </span>
            <div className="rounded-xl bg-surface-container-low p-3 space-y-2 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Q11. 现行物业缴费状态</span>
                <span
                  className={`font-semibold ${
                    submission.q11Arrears === 'none' ? 'text-secondary' : 'text-error'
                  }`}
                >
                  {submission.q11Arrears === 'none' ? '无欠费' : '有欠费'}
                </span>
              </div>
              {submission.q12Feedback && (
                <div className="pt-1">
                  <span className="text-on-surface-variant block">Q12. 业主整体建言：</span>
                  <p className="text-on-surface mt-0.5 leading-relaxed">
                    {submission.q12Feedback}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Compliance Note */}
          <div className="p-3 rounded-xl bg-secondary-fixed/35 flex items-start gap-2 text-[12px] text-on-surface-variant">
            <ShieldCheck className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              严格执行「一房一户一票」，业主姓名与联系方式已脱敏隐藏，存证哈希可供业主大会现场复核。
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-surface-container-low flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 rounded-lg bg-surface-container text-on-surface text-[14px] font-medium flex items-center justify-center gap-1 cursor-pointer hover:bg-surface-container-high transition-colors"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>返回列表</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onGoToFill();
            }}
            className="flex-[1.6] h-12 rounded-lg bg-primary-container text-on-primary text-[14px] font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <Vote className="w-4 h-4" />
            <span>我也要填写问卷</span>
          </button>
        </div>
      </div>
    </div>
  );
}
