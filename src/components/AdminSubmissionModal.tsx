import { AlertCircle, Check, Loader2, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  PRIORITY_OPTIONS,
  type AgreementChoice,
  type ArrearsStatus,
  type FeeAdjustChoice,
  type MainPlan,
  type PriorityKey,
  type SurveySubmission,
  type SurveySubmissionPayload,
} from '../types/survey';
import { readJsonSafe } from '../utils/http';

interface AdminSubmissionModalProps {
  isOpen: boolean;
  submission: SurveySubmission | null;
  adminToken: string;
  onClose: () => void;
  onSaved: () => void;
  onUnauthorized: () => void;
}

const AGREE_CHOICES: Array<{ value: AgreementChoice; label: string }> = [
  { value: 'agree', label: '同意' },
  { value: 'disagree', label: '不同意' },
  { value: 'reserved', label: '保留意见' },
];

export function AdminSubmissionModal({
  isOpen,
  submission,
  adminToken,
  onClose,
  onSaved,
  onUnauthorized,
}: AdminSubmissionModalProps) {
  const isEdit = Boolean(submission);
  const today = new Date().toISOString().slice(0, 10);

  const [roomNumber, setRoomNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [fillDate, setFillDate] = useState(today);
  const [mainPlan, setMainPlan] = useState<MainPlan>('planB');

  const [q2Agreement, setQ2Agreement] = useState<AgreementChoice | ''>('');
  const [q3Agreement, setQ3Agreement] = useState<AgreementChoice | ''>('');
  const [q4Priorities, setQ4Priorities] = useState<PriorityKey[]>([]);
  const [q4Other, setQ4Other] = useState('');
  const [q5Feedback, setQ5Feedback] = useState('');

  const [q6Agreement, setQ6Agreement] = useState<AgreementChoice | ''>('');
  const [q7FeeAdjust, setQ7FeeAdjust] = useState<FeeAdjustChoice | ''>('');
  const [q8Ads, setQ8Ads] = useState<AgreementChoice | ''>('');
  const [q9Priorities, setQ9Priorities] = useState<PriorityKey[]>([]);
  const [q9Other, setQ9Other] = useState('');
  const [q10Feedback, setQ10Feedback] = useState('');

  const [q11Arrears, setQ11Arrears] = useState<ArrearsStatus>('none');
  const [q12Feedback, setQ12Feedback] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    if (submission) {
      setRoomNumber(submission.roomNumber || '');
      setOwnerName(submission.ownerName || '');
      setOwnerPhone(submission.ownerPhone || '');
      setFillDate(submission.fillDate || today);
      setMainPlan(submission.mainPlan);
      setQ2Agreement(submission.q2Agreement || '');
      setQ3Agreement(submission.q3Agreement || '');
      setQ4Priorities(submission.q4Priorities || []);
      setQ4Other(submission.q4Other || '');
      setQ5Feedback(submission.q5Feedback || '');
      setQ6Agreement(submission.q6Agreement || '');
      setQ7FeeAdjust(submission.q7FeeAdjust || '');
      setQ8Ads(submission.q8Ads || '');
      setQ9Priorities(submission.q9Priorities || []);
      setQ9Other(submission.q9Other || '');
      setQ10Feedback(submission.q10Feedback || '');
      setQ11Arrears(submission.q11Arrears);
      setQ12Feedback(submission.q12Feedback || '');
    } else {
      setRoomNumber('');
      setOwnerName('');
      setOwnerPhone('');
      setFillDate(today);
      setMainPlan('planB');
      setQ2Agreement('');
      setQ3Agreement('');
      setQ4Priorities([]);
      setQ4Other('');
      setQ5Feedback('');
      setQ6Agreement('');
      setQ7FeeAdjust('');
      setQ8Ads('');
      setQ9Priorities([]);
      setQ9Other('');
      setQ10Feedback('');
      setQ11Arrears('none');
      setQ12Feedback('');
    }
  }, [isOpen, submission, today]);

  if (!isOpen) return null;

  const togglePriority = (
    list: PriorityKey[],
    setList: (next: PriorityKey[]) => void,
    key: PriorityKey
  ) => {
    if (list.includes(key)) {
      setList(list.filter((i) => i !== key));
    } else {
      setList([...list, key]);
    }
  };

  const handleSave = async () => {
    setErrorMsg('');
    const cleanPhone = ownerPhone.replace(/[\s-]/g, '').trim();
    if (!roomNumber.trim()) {
      setErrorMsg('请填写房号');
      return;
    }
    if (!ownerName.trim()) {
      setErrorMsg('请填写业主姓名');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(cleanPhone)) {
      setErrorMsg('请填写有效的11位手机号码');
      return;
    }

    const payload: SurveySubmissionPayload = {
      roomNumber: roomNumber.trim(),
      ownerName: ownerName.trim(),
      ownerPhone: cleanPhone,
      fillDate,
      mainPlan,
      q2Agreement: q2Agreement || undefined,
      q3Agreement: q3Agreement || undefined,
      q4Priorities: q4Priorities.length ? q4Priorities : undefined,
      q4Other: q4Other.trim() || undefined,
      q5Feedback: q5Feedback.trim() || undefined,
      q6Agreement: q6Agreement || undefined,
      q7FeeAdjust: q7FeeAdjust || undefined,
      q8Ads: q8Ads || undefined,
      q9Priorities: q9Priorities.length ? q9Priorities : undefined,
      q9Other: q9Other.trim() || undefined,
      q10Feedback: q10Feedback.trim() || undefined,
      q11Arrears,
      q12Feedback: q12Feedback.trim() || undefined,
    };

    setSaving(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (adminToken) {
        headers.Authorization = `Bearer ${adminToken}`;
      }

      const url = isEdit
        ? `/api/admin/submissions/${encodeURIComponent(submission!.id)}`
        : '/api/admin/submissions';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        onUnauthorized();
        return;
      }

      const parsed = await readJsonSafe<SurveySubmission & { message?: string }>(res);
      if (!parsed.ok) {
        setErrorMsg(parsed.data?.message || parsed.errorMessage || '保存失败，请检查表单内容');
        return;
      }

      onSaved();
      onClose();
    } catch {
      setErrorMsg('网络请求失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-inverse-surface/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90dvh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3.5 bg-surface-container-low flex items-center justify-between border-b border-surface-container">
          <h3 className="text-[16px] font-bold text-on-surface">
            {isEdit ? `编辑问卷记录 · ${submission?.roomNumber}` : '新增业主问卷记录'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[13px]">
          {/* 基本信息 */}
          <div className="rounded-xl bg-surface-container-low p-3.5 space-y-3">
            <span className="text-[13px] font-bold text-primary block">业主实名备案信息</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium text-on-surface-variant block mb-1">
                  房号 <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="例如：1栋102室"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/60 text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-on-surface-variant block mb-1">
                  填写日期
                </label>
                <input
                  type="date"
                  value={fillDate}
                  onChange={(e) => setFillDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/60 text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-on-surface-variant block mb-1">
                  业主姓名 <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="请输入业主真实姓名"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/60 text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-on-surface-variant block mb-1">
                  手机号 <span className="text-error">*</span>
                </label>
                <input
                  type="tel"
                  maxLength={11}
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="11位手机号码"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/60 text-on-surface focus:border-primary focus:outline-none tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Q1 核心意向 */}
          <div className="rounded-xl bg-surface-container-low p-3.5 space-y-2.5">
            <span className="text-[13px] font-bold text-on-surface block">
              Q1. 核心处置方案意向 <span className="text-error">*</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  { value: 'planA', label: '方案A：续聘现有物业' },
                  { value: 'planB', label: '方案B：更换新物业' },
                  { value: 'planC', label: '暂不表态 / 观望' },
                ] as Array<{ value: MainPlan; label: string }>
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMainPlan(opt.value)}
                  className={`py-2.5 px-3 rounded-lg font-semibold text-left transition-all cursor-pointer ${
                    mainPlan === opt.value
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 方案A细则 */}
          {mainPlan !== 'planB' && (
            <div className="rounded-xl bg-surface-container-low p-3.5 space-y-3">
              <span className="text-[13px] font-bold text-secondary block">
                第二部分 · 方案A细则（Q2~Q5）
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[12px] text-on-surface-variant block mb-1">
                    Q2. 1个月整改达90%满意
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {AGREE_CHOICES.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setQ2Agreement(opt.value)}
                        className={`py-2 rounded-lg text-[12px] font-semibold cursor-pointer ${
                          q2Agreement === opt.value
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-lowest text-on-surface'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[12px] text-on-surface-variant block mb-1">
                    Q3. 达标后1个月补齐欠费
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {AGREE_CHOICES.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setQ3Agreement(opt.value)}
                        className={`py-2 rounded-lg text-[12px] font-semibold cursor-pointer ${
                          q3Agreement === opt.value
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-lowest text-on-surface'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[12px] text-on-surface-variant block mb-1.5">
                  Q4. 优先整改项目（多选）
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRIORITY_OPTIONS.map((opt) => {
                    const checked = q4Priorities.includes(opt.key);
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => togglePriority(q4Priorities, setQ4Priorities, opt.key)}
                        className={`px-2.5 py-1.5 rounded-lg text-[12px] inline-flex items-center gap-1 cursor-pointer ${
                          checked
                            ? 'bg-primary text-on-primary font-semibold'
                            : 'bg-surface-container-lowest text-on-surface-variant'
                        }`}
                      >
                        {checked && <Check className="w-3 h-3" />}
                        <span>{opt.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] text-on-surface-variant block mb-1">Q4. 其他补充</label>
                  <input
                    type="text"
                    value={q4Other}
                    onChange={(e) => setQ4Other(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/50 focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[12px] text-on-surface-variant block mb-1">Q5. 现物业诉求</label>
                  <input
                    type="text"
                    value={q5Feedback}
                    onChange={(e) => setQ5Feedback(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/50 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 方案B细则 */}
          {mainPlan !== 'planA' && (
            <div className="rounded-xl bg-surface-container-low p-3.5 space-y-3">
              <span className="text-[13px] font-bold text-primary block">
                第三部分 · 方案B选聘意向（Q6~Q10）
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[12px] text-on-surface-variant block mb-1">
                    Q6. 按预算匹配新物业
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {AGREE_CHOICES.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setQ6Agreement(opt.value)}
                        className={`py-2 rounded-lg text-[12px] font-semibold cursor-pointer ${
                          q6Agreement === opt.value
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-lowest text-on-surface'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[12px] text-on-surface-variant block mb-1">
                    Q8. 公共广告收益补贴
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {AGREE_CHOICES.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setQ8Ads(opt.value)}
                        className={`py-2 rounded-lg text-[12px] font-semibold cursor-pointer ${
                          q8Ads === opt.value
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-lowest text-on-surface'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[12px] text-on-surface-variant block mb-1">
                  Q7. 费用标准调整态度
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {(
                    [
                      { value: 'accept', label: '接受适当上调' },
                      { value: 'reject', label: '严格不接受上调' },
                      { value: 'uncertain', label: '暂不确定看明细' },
                    ] as Array<{ value: FeeAdjustChoice; label: string }>
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setQ7FeeAdjust(opt.value)}
                      className={`py-2 px-2 rounded-lg text-[12px] font-semibold cursor-pointer ${
                        q7FeeAdjust === opt.value
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-lowest text-on-surface'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[12px] text-on-surface-variant block mb-1.5">
                  Q9. 看重物业服务（多选）
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRIORITY_OPTIONS.map((opt) => {
                    const checked = q9Priorities.includes(opt.key);
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => togglePriority(q9Priorities, setQ9Priorities, opt.key)}
                        className={`px-2.5 py-1.5 rounded-lg text-[12px] inline-flex items-center gap-1 cursor-pointer ${
                          checked
                            ? 'bg-primary text-on-primary font-semibold'
                            : 'bg-surface-container-lowest text-on-surface-variant'
                        }`}
                      >
                        {checked && <Check className="w-3 h-3" />}
                        <span>{opt.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] text-on-surface-variant block mb-1">Q9. 其他补充</label>
                  <input
                    type="text"
                    value={q9Other}
                    onChange={(e) => setQ9Other(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/50 focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[12px] text-on-surface-variant block mb-1">Q10. 选聘具体要求</label>
                  <input
                    type="text"
                    value={q10Feedback}
                    onChange={(e) => setQ10Feedback(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/50 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 通用问题 Q11 & Q12 */}
          <div className="rounded-xl bg-surface-container-low p-3.5 space-y-3">
            <span className="text-[13px] font-bold text-on-surface block">
              第四部分 · 通用信息（Q11~Q12）
            </span>
            <div>
              <span className="text-[12px] text-on-surface-variant block mb-1">
                Q11. 物业欠费情况 <span className="text-error">*</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: 'none', label: '无欠费' },
                    { value: 'exist', label: '有欠费' },
                  ] as Array<{ value: ArrearsStatus; label: string }>
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setQ11Arrears(opt.value)}
                    className={`py-2 rounded-lg text-[12px] font-semibold cursor-pointer ${
                      q11Arrears === opt.value
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-lowest text-on-surface'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[12px] text-on-surface-variant block mb-1">Q12. 业主整体建言</label>
              <textarea
                rows={2}
                value={q12Feedback}
                onChange={(e) => setQ12Feedback(e.target.value)}
                placeholder="请输入业主建议..."
                className="w-full p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/50 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl p-3 bg-error-container text-on-error-container flex items-center gap-2 text-[12px] font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <div className="px-4 py-3 bg-surface-container-low flex items-center gap-2.5 border-t border-surface-container">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl bg-surface-container text-on-surface text-[14px] font-medium cursor-pointer hover:bg-surface-container-high"
          >
            取消
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex-[1.6] h-11 rounded-xl bg-primary text-on-primary text-[14px] font-semibold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-70"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>保存中...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEdit ? '保存修改' : '确认新增'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
