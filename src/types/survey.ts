export type MainPlan = 'planA' | 'planB' | 'planC';
export type AgreementChoice = 'agree' | 'disagree' | 'reserved';
export type FeeAdjustChoice = 'accept' | 'reject' | 'uncertain';
export type ArrearsStatus = 'none' | 'exist';
export type FilterGroup = 'all' | 'none' | 'exist';

export type PriorityKey =
  | 'sanitation'
  | 'elevator'
  | 'facility'
  | 'security'
  | 'greening'
  | 'parking'
  | 'complaints';

export interface PriorityMeta {
  key: PriorityKey;
  label: string;
  shortLabel: string;
}

export const PRIORITY_OPTIONS: PriorityMeta[] = [
  { key: 'sanitation', label: '小区环境卫生保洁', shortLabel: '环境卫生保洁' },
  { key: 'elevator', label: '电梯维保、故障响应速度', shortLabel: '电梯维保与响应' },
  { key: 'facility', label: '公共区域设施维修（路灯、门禁、消防、楼道等）', shortLabel: '公共设施维修' },
  { key: 'security', label: '安保巡逻、外来人员及车辆管理', shortLabel: '安保与门禁管控' },
  { key: 'greening', label: '绿化养护', shortLabel: '绿化养护' },
  { key: 'parking', label: '停车秩序管理', shortLabel: '停车秩序管理' },
  { key: 'complaints', label: '投诉响应、问题跟进反馈', shortLabel: '投诉响应闭环' },
];

export const PLAN_LABELS: Record<MainPlan, string> = {
  planA: '方案A：限期整改1个月',
  planB: '方案B：更换新物业',
  planC: '暂不表态',
};

export const AGREEMENT_LABELS: Record<AgreementChoice, string> = {
  agree: '同意',
  disagree: '不同意',
  reserved: '保留意见',
};

export const FEE_ADJUST_LABELS: Record<FeeAdjustChoice, string> = {
  accept: '可以接受上调，愿意参考市场合理标准',
  reject: '不接受上调，只能在现有费用水平寻找物业',
  uncertain: '暂不确定，要看上调幅度与对应的服务内容',
};

export interface SurveySubmissionPayload {
  roomNumber: string;
  fillDate: string;
  mainPlan: MainPlan;
  q2Agreement?: AgreementChoice;
  q3Agreement?: AgreementChoice;
  q4Priorities?: PriorityKey[];
  q4Other?: string;
  q5Feedback?: string;
  q6Agreement?: AgreementChoice;
  q7FeeAdjust?: FeeAdjustChoice;
  q8Ads?: AgreementChoice;
  q9Priorities?: PriorityKey[];
  q9Other?: string;
  q10Feedback?: string;
  q11Arrears: ArrearsStatus;
  q12Feedback?: string;
}

export interface SurveySubmission extends SurveySubmissionPayload {
  id: string;
  normalizedRoom: string;
  submittedAt: string;
  receiptHash: string;
  tags: string[];
  isSeed?: boolean;
}

export interface BreakdownCount {
  count: number;
  rate: number;
}

export interface PriorityStat {
  key: PriorityKey;
  label: string;
  shortLabel: string;
  count: number;
  rate: number;
}

export interface KeywordCluster {
  label: string;
  count: number;
  highlight?: boolean;
}

export interface FeedbackItem {
  id: string;
  author: string;
  plan: MainPlan;
  tag: string;
  text: string;
  submittedAt: string;
}

export interface SurveyStats {
  filterGroup: FilterGroup;
  totalHouseholds: number;
  submittedCount: number;
  pendingCount: number;
  coverageRate: number;
  quorumMet: boolean;
  validRate: number;
  lastUpdated: string;
  q1: {
    total: number;
    planB: BreakdownCount;
    planA: BreakdownCount;
    planC: BreakdownCount;
  };
  planA: {
    sampleCount: number;
    q2: {
      agree: BreakdownCount;
      disagree: BreakdownCount;
      reserved: BreakdownCount;
    };
    q3: {
      agree: BreakdownCount;
      disagree: BreakdownCount;
      reserved: BreakdownCount;
    };
    q4Top5: PriorityStat[];
    q5Keywords: KeywordCluster[];
  };
  planB: {
    sampleCount: number;
    q6: {
      agree: BreakdownCount;
      disagree: BreakdownCount;
      reserved: BreakdownCount;
    };
    q7: {
      uncertain: BreakdownCount;
      accept: BreakdownCount;
      reject: BreakdownCount;
    };
    q8: {
      agree: BreakdownCount;
      disagree: BreakdownCount;
      reserved: BreakdownCount;
    };
    q9Weights: {
      elevatorFacilityRate: number;
      securityAccessRate: number;
      cleaningGreeningRate: number;
    };
    q10GuaranteeMentionRate: number;
  };
  general: {
    noArrearsCount: number;
    noArrearsRate: number;
    noArrearsPlanBRate: number;
    arrearsCount: number;
    arrearsRate: number;
    arrearsPlanBRate: number;
    feedbacks: FeedbackItem[];
  };
}
