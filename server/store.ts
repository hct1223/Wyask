import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  AgreementChoice,
  FeeAdjustChoice,
  FeedbackItem,
  FilterGroup,
  KeywordCluster,
  MainPlan,
  PriorityKey,
  SurveyStats,
  SurveySubmission,
  SurveySubmissionPayload,
} from '../src/types/survey.ts';
import { PRIORITY_OPTIONS } from '../src/types/survey.ts';

const TOTAL_HOUSEHOLDS = 556;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'submissions.json');

export function normalizeRoomNumber(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, '')
    .replace(/号楼|幢/g, '栋')
    .replace(/([0-9]+)$/, '$1室')
    .toUpperCase();
}

export function formatDisplayRoom(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, '');
  const match = cleaned.match(/^(\d+栋)(\d+室?)$/);
  if (match) {
    const unit = match[2].endsWith('室') ? match[2] : `${match[2]}室`;
    return `${match[1]} ${unit}`;
  }
  return cleaned;
}

function makeHash(seed: string): string {
  return crypto.createHash('sha256').update(seed).digest('hex').slice(0, 16).toUpperCase();
}

function buildTags(payload: SurveySubmissionPayload): string[] {
  const tags: string[] = [];
  if (payload.mainPlan === 'planB') {
    if (payload.q9Priorities?.includes('elevator')) tags.push('看重电梯维保与响应');
    if (payload.q8Ads === 'agree') tags.push('支持利用公共收益补贴');
    if (payload.q7FeeAdjust === 'reject') tags.push('不接受单方调价');
    if (payload.q7FeeAdjust === 'accept') tags.push('接受质价相符微调');
    if (payload.q6Agreement === 'agree') tags.push('主张按预算公开选聘');
    if (payload.q10Feedback?.includes('保证金')) tags.push('要求履约保证金');
  } else if (payload.mainPlan === 'planA') {
    if (payload.q2Agreement === 'agree') tags.push('满意度需达90%');
    if (payload.q3Agreement === 'agree') tags.push('达标后配合补缴');
    if (payload.q4Priorities?.includes('elevator')) tags.push('优先整改电梯');
    if (payload.q4Priorities?.includes('sanitation')) tags.push('优先整改环境卫生');
  } else {
    tags.push('待进一步了解方案');
    tags.push(payload.q11Arrears === 'none' ? '无欠费户' : '有欠费户');
  }
  if (tags.length === 0) {
    tags.push(payload.q11Arrears === 'none' ? '无欠费户' : '有欠费户');
  }
  return tags.slice(0, 3);
}

function maskOwnerName(raw?: string): string {
  const name = (raw || '').trim();
  if (!name) return '已登记';
  const chars = Array.from(name);
  if (chars.length === 1) return `${chars[0]}*`;
  if (chars.length === 2) return `${chars[0]}*`;
  return `${chars[0]}${'*'.repeat(chars.length - 2)}${chars[chars.length - 1]}`;
}

function maskPhone(raw?: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length >= 7) {
    return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
  }
  return digits ? '已脱敏保密' : '未登记';
}

class SurveyStore {
  private submissions: SurveySubmission[] = [];

  constructor() {
    this.load();
  }

  toPublicSubmission(sub: SurveySubmission): SurveySubmission {
    const clean = { ...sub } as SurveySubmission & {
      wechatOpenId?: string;
      wechatNickname?: string;
      wechatAuthorized?: boolean;
    };
    delete clean.wechatOpenId;
    delete clean.wechatNickname;
    delete clean.wechatAuthorized;
    return {
      ...clean,
      ownerName: maskOwnerName(sub.ownerName),
      ownerPhone: maskPhone(sub.ownerPhone),
    };
  }

  private load() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Strip any previously seeded mock records so only real submissions remain
          const realRecords = parsed.filter((item) => !item?.isSeed);
          this.submissions = realRecords;
          if (realRecords.length !== parsed.length) {
            this.save();
          }
          return;
        }
      }
    } catch {
      // Initialize empty real storage if file missing or unreadable
    }
    this.submissions = [];
    this.save();
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.submissions, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist submissions:', err);
    }
  }

  getCounts() {
    const total = this.submissions.length;
    const planB = this.submissions.filter((s) => s.mainPlan === 'planB').length;
    const planA = this.submissions.filter((s) => s.mainPlan === 'planA').length;
    const planC = this.submissions.filter((s) => s.mainPlan === 'planC').length;
    return { total, planB, planA, planC };
  }

  querySubmissions(opts: {
    plan?: string;
    search?: string;
    sort?: string;
    limit?: number;
    offset?: number;
    includeSensitive?: boolean;
  }) {
    const {
      plan = 'all',
      search = '',
      sort = 'newest',
      limit = 30,
      offset = 0,
      includeSensitive = false,
    } = opts;
    let list = [...this.submissions];

    if (plan === 'planA' || plan === 'planB' || plan === 'planC') {
      list = list.filter((item) => item.mainPlan === plan);
    }

    if (search.trim()) {
      const rawQ = search.trim();
      const qUpper = rawQ.replace(/\s+/g, '').toUpperCase();
      list = list.filter((item) => {
        const basicHit =
          item.roomNumber.replace(/\s+/g, '').toUpperCase().includes(qUpper) ||
          item.normalizedRoom.includes(qUpper) ||
          item.receiptHash.includes(qUpper);
        if (basicHit) return true;
        if (includeSensitive) {
          return (
            (item.ownerName || '').includes(rawQ) ||
            (item.ownerPhone || '').includes(rawQ)
          );
        }
        return false;
      });
    }

    list.sort((a, b) => {
      const ta = new Date(a.submittedAt).getTime();
      const tb = new Date(b.submittedAt).getTime();
      return sort === 'oldest' ? ta - tb : tb - ta;
    });

    const totalFiltered = list.length;
    const sliced = list.slice(offset, offset + limit);
    const items = includeSensitive
      ? sliced
      : sliced.map((s) => this.toPublicSubmission(s));

    return {
      items,
      totalFiltered,
      hasMore: offset + items.length < totalFiltered,
      counts: this.getCounts(),
    };
  }

  getById(id: string, includeSensitive = false): SurveySubmission | undefined {
    const found = this.submissions.find((s) => s.id === id);
    if (!found) return undefined;
    return includeSensitive ? found : this.toPublicSubmission(found);
  }

  findByRoom(rawRoom: string): SurveySubmission | undefined {
    const norm = normalizeRoomNumber(rawRoom);
    const found = this.submissions.find((s) => s.normalizedRoom === norm);
    return found ? this.toPublicSubmission(found) : undefined;
  }

  createSubmission(
    payload: SurveySubmissionPayload
  ):
    | { ok: true; submission: SurveySubmission; rawSubmission: SurveySubmission }
    | { ok: false; status: number; message: string; existing?: SurveySubmission } {
    const rawRoom = payload.roomNumber?.trim() || '';
    const ownerName = payload.ownerName?.trim() || '';
    const ownerPhone = (payload.ownerPhone || '').replace(/[\s-]/g, '').trim();

    if (!rawRoom) {
      return { ok: false, status: 400, message: '请填写您的房号以便核验一户一票身份' };
    }
    if (!ownerName) {
      return { ok: false, status: 400, message: '请填写业主姓名以便核验身份' };
    }
    if (!/^1[3-9]\d{9}$/.test(ownerPhone)) {
      return { ok: false, status: 400, message: '请填写有效的11位手机号码' };
    }
    if (!payload.mainPlan || !['planA', 'planB', 'planC'].includes(payload.mainPlan)) {
      return { ok: false, status: 400, message: '请在第一部分第1题中选择您的意向倾向' };
    }
    if (!payload.q11Arrears || !['none', 'exist'].includes(payload.q11Arrears)) {
      return { ok: false, status: 400, message: '请在第四部分第11题中选择物业费缴纳情况' };
    }

    const normalizedRoom = normalizeRoomNumber(rawRoom);
    const existing = this.submissions.find((s) => s.normalizedRoom === normalizedRoom);
    if (existing) {
      return {
        ok: false,
        status: 409,
        message: `房号「${existing.roomNumber}」已完成一户一票实名备案，不可重复提交。`,
        existing: this.toPublicSubmission(existing),
      };
    }

    const now = new Date().toISOString();
    const displayRoom = formatDisplayRoom(rawRoom);
    const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const receiptHash = makeHash(`${normalizedRoom}-${ownerName}-${now}-${id}`);

    const record: SurveySubmission = {
      ...payload,
      ownerName,
      ownerPhone,
      id,
      roomNumber: displayRoom,
      normalizedRoom,
      fillDate: payload.fillDate || now.slice(0, 10),
      submittedAt: now,
      receiptHash,
      tags: buildTags(payload),
    };

    this.submissions.unshift(record);
    this.save();

    return { ok: true, submission: this.toPublicSubmission(record), rawSubmission: record };
  }

  updateSubmission(
    id: string,
    payload: SurveySubmissionPayload
  ):
    | { ok: true; submission: SurveySubmission; rawSubmission: SurveySubmission }
    | { ok: false; status: number; message: string } {
    const idx = this.submissions.findIndex((s) => s.id === id);
    if (idx === -1) {
      return { ok: false, status: 404, message: '未找到要修改的问卷记录' };
    }

    const rawRoom = payload.roomNumber?.trim() || '';
    const ownerName = payload.ownerName?.trim() || '';
    const ownerPhone = (payload.ownerPhone || '').replace(/[\s-]/g, '').trim();

    if (!rawRoom) {
      return { ok: false, status: 400, message: '请填写房号' };
    }
    if (!ownerName) {
      return { ok: false, status: 400, message: '请填写业主姓名' };
    }
    if (!/^1[3-9]\d{9}$/.test(ownerPhone)) {
      return { ok: false, status: 400, message: '请填写有效的11位手机号码' };
    }
    if (!payload.mainPlan || !['planA', 'planB', 'planC'].includes(payload.mainPlan)) {
      return { ok: false, status: 400, message: '请选择核心意向方案' };
    }
    if (!payload.q11Arrears || !['none', 'exist'].includes(payload.q11Arrears)) {
      return { ok: false, status: 400, message: '请选择物业欠费状态' };
    }

    const normalizedRoom = normalizeRoomNumber(rawRoom);
    const conflict = this.submissions.find(
      (s) => s.id !== id && s.normalizedRoom === normalizedRoom
    );
    if (conflict) {
      return {
        ok: false,
        status: 409,
        message: `房号「${conflict.roomNumber}」已被另一条备案记录占用，不能重复。`,
      };
    }

    const current = this.submissions[idx];
    const displayRoom = formatDisplayRoom(rawRoom);
    const updated: SurveySubmission = {
      ...payload,
      id: current.id,
      roomNumber: displayRoom,
      normalizedRoom,
      ownerName,
      ownerPhone,
      fillDate: payload.fillDate || current.fillDate,
      submittedAt: current.submittedAt,
      receiptHash: current.receiptHash,
      tags: buildTags(payload),
    };

    this.submissions[idx] = updated;
    this.save();

    return { ok: true, submission: this.toPublicSubmission(updated), rawSubmission: updated };
  }

  deleteSubmission(id: string): { ok: true; deletedId: string } | { ok: false; status: number; message: string } {
    const idx = this.submissions.findIndex((s) => s.id === id);
    if (idx === -1) {
      return { ok: false, status: 404, message: '未找到要删除的问卷记录' };
    }
    this.submissions.splice(idx, 1);
    this.save();
    return { ok: true, deletedId: id };
  }

  computeStats(filterGroup: FilterGroup = 'all'): SurveyStats {
    const allSubs = this.submissions;
    const filtered =
      filterGroup === 'all'
        ? allSubs
        : allSubs.filter((s) => s.q11Arrears === filterGroup);

    const submittedCount = filtered.length;
    const allSubmittedCount = allSubs.length;
    const pendingCount = Math.max(0, TOTAL_HOUSEHOLDS - allSubmittedCount);
    const coverageRate = Number(((allSubmittedCount / TOTAL_HOUSEHOLDS) * 100).toFixed(1));
    const quorumMet = coverageRate >= 66.7;

    const pct = (count: number, total: number) =>
      total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;

    const planBList = filtered.filter((s) => s.mainPlan === 'planB');
    const planAList = filtered.filter((s) => s.mainPlan === 'planA');
    const planCList = filtered.filter((s) => s.mainPlan === 'planC');

    // Q2 & Q3 (Plan A) & Q6 & Q8 (Plan B) — purely counted from actual responses
    const countAgree = (
      list: SurveySubmission[],
      field: 'q2Agreement' | 'q3Agreement' | 'q6Agreement' | 'q8Ads'
    ) => {
      const answered = list.filter((s) => Boolean(s[field]));
      const total = answered.length;
      const agree = answered.filter((s) => s[field] === 'agree').length;
      const disagree = answered.filter((s) => s[field] === 'disagree').length;
      const reserved = answered.filter((s) => s[field] === 'reserved').length;
      return {
        agree: { count: agree, rate: pct(agree, total) },
        disagree: { count: disagree, rate: pct(disagree, total) },
        reserved: { count: reserved, rate: pct(reserved, total) },
      };
    };

    // Q4 Top 5 purely from real Plan A selections
    const q4Counts = new Map<PriorityKey, number>();
    for (const opt of PRIORITY_OPTIONS) q4Counts.set(opt.key, 0);
    for (const s of planAList) {
      for (const p of s.q4Priorities || []) {
        q4Counts.set(p, (q4Counts.get(p) || 0) + 1);
      }
    }
    const q4Top5 = PRIORITY_OPTIONS.map((opt) => {
      const count = q4Counts.get(opt.key) || 0;
      return {
        key: opt.key,
        label: opt.label,
        shortLabel: opt.shortLabel,
        count,
        rate: pct(count, planAList.length),
      };
    })
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Q5 keyword extraction purely from real Q5 text, Q4 other text, and Q4 priority choices
    const keywordDefs: Array<{ label: string; patterns: string[]; priority?: PriorityKey }> = [
      { label: '电梯维保与故障响应', patterns: ['电梯', '困人'], priority: 'elevator' },
      { label: '小区环境卫生保洁', patterns: ['卫生', '垃圾', '保洁', '清理'], priority: 'sanitation' },
      { label: '地下车库与公共设施维修', patterns: ['车库', '渗水', '漏水', '路灯', '消防', '维修'], priority: 'facility' },
      { label: '安保巡逻与门禁管控', patterns: ['门禁', '安保', '保安', '外来'], priority: 'security' },
      { label: '停车秩序管理', patterns: ['停车', '车位', '乱停'], priority: 'parking' },
      { label: '账目公开与投诉响应', patterns: ['账目', '明细', '投诉', '响应', '反馈'], priority: 'complaints' },
      { label: '绿化养护', patterns: ['绿化', '草坪', '修剪'], priority: 'greening' },
    ];

    const q5Keywords: KeywordCluster[] = keywordDefs
      .map((def, idx) => {
        const count = planAList.filter((s) => {
          const text = `${s.q5Feedback || ''} ${s.q4Other || ''}`;
          const textHit = def.patterns.some((kw) => text.includes(kw));
          const priorityHit = def.priority ? Boolean(s.q4Priorities?.includes(def.priority)) : false;
          return textHit || priorityHit;
        }).length;
        return { label: def.label, count, highlight: idx === 0 };
      })
      .filter((k) => k.count > 0)
      .sort((a, b) => b.count - a.count)
      .map((k, idx) => ({ ...k, highlight: idx === 0 }));

    // Q7 (Plan B fee adjustment) purely from real answered Q7
    const q7Answered = planBList.filter((s) => Boolean(s.q7FeeAdjust));
    const q7Uncertain = q7Answered.filter((s) => s.q7FeeAdjust === 'uncertain').length;
    const q7Accept = q7Answered.filter((s) => s.q7FeeAdjust === 'accept').length;
    const q7Reject = q7Answered.filter((s) => s.q7FeeAdjust === 'reject').length;

    // Q9 service weights purely from real Plan B selections
    const q9ElevatorFacility = planBList.filter(
      (s) => s.q9Priorities?.includes('elevator') || s.q9Priorities?.includes('facility')
    ).length;
    const q9Security = planBList.filter((s) => s.q9Priorities?.includes('security')).length;
    const q9SanitationGreening = planBList.filter(
      (s) => s.q9Priorities?.includes('sanitation') || s.q9Priorities?.includes('greening')
    ).length;

    // Q10 guarantee/qualification mention rate from real Q10 feedback
    const q10Answered = planBList.filter(
      (s) => Boolean(s.q10Feedback && s.q10Feedback.trim().length > 0)
    );
    const q10GuaranteeCount = q10Answered.filter(
      (s) =>
        s.q10Feedback!.includes('保证金') ||
        s.q10Feedback!.includes('资质') ||
        s.q10Feedback!.includes('品牌') ||
        s.q10Feedback!.includes('百强') ||
        s.q10Feedback!.includes('考核')
    ).length;

    // Q11 cross-tab purely from real submissions
    const noArrearsList = allSubs.filter((s) => s.q11Arrears === 'none');
    const arrearsList = allSubs.filter((s) => s.q11Arrears === 'exist');
    const noArrearsPlanB = noArrearsList.filter((s) => s.mainPlan === 'planB').length;
    const arrearsPlanB = arrearsList.filter((s) => s.mainPlan === 'planB').length;

    // Q12 feedbacks purely from real submitted text (also fallback to Q5/Q10 if Q12 empty? No, keep Q12 or include any written suggestion clearly)
    const feedbacks: FeedbackItem[] = filtered
      .filter((s) => Boolean(s.q12Feedback && s.q12Feedback.trim().length > 0))
      .sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      )
      .slice(0, 20)
      .map((s) => ({
        id: s.id,
        author: `${s.roomNumber} 实名核验户`,
        plan: s.mainPlan,
        tag:
          s.mainPlan === 'planB'
            ? '支持方案B'
            : s.mainPlan === 'planA'
            ? '支持方案A'
            : '中立观望',
        text: s.q12Feedback!.startsWith('“') ? s.q12Feedback! : `“${s.q12Feedback!}”`,
        submittedAt: s.submittedAt,
      }));

    return {
      filterGroup,
      totalHouseholds: TOTAL_HOUSEHOLDS,
      submittedCount,
      pendingCount,
      coverageRate,
      quorumMet,
      validRate: allSubmittedCount > 0 ? 100 : 0,
      lastUpdated: new Date().toISOString(),
      q1: {
        total: submittedCount,
        planB: { count: planBList.length, rate: pct(planBList.length, submittedCount) },
        planA: { count: planAList.length, rate: pct(planAList.length, submittedCount) },
        planC: { count: planCList.length, rate: pct(planCList.length, submittedCount) },
      },
      planA: {
        sampleCount: planAList.length,
        q2: countAgree(planAList, 'q2Agreement'),
        q3: countAgree(planAList, 'q3Agreement'),
        q4Top5,
        q5Keywords,
      },
      planB: {
        sampleCount: planBList.length,
        q6: countAgree(planBList, 'q6Agreement'),
        q7: {
          uncertain: { count: q7Uncertain, rate: pct(q7Uncertain, q7Answered.length) },
          accept: { count: q7Accept, rate: pct(q7Accept, q7Answered.length) },
          reject: { count: q7Reject, rate: pct(q7Reject, q7Answered.length) },
        },
        q8: countAgree(planBList, 'q8Ads'),
        q9Weights: {
          elevatorFacilityRate: Math.round(pct(q9ElevatorFacility, planBList.length)),
          securityAccessRate: Math.round(pct(q9Security, planBList.length)),
          cleaningGreeningRate: Math.round(pct(q9SanitationGreening, planBList.length)),
        },
        q10GuaranteeMentionRate: pct(q10GuaranteeCount, q10Answered.length),
      },
      general: {
        noArrearsCount: noArrearsList.length,
        noArrearsRate: pct(noArrearsList.length, allSubmittedCount),
        noArrearsPlanBRate: pct(noArrearsPlanB, noArrearsList.length),
        arrearsCount: arrearsList.length,
        arrearsRate: pct(arrearsList.length, allSubmittedCount),
        arrearsPlanBRate: pct(arrearsPlanB, arrearsList.length),
        feedbacks,
      },
    };
  }

  toCsv(filterGroup: FilterGroup = 'all'): string {
    const headers = [
      '备案编号',
      '房号',
      '业主姓名(脱敏)',
      '联系电话(脱敏)',
      '填写日期',
      '提交时间',
      'Q1核心意向',
      'Q2整改期同意',
      'Q3补缴欠费同意',
      'Q4优先整改项目',
      'Q4其他补充',
      'Q5现物业建议',
      'Q6按预算选聘同意',
      'Q7调价接受度',
      'Q8广告收益补贴同意',
      'Q9看重服务项目',
      'Q9其他补充',
      'Q10新物业要求',
      'Q11物业欠费情况',
      'Q12整体建议',
      '区块链存证哈希',
    ];
    const escape = (val: string | undefined) => {
      const s = (val ?? '').replace(/"/g, '""');
      return `"${s}"`;
    };
    const planMap: Record<MainPlan, string> = {
      planA: '方案A：继续聘用现有物业公司',
      planB: '方案B：更换新的物业公司',
      planC: '暂不表态',
    };
    const agreeMap: Record<AgreementChoice, string> = {
      agree: '同意',
      disagree: '不同意',
      reserved: '保留意见',
    };
    const feeMap: Record<FeeAdjustChoice, string> = {
      accept: '接受适当上调',
      reject: '不接受上调',
      uncertain: '视幅度与服务明细而定',
    };
    const priorityMap = new Map(PRIORITY_OPTIONS.map((p) => [p.key, p.shortLabel]));
    const formatPriorities = (keys?: PriorityKey[]) =>
      (keys || []).map((k) => priorityMap.get(k) || k).join(' | ');

    const filtered =
      filterGroup === 'all'
        ? this.submissions
        : this.submissions.filter((s) => s.q11Arrears === filterGroup);

    const rows = filtered.map((s) =>
      [
        s.id,
        s.roomNumber,
        maskOwnerName(s.ownerName),
        maskPhone(s.ownerPhone),
        s.fillDate,
        s.submittedAt,
        planMap[s.mainPlan],
        s.q2Agreement ? agreeMap[s.q2Agreement] : '',
        s.q3Agreement ? agreeMap[s.q3Agreement] : '',
        formatPriorities(s.q4Priorities),
        s.q4Other || '',
        s.q5Feedback || '',
        s.q6Agreement ? agreeMap[s.q6Agreement] : '',
        s.q7FeeAdjust ? feeMap[s.q7FeeAdjust] : '',
        s.q8Ads ? agreeMap[s.q8Ads] : '',
        formatPriorities(s.q9Priorities),
        s.q9Other || '',
        s.q10Feedback || '',
        s.q11Arrears === 'none' ? '无欠费' : '有欠费',
        s.q12Feedback || '',
        s.receiptHash,
      ]
        .map(escape)
        .join(',')
    );

    return '\uFEFF' + [headers.map(escape).join(','), ...rows].join('\n');
  }
}

export const surveyStore = new SurveyStore();
