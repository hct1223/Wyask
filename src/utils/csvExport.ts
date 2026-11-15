import type { FilterGroup, SurveyStats } from '../types/survey';

function escapeCsvCell(val: string | number | undefined | null): string {
  const s = String(val ?? '').replace(/"/g, '""');
  return `"${s}"`;
}

function downloadCsvBlob(csvContent: string, filename: string) {
  const withBom = csvContent.startsWith('\uFEFF') ? csvContent : `\uFEFF${csvContent}`;
  const blob = new Blob([withBom], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function getFilterTag(filterGroup: FilterGroup): string {
  if (filterGroup === 'none') return '无欠费组';
  if (filterGroup === 'exist') return '欠费户组';
  return '全小区';
}

export function exportStatsSummaryCsv(stats: SurveyStats): void {
  const filterTag = getFilterTag(stats.filterGroup);
  const dateTag = new Date().toISOString().slice(0, 10);
  const updatedStr = new Date(stats.lastUpdated).toLocaleString('zh-CN', { hour12: false });

  const rows: Array<Array<string | number>> = [
    ['分类模块', '题号/指标', '选项/维度', '票数/数值', '占比(%)', '统计口径与说明'],
    ['总体概览', '统计口径', filterTag, stats.submittedCount, stats.coverageRate, `更新于 ${updatedStr}`],
    ['总体概览', '小区总户数', '利安花园产权总户数', stats.totalHouseholds, 100, '法定基数'],
    ['总体概览', '已提交户数', '一户一票实名核验', stats.submittedCount, stats.coverageRate, stats.quorumMet ? '已过2/3法定门槛(66.7%)' : '未达2/3法定门槛(66.7%)'],
    ['总体概览', '待提交户数', '尚未参与表决户数', stats.pendingCount, Number((100 - stats.coverageRate).toFixed(1)), '全区口径'],
    ['总体概览', '数据有效率', '房产确权核验有效率', stats.validRate, stats.validRate, stats.submittedCount > 0 ? '0作废' : '暂无有效样本'],

    ['第一部分', 'Q01 核心意向', '方案B：更换新的物业公司', stats.q1.planB.count, stats.q1.planB.rate, `总样本 ${stats.q1.total} 票`],
    ['第一部分', 'Q01 核心意向', '方案A：继续聘用现有物业公司', stats.q1.planA.count, stats.q1.planA.rate, `总样本 ${stats.q1.total} 票`],
    ['第一部分', 'Q01 核心意向', '暂不表态 / 需更多信息', stats.q1.planC.count, stats.q1.planC.rate, `总样本 ${stats.q1.total} 票`],

    ['第二部分(方案A)', 'Q02 1个月整改期达90%满意', '同意', stats.planA.q2.agree.count, stats.planA.q2.agree.rate, `方案A样本 ${stats.planA.sampleCount} 人`],
    ['第二部分(方案A)', 'Q02 1个月整改期达90%满意', '不同意', stats.planA.q2.disagree.count, stats.planA.q2.disagree.rate, `方案A样本 ${stats.planA.sampleCount} 人`],
    ['第二部分(方案A)', 'Q02 1个月整改期达90%满意', '保留意见', stats.planA.q2.reserved.count, stats.planA.q2.reserved.rate, `方案A样本 ${stats.planA.sampleCount} 人`],

    ['第二部分(方案A)', 'Q03 达标后1个月补齐欠费', '同意', stats.planA.q3.agree.count, stats.planA.q3.agree.rate, `方案A样本 ${stats.planA.sampleCount} 人`],
    ['第二部分(方案A)', 'Q03 达标后1个月补齐欠费', '不同意', stats.planA.q3.disagree.count, stats.planA.q3.disagree.rate, `方案A样本 ${stats.planA.sampleCount} 人`],
    ['第二部分(方案A)', 'Q03 达标后1个月补齐欠费', '保留意见', stats.planA.q3.reserved.count, stats.planA.q3.reserved.rate, `方案A样本 ${stats.planA.sampleCount} 人`],
  ];

  stats.planA.q4Top5.forEach((item, idx) => {
    rows.push([
      '第二部分(方案A)',
      `Q04 优先整改Top${idx + 1}`,
      item.label,
      item.count,
      item.rate,
      '多选题占比',
    ]);
  });

  stats.planA.q5Keywords.forEach((kw) => {
    rows.push(['第二部分(方案A)', 'Q05 整改重点词频', kw.label, kw.count, '', '关键词出现次数']);
  });

  rows.push(
    ['第三部分(方案B)', 'Q06 按预算匹配新物业', '同意', stats.planB.q6.agree.count, stats.planB.q6.agree.rate, `方案B样本 ${stats.planB.sampleCount} 人`],
    ['第三部分(方案B)', 'Q06 按预算匹配新物业', '不同意', stats.planB.q6.disagree.count, stats.planB.q6.disagree.rate, `方案B样本 ${stats.planB.sampleCount} 人`],
    ['第三部分(方案B)', 'Q06 按预算匹配新物业', '保留意见', stats.planB.q6.reserved.count, stats.planB.q6.reserved.rate, `方案B样本 ${stats.planB.sampleCount} 人`],

    ['第三部分(方案B)', 'Q07 费用标准调价接受度', '暂不确定，看上调幅度与服务明细', stats.planB.q7.uncertain.count, stats.planB.q7.uncertain.rate, '方案B有效作答占比'],
    ['第三部分(方案B)', 'Q07 费用标准调价接受度', '可以接受适当上调', stats.planB.q7.accept.count, stats.planB.q7.accept.rate, '方案B有效作答占比'],
    ['第三部分(方案B)', 'Q07 费用标准调价接受度', '严格不接受上调', stats.planB.q7.reject.count, stats.planB.q7.reject.rate, '方案B有效作答占比'],

    ['第三部分(方案B)', 'Q08 引入公共广告收益补贴', '同意', stats.planB.q8.agree.count, stats.planB.q8.agree.rate, `方案B样本 ${stats.planB.sampleCount} 人`],
    ['第三部分(方案B)', 'Q08 引入公共广告收益补贴', '不同意', stats.planB.q8.disagree.count, stats.planB.q8.disagree.rate, `方案B样本 ${stats.planB.sampleCount} 人`],
    ['第三部分(方案B)', 'Q08 引入公共广告收益补贴', '保留意见', stats.planB.q8.reserved.count, stats.planB.q8.reserved.rate, `方案B样本 ${stats.planB.sampleCount} 人`],

    ['第三部分(方案B)', 'Q09 考核权重要素', '电梯及设施安全', '', stats.planB.q9Weights.elevatorFacilityRate, '选聘关注度'],
    ['第三部分(方案B)', 'Q09 考核权重要素', '安保与门禁管理', '', stats.planB.q9Weights.securityAccessRate, '选聘关注度'],
    ['第三部分(方案B)', 'Q09 考核权重要素', '保洁与绿化养护', '', stats.planB.q9Weights.cleaningGreeningRate, '选聘关注度'],
    ['第三部分(方案B)', 'Q10 准入硬性门槛提及率', '履约保证金/品牌资质', '', stats.planB.q10GuaranteeMentionRate, 'Q10填写者中提及占比'],

    ['第四部分(通用)', 'Q11 缴费状态交叉统计', '无欠费户（及其中支持方案B占比）', stats.general.noArrearsCount, stats.general.noArrearsRate, `支持更换物业占比 ${stats.general.noArrearsPlanBRate}%`],
    ['第四部分(通用)', 'Q11 缴费状态交叉统计', '有欠费户（及其中支持方案B占比）', stats.general.arrearsCount, stats.general.arrearsRate, `支持更换物业占比 ${stats.general.arrearsPlanBRate}%`]
  );

  stats.general.feedbacks.forEach((fb, idx) => {
    rows.push([
      '第四部分(通用)',
      `Q12 业主建言 #${idx + 1}`,
      `${fb.author} (${fb.tag})`,
      '',
      '',
      fb.text,
    ]);
  });

  const csvStr = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
  downloadCsvBlob(csvStr, `利安花园业主表决统计结果汇总_${filterTag}_${dateTag}.csv`);
}

export async function exportFilteredDetailsCsv(filterGroup: FilterGroup): Promise<void> {
  const filterTag = getFilterTag(filterGroup);
  const dateTag = new Date().toISOString().slice(0, 10);
  const res = await fetch(`/api/export/csv?arrears=${encodeURIComponent(filterGroup)}`);
  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  const csvText = await res.text();
  if (!res.ok || contentType.includes('text/html') || csvText.trim().startsWith('<')) {
    throw new Error('CSV 导出失败，请刷新后重试');
  }
  downloadCsvBlob(csvText, `利安花园业主表决答卷明细_${filterTag}_${dateTag}.csv`);
}
