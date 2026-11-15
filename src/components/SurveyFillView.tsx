import {
  AlertCircle,
  BarChart3,
  Check,
  CheckCircle2,
  GitBranch,
  Heart,
  Info,
  Loader2,
  Send,
  Share2,
  ShieldCheck,
  Vote,
} from 'lucide-react';
import { useState } from 'react';
import {
  PRIORITY_OPTIONS,
  type AgreementChoice,
  type ArrearsStatus,
  type FeeAdjustChoice,
  type MainPlan,
  type PriorityKey,
  type SurveySubmission,
} from '../types/survey';
import { readJsonSafe } from '../utils/http';

interface SurveyFillViewProps {
  onSubmitted: (submission: SurveySubmission) => void;
  onGoToStats: () => void;
  onGoToList: () => void;
  onOpenShare: () => void;
}

const AGREE_CHOICES: Array<{ value: AgreementChoice; label: string }> = [
  { value: 'agree', label: '同意' },
  { value: 'disagree', label: '不同意' },
  { value: 'reserved', label: '保留意见' },
];

export function SurveyFillView({
  onSubmitted,
  onGoToStats,
  onGoToList,
  onOpenShare,
}: SurveyFillViewProps) {
  const today = new Date().toISOString().slice(0, 10);

  const [roomNumber, setRoomNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [phoneInvalidHint, setPhoneInvalidHint] = useState(false);
  const [fillDate, setFillDate] = useState(today);
  const [mainPlan, setMainPlan] = useState<MainPlan | ''>('');

  // Part 2: Plan A
  const [q2Agreement, setQ2Agreement] = useState<AgreementChoice | ''>('');
  const [q3Agreement, setQ3Agreement] = useState<AgreementChoice | ''>('');
  const [q4Priorities, setQ4Priorities] = useState<PriorityKey[]>([]);
  const [q4Other, setQ4Other] = useState('');
  const [q5Feedback, setQ5Feedback] = useState('');

  // Part 3: Plan B
  const [q6Agreement, setQ6Agreement] = useState<AgreementChoice | ''>('');
  const [q7FeeAdjust, setQ7FeeAdjust] = useState<FeeAdjustChoice | ''>('');
  const [q8Ads, setQ8Ads] = useState<AgreementChoice | ''>('');
  const [q9Priorities, setQ9Priorities] = useState<PriorityKey[]>([]);
  const [q9Other, setQ9Other] = useState('');
  const [q10Feedback, setQ10Feedback] = useState('');

  // Part 4: General
  const [q11Arrears, setQ11Arrears] = useState<ArrearsStatus | ''>('');
  const [q12Feedback, setQ12Feedback] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [duplicateRecord, setDuplicateRecord] = useState<SurveySubmission | null>(null);
  const [roomCheckStatus, setRoomCheckStatus] = useState<'idle' | 'available' | 'taken'>('idle');
  const [receipt, setReceipt] = useState<SurveySubmission | null>(null);

  const checkRoomAvailability = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setRoomCheckStatus('idle');
      return;
    }
    try {
      const res = await fetch(
        `/api/submissions/check?room=${encodeURIComponent(trimmed)}`
      );
      const parsed = await readJsonSafe<{
        exists?: boolean;
        existing?: SurveySubmission | null;
      }>(res);
      if (!parsed.ok || !parsed.data) return;
      const data = parsed.data;
      if (data.exists && data.existing) {
        setRoomCheckStatus('taken');
        setDuplicateRecord(data.existing);
      } else {
        setRoomCheckStatus('available');
        setDuplicateRecord(null);
      }
    } catch {
      // ignore network blur check errors
    }
  };

  const togglePriority = (
    list: PriorityKey[],
    setList: (next: PriorityKey[]) => void,
    key: PriorityKey
  ) => {
    if (list.includes(key)) {
      setList(list.filter((item) => item !== key));
    } else {
      setList([...list, key]);
    }
  };

  const guideText =
    mainPlan === 'planA'
      ? '当前选择：方案A，请优先填写第二部分问卷。'
      : mainPlan === 'planB'
      ? '当前选择：方案B，请优先填写第三部分问卷。'
      : mainPlan === 'planC'
      ? '您选择暂不表态，可根据关心项选择性填写两组建议，或直接填写第四部分。'
      : '提示：选择方案A请填写第二组，选择方案B请填写第三组。';

  const handleSubmit = async () => {
    setErrorMsg('');
    setDuplicateRecord(null);

    if (!roomNumber.trim()) {
      setErrorMsg('请填写您的房号以便核验一户一票身份');
      document.getElementById('roomNumber')?.focus();
      return;
    }
    if (!ownerName.trim()) {
      setErrorMsg('请填写业主姓名以便核验身份');
      document.getElementById('ownerName')?.focus();
      return;
    }
    const cleanPhone = ownerPhone.replace(/[\s-]/g, '').trim();
    if (!/^1[3-9]\d{9}$/.test(cleanPhone)) {
      setPhoneInvalidHint(true);
      setErrorMsg('请填写有效的11位手机号码');
      document.getElementById('ownerPhone')?.focus();
      return;
    }
    if (!mainPlan) {
      setErrorMsg('请在第一部分第1题中选择您的意向倾向');
      document.getElementById('question1-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!q11Arrears) {
      setErrorMsg('请在第四部分第11题中选择您目前的物业费缴纳情况');
      document.getElementById('question11-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
      });

      const parsed = await readJsonSafe<
        SurveySubmission & { message?: string; existing?: SurveySubmission }
      >(res);
      const data = parsed.data;
      if (!parsed.ok || !data) {
        setErrorMsg(data?.message || parsed.errorMessage || '提交失败，请检查填写内容');
        if (data?.existing) {
          setDuplicateRecord(data.existing);
        }
        return;
      }

      setReceipt(data);
      onSubmitted(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setErrorMsg('网络请求失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (receipt) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 pb-10 space-y-4">
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-5 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary-fixed text-secondary mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-[22px] font-bold text-on-surface">
              问卷已成功提交并存证
            </h2>
            <p className="text-[14px] text-on-surface-variant">
              感谢您为利安花园社区治理贡献宝贵的一票！统计数据已实时同步更新。
            </p>
          </div>

          <div className="rounded-xl bg-surface-container-low p-4 text-left space-y-2.5 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant">实名备案房号</span>
              <span className="font-bold text-on-surface">{receipt.roomNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant">业主核验信息</span>
              <span className="font-semibold text-on-surface">
                {receipt.ownerName} · {receipt.ownerPhone}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant">核心倾向方案</span>
              <span className="font-semibold text-primary">
                {receipt.mainPlan === 'planB'
                  ? '方案B：更换新的物业公司'
                  : receipt.mainPlan === 'planA'
                  ? '方案A：继续聘用现有物业公司'
                  : '暂不表态'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant">区块链存证哈希</span>
              <span className="font-mono text-[12px] font-semibold text-secondary">
                {receipt.receiptHash}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={onGoToStats}
              className="h-12 rounded-xl bg-primary text-on-primary text-[14px] font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <BarChart3 className="w-4 h-4" />
              <span>查看实时统计结果</span>
            </button>
            <button
              type="button"
              onClick={onOpenShare}
              className="h-12 rounded-xl bg-secondary text-on-secondary text-[14px] font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>转发链接给邻居</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onGoToList}
            className="w-full h-11 rounded-xl bg-surface-container text-primary text-[13px] font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            在提交记录公示列表中查看
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-10 space-y-4">
      {/* Top Notification & Title Banner */}
      <section className="rounded-xl p-4 bg-surface-container shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <Vote className="w-7 h-7 text-primary shrink-0" />
          <h1 className="text-[20px] sm:text-[22px] font-bold text-primary tracking-tight leading-snug">
            利安花园物业处置方案业主调查问卷
          </h1>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-variant text-on-surface-variant">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-[13px] leading-relaxed">
            本问卷为业主意见征集，用于业委会研判物业后续处置方向。严格执行一户一票，姓名与手机号仅用于业委会核验联系，对外展示自动脱敏保密。
          </p>
        </div>

        {/* Verification / Metadata Card */}
        <div className="rounded-lg p-3.5 bg-surface-container-lowest space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-on-surface-variant">小区名称</span>
            <span className="text-[14px] font-semibold text-on-surface bg-surface-container px-3 py-1 rounded-full">
              利安花园
            </span>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="roomNumber"
              className="text-[13px] font-medium text-on-surface flex items-center gap-1"
            >
              <span>房号</span>
              <span className="text-error font-bold">*</span>
            </label>
            <input
              id="roomNumber"
              type="text"
              value={roomNumber}
              onChange={(e) => {
                setRoomNumber(e.target.value);
                if (errorMsg) setErrorMsg('');
                if (roomCheckStatus !== 'idle') setRoomCheckStatus('idle');
              }}
              onBlur={(e) => checkRoomAvailability(e.target.value)}
              placeholder="例如：1栋102室（仅用于核验一户一票，信息保密）"
              className="w-full h-12 px-3 rounded-lg bg-surface-container-low text-on-surface text-[14px] placeholder:text-outline border border-transparent focus:border-primary focus:bg-surface-container-lowest focus:outline-none transition-colors"
            />
            {roomCheckStatus === 'available' && (
              <p className="text-[12px] text-secondary font-medium pt-0.5">
                核验通过：该房号尚未提交，可正常参与一户一票表决。
              </p>
            )}
            {roomCheckStatus === 'taken' && duplicateRecord && (
              <p className="text-[12px] text-error font-medium pt-0.5">
                提示：房号「{duplicateRecord.roomNumber}」已完成投票备案（哈希 {duplicateRecord.receiptHash}），不可重复提交。
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="ownerName"
                className="text-[13px] font-medium text-on-surface flex items-center gap-1"
              >
                <span>业主姓名</span>
                <span className="text-error font-bold">*</span>
              </label>
              <input
                id="ownerName"
                type="text"
                value={ownerName}
                onChange={(e) => {
                  setOwnerName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="请输入业主真实姓名"
                className="w-full h-12 px-3 rounded-lg bg-surface-container-low text-on-surface text-[14px] placeholder:text-outline border border-transparent focus:border-primary focus:bg-surface-container-lowest focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="ownerPhone"
                className="text-[13px] font-medium text-on-surface flex items-center gap-1"
              >
                <span>手机号</span>
                <span className="text-error font-bold">*</span>
              </label>
              <input
                id="ownerPhone"
                type="tel"
                inputMode="numeric"
                maxLength={11}
                value={ownerPhone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d]/g, '');
                  setOwnerPhone(val);
                  if (phoneInvalidHint && /^1[3-9]\d{9}$/.test(val)) {
                    setPhoneInvalidHint(false);
                  }
                  if (errorMsg) setErrorMsg('');
                }}
                onBlur={() => {
                  if (ownerPhone && !/^1[3-9]\d{9}$/.test(ownerPhone)) {
                    setPhoneInvalidHint(true);
                  } else {
                    setPhoneInvalidHint(false);
                  }
                }}
                placeholder="请输入11位手机号码"
                className="w-full h-12 px-3 rounded-lg bg-surface-container-low text-on-surface text-[14px] placeholder:text-outline border border-transparent focus:border-primary focus:bg-surface-container-lowest focus:outline-none transition-colors tabular-nums"
              />
              {phoneInvalidHint && (
                <p className="text-[12px] text-error font-medium pt-0.5">
                  请输入有效的11位中国大陆手机号码。
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="fillDate" className="text-[13px] font-medium text-on-surface block">
              填写日期
            </label>
            <input
              id="fillDate"
              type="date"
              value={fillDate}
              onChange={(e) => setFillDate(e.target.value)}
              className="w-full h-12 px-3 rounded-lg bg-surface-container-low text-on-surface text-[14px] focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Part 1: Basic Intention */}
      <section
        id="question1-section"
        className="rounded-xl p-4 bg-surface-container-lowest shadow-sm space-y-4"
      >
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-primary text-on-primary text-[11px] font-semibold">
            第一部分
          </span>
          <h2 className="text-[16px] font-semibold text-on-surface">基础意向</h2>
        </div>

        <div className="space-y-3">
          <p className="text-[16px] text-on-surface font-medium leading-relaxed">
            第1题：您更倾向以下哪一种物业处置方案？{' '}
            <span className="text-error font-bold">*</span>
            <span className="text-[12px] text-on-surface-variant font-normal">（单选）</span>
          </p>

          <div className="space-y-2.5">
            {(
              [
                { value: 'planA', label: '方案A：继续聘用现有物业公司' },
                { value: 'planB', label: '方案B：更换新的物业公司' },
                { value: 'planC', label: '暂不表态，希望先了解更多信息' },
              ] as Array<{ value: MainPlan; label: string }>
            ).map((opt) => {
              const selected = mainPlan === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMainPlan(opt.value)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition-all cursor-pointer select-none ${
                    selected
                      ? 'bg-primary-container text-on-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="text-[15px] font-semibold pr-3">{opt.label}</span>
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      selected ? 'bg-surface-container-lowest' : 'bg-surface-variant'
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        selected ? 'bg-primary' : 'bg-transparent'
                      }`}
                    />
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-container text-on-surface-variant">
            <GitBranch className="w-4 h-4 text-primary shrink-0" />
            <span className="text-[13px]">{guideText}</span>
          </div>
        </div>
      </section>

      {/* Part 2: Plan A Section */}
      <section
        className={`rounded-xl p-4 bg-surface-container-lowest shadow-sm space-y-5 transition-opacity duration-200 ${
          mainPlan === 'planB' ? 'opacity-45' : 'opacity-100'
        }`}
      >
        <div className="flex items-start gap-2">
          <span className="px-2 py-0.5 rounded bg-secondary text-on-secondary text-[11px] font-semibold shrink-0 mt-0.5">
            第二部分
          </span>
          <h2 className="text-[16px] font-semibold text-on-surface leading-snug">
            如您选择【方案A：续聘现有物业】，请填写本组问题
          </h2>
        </div>

        {/* Q2 */}
        <div className="space-y-2.5">
          <p className="text-[15px] text-on-surface font-medium leading-relaxed">
            第2题：是否同意：业委会收集业主服务诉求，与现物业协商达成协议后，给予物业1个月整改期，整改目标为业主满意度90%？
          </p>
          <div className="grid grid-cols-3 gap-2">
            {AGREE_CHOICES.map((opt) => {
              const selected = q2Agreement === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setQ2Agreement(opt.value)}
                  className={`py-3 px-2 rounded-xl text-[14px] font-semibold transition-all cursor-pointer ${
                    selected
                      ? 'bg-primary-container text-on-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Q3 */}
        <div className="space-y-2.5">
          <p className="text-[15px] text-on-surface font-medium leading-relaxed">
            第3题：是否同意：物业整改验收达标后，欠费业主在整改结束后1个月内补齐物业欠费？
          </p>
          <div className="grid grid-cols-3 gap-2">
            {AGREE_CHOICES.map((opt) => {
              const selected = q3Agreement === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setQ3Agreement(opt.value)}
                  className={`py-3 px-2 rounded-xl text-[14px] font-semibold transition-all cursor-pointer ${
                    selected
                      ? 'bg-primary-container text-on-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Q4 */}
        <div className="space-y-2.5">
          <p className="text-[15px] text-on-surface font-medium">
            第4题：您最希望物业公司优先整改哪些服务项目？{' '}
            <span className="text-[12px] text-on-surface-variant font-normal">
              （可多选，可补充）
            </span>
          </p>
          <div className="grid grid-cols-1 gap-2">
            {PRIORITY_OPTIONS.map((opt) => {
              const checked = q4Priorities.includes(opt.key);
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => togglePriority(q4Priorities, setQ4Priorities, opt.key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors cursor-pointer ${
                    checked
                      ? 'bg-surface-container-high text-on-surface'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                      checked
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-highest text-transparent'
                    }`}
                  >
                    {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                  </span>
                  <span className="text-[14px]">{opt.label}</span>
                </button>
              );
            })}
          </div>
          <div className="pt-1">
            <label className="text-[12px] text-on-surface-variant block">其他补充：</label>
            <input
              type="text"
              value={q4Other}
              onChange={(e) => setQ4Other(e.target.value)}
              placeholder="请输入其他希望整改的事项..."
              className="w-full h-11 mt-1 px-3 rounded-lg bg-surface-container-low text-on-surface text-[14px] placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest border border-transparent focus:border-primary"
            />
          </div>
        </div>

        {/* Q5 */}
        <div className="space-y-1.5">
          <label htmlFor="q5Feedback" className="text-[15px] text-on-surface font-medium block">
            第5题：您对现有物业还有其他意见或诉求：
          </label>
          <textarea
            id="q5Feedback"
            rows={3}
            value={q5Feedback}
            onChange={(e) => setQ5Feedback(e.target.value)}
            placeholder="请输入您的宝贵意见..."
            className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface text-[14px] placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest border border-transparent focus:border-primary"
          />
        </div>
      </section>

      {/* Part 3: Plan B Section */}
      <section
        className={`rounded-xl p-4 bg-surface-container-lowest shadow-sm space-y-5 transition-opacity duration-200 ${
          mainPlan === 'planA' ? 'opacity-45' : 'opacity-100'
        }`}
      >
        <div className="flex items-start gap-2">
          <span className="px-2 py-0.5 rounded bg-tertiary-container text-on-primary text-[11px] font-semibold shrink-0 mt-0.5">
            第三部分
          </span>
          <h2 className="text-[16px] font-semibold text-on-surface leading-snug">
            如您选择【方案B：更换新物业】，请填写本组问题
          </h2>
        </div>

        {/* Q6 */}
        <div className="space-y-2.5">
          <p className="text-[15px] text-on-surface font-medium leading-relaxed">
            第6题：是否同意：业委会核算小区现有物业费总收入，根据资金预算寻找匹配的新物业公司，并明确服务内容？
          </p>
          <div className="grid grid-cols-3 gap-2">
            {AGREE_CHOICES.map((opt) => {
              const selected = q6Agreement === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setQ6Agreement(opt.value)}
                  className={`py-3 px-2 rounded-xl text-[14px] font-semibold transition-all cursor-pointer ${
                    selected
                      ? 'bg-primary-container text-on-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Q7 */}
        <div className="space-y-2.5">
          <p className="text-[15px] text-on-surface font-medium leading-relaxed">
            第7题：如果现有物业费收入不足以覆盖预期物业服务，您是否接受适度调整物业费、停车费标准？
          </p>
          <div className="space-y-2">
            {(
              [
                { value: 'accept', label: '可以接受上调，愿意参考市场合理标准' },
                { value: 'reject', label: '不接受上调，只能在现有费用水平寻找物业' },
                { value: 'uncertain', label: '暂不确定，要看上调幅度与对应的服务内容' },
              ] as Array<{ value: FeeAdjustChoice; label: string }>
            ).map((opt) => {
              const selected = q7FeeAdjust === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setQ7FeeAdjust(opt.value)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left transition-all cursor-pointer ${
                    selected
                      ? 'bg-primary-container text-on-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="text-[14px] pr-3">{opt.label}</span>
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      selected ? 'bg-surface-container-lowest' : 'bg-surface-variant'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selected ? 'bg-primary' : 'bg-transparent'
                      }`}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Q8 */}
        <div className="space-y-2.5">
          <p className="text-[15px] text-on-surface font-medium leading-relaxed">
            第8题：是否同意：利用小区公共区域引进广告，增加小区公共收益，补贴物业运营开支？
          </p>
          <div className="grid grid-cols-3 gap-2">
            {AGREE_CHOICES.map((opt) => {
              const selected = q8Ads === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setQ8Ads(opt.value)}
                  className={`py-3 px-2 rounded-xl text-[14px] font-semibold transition-all cursor-pointer ${
                    selected
                      ? 'bg-primary-container text-on-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Q9 */}
        <div className="space-y-2.5">
          <p className="text-[15px] text-on-surface font-medium">
            第9题：更换物业后，您最看重哪些物业服务？{' '}
            <span className="text-[12px] text-on-surface-variant font-normal">
              （可多选，可补充）
            </span>
          </p>
          <div className="grid grid-cols-1 gap-2">
            {PRIORITY_OPTIONS.map((opt) => {
              const checked = q9Priorities.includes(opt.key);
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => togglePriority(q9Priorities, setQ9Priorities, opt.key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors cursor-pointer ${
                    checked
                      ? 'bg-surface-container-high text-on-surface'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                      checked
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-highest text-transparent'
                    }`}
                  >
                    {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                  </span>
                  <span className="text-[14px]">{opt.label}</span>
                </button>
              );
            })}
          </div>
          <div className="pt-1">
            <label className="text-[12px] text-on-surface-variant block">其他补充：</label>
            <input
              type="text"
              value={q9Other}
              onChange={(e) => setQ9Other(e.target.value)}
              placeholder="请输入其他您看重的服务..."
              className="w-full h-11 mt-1 px-3 rounded-lg bg-surface-container-low text-on-surface text-[14px] placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest border border-transparent focus:border-primary"
            />
          </div>
        </div>

        {/* Q10 */}
        <div className="space-y-1.5">
          <label htmlFor="q10Feedback" className="text-[15px] text-on-surface font-medium block">
            第10题：您对选聘新物业还有其他想法或要求：
          </label>
          <textarea
            id="q10Feedback"
            rows={3}
            value={q10Feedback}
            onChange={(e) => setQ10Feedback(e.target.value)}
            placeholder="请输入您的想法或具体要求..."
            className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface text-[14px] placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest border border-transparent focus:border-primary"
          />
        </div>
      </section>

      {/* Part 4: General Questions */}
      <section
        id="question11-section"
        className="rounded-xl p-4 bg-surface-container-lowest shadow-sm space-y-5"
      >
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-inverse-surface text-inverse-on-surface text-[11px] font-semibold">
            第四部分
          </span>
          <h2 className="text-[16px] font-semibold text-on-surface">
            通用问题（所有业主均填写）
          </h2>
        </div>

        {/* Q11 */}
        <div className="space-y-2.5">
          <p className="text-[15px] text-on-surface font-medium">
            第11题：您目前是否存在物业欠费情况？{' '}
            <span className="text-error font-bold">*</span>
            <span className="text-[12px] text-on-surface-variant font-normal">（单选）</span>
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {(
              [
                { value: 'none', label: '无欠费' },
                { value: 'exist', label: '有欠费' },
              ] as Array<{ value: ArrearsStatus; label: string }>
            ).map((opt) => {
              const selected = q11Arrears === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setQ11Arrears(opt.value)}
                  className={`flex items-center justify-between p-3.5 rounded-xl transition-all cursor-pointer ${
                    selected
                      ? 'bg-primary-container text-on-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="text-[15px] font-semibold">{opt.label}</span>
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      selected ? 'bg-surface-container-lowest' : 'bg-surface-variant'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selected ? 'bg-primary' : 'bg-transparent'
                      }`}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Q12 */}
        <div className="space-y-1.5">
          <label htmlFor="q12Feedback" className="text-[15px] text-on-surface font-medium block">
            第12题：您对小区物业服务还有其他整体建议：
          </label>
          <textarea
            id="q12Feedback"
            rows={3}
            value={q12Feedback}
            onChange={(e) => setQ12Feedback(e.target.value)}
            placeholder="写下您对利安花园未来生活品质的期望与建议..."
            className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface text-[14px] placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest border border-transparent focus:border-primary"
          />
        </div>
      </section>

      {/* Inline Validation / Duplicate Feedback */}
      {errorMsg && (
        <div className="rounded-xl p-3.5 bg-error-container text-on-error-container flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <p className="text-[13px] font-semibold">{errorMsg}</p>
            {duplicateRecord && (
              <p className="text-[12px]">
                存证哈希：<span className="font-mono font-bold">{duplicateRecord.receiptHash}</span>{' '}
                · 已于 {duplicateRecord.fillDate} 提交。{' '}
                <button
                  type="button"
                  onClick={onGoToList}
                  className="underline font-semibold cursor-pointer"
                >
                  去提交记录中查看
                </button>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Bottom Thank You & Submission Card */}
      <section className="rounded-xl p-4 bg-surface-container text-on-surface space-y-3.5">
        <div className="flex items-center gap-2.5">
          <Heart className="w-6 h-6 text-secondary shrink-0" />
          <p className="text-[14px] font-medium leading-relaxed">
            感谢您的参与！您的意见将作为业委会推进物业处置工作的重要依据。
          </p>
        </div>

        <button
          type="button"
          disabled={submitting}
          onClick={handleSubmit}
          className="w-full h-12 rounded-xl bg-primary text-on-primary text-[16px] font-semibold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer disabled:opacity-75"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>正在安全存证提交...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>提交问卷</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-1.5 text-on-surface-variant pt-0.5">
          <ShieldCheck className="w-4 h-4 text-secondary shrink-0" />
          <span className="text-[11px] font-semibold">
            业委会加密存证 · 实名核验一户一票 · 隐私严格受保
          </span>
        </div>
      </section>
    </div>
  );
}
