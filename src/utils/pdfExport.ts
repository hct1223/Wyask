import type { SurveyStats } from '../types/survey';

const PAGE_W = 1240;
const PAGE_H = 1754;
const PAD = 64;
const CONTENT_W = PAGE_W - PAD * 2;
const FONT_FAMILY =
  '"Plus Jakarta Sans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawTextWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const chars = Array.from(text);
  let line = '';
  let curY = y;
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, curY);
      line = ch;
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, curY);
    curY += lineHeight;
  }
  return curY;
}

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  pct: number,
  color: string,
  trackColor = '#e5eeff'
) {
  ctx.fillStyle = trackColor;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();

  const fillW = Math.max(pct > 0 ? h : 0, (w * Math.min(100, Math.max(0, pct))) / 100);
  if (fillW > 0) {
    ctx.fillStyle = color;
    roundRect(ctx, x, y, fillW, h, h / 2);
    ctx.fill();
  }
}

function createPageCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f8f9ff';
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  return [canvas, ctx];
}

function drawPageFooter(ctx: CanvasRenderingContext2D, pageNum: number, totalPages: number) {
  ctx.fillStyle = '#757684';
  ctx.font = `500 18px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.fillText('利安花园业主大会秘书处 · 一户一票实名备案存证统计报告', PAD, PAGE_H - 44);
  ctx.textAlign = 'right';
  ctx.fillText(`第 ${pageNum} 页 / 共 ${totalPages} 页`, PAGE_W - PAD, PAGE_H - 44);
  ctx.textAlign = 'left';
}

function renderReportPages(stats: SurveyStats): HTMLCanvasElement[] {
  const filterTitle =
    stats.filterGroup === 'none'
      ? '无欠费户组'
      : stats.filterGroup === 'exist'
      ? '欠费户组'
      : `全小区总体 (${stats.totalHouseholds}户)`;
  const nowStr = new Date(stats.lastUpdated).toLocaleString('zh-CN', {
    hour12: false,
  });

  // PAGE 1: Header, 4 KPIs, Q01, Plan A (Q02-Q04)
  const [p1, c1] = createPageCanvas();
  let y = PAD;

  // Header Banner
  c1.fillStyle = '#00288e';
  roundRect(c1, PAD, y, CONTENT_W, 168, 24);
  c1.fill();

  c1.fillStyle = '#85f8c4';
  roundRect(c1, PAD + 36, y + 32, 148, 32, 16);
  c1.fill();
  c1.fillStyle = '#002114';
  c1.font = `700 16px ${FONT_FAMILY}`;
  c1.fillText('业委会官方认证', PAD + 52, y + 54);

  c1.fillStyle = '#ffffff';
  c1.font = `700 34px ${FONT_FAMILY}`;
  c1.fillText('利安花园物业处置方案业主调查统计报告', PAD + 36, y + 106);

  c1.fillStyle = '#dbe1ff';
  c1.font = `400 19px ${FONT_FAMILY}`;
  c1.fillText(`统计口径：${filterTitle}  |  生成时间：${nowStr}`, PAD + 36, y + 142);

  y += 196;

  // 4 KPI Cards
  const leadingOption =
    stats.submittedCount === 0
      ? { rate: '0%', label: '暂无表决数据' }
      : stats.q1.planB.count >= stats.q1.planA.count &&
        stats.q1.planB.count >= stats.q1.planC.count
      ? { rate: `${stats.q1.planB.rate}%`, label: '方案B：更换新物业' }
      : stats.q1.planA.count >= stats.q1.planC.count
      ? { rate: `${stats.q1.planA.rate}%`, label: '方案A：续聘整改' }
      : { rate: `${stats.q1.planC.rate}%`, label: '暂不表态 / 观望' };

  const kpiW = (CONTENT_W - 24 * 3) / 4;
  const kpis = [
    {
      label: '问卷回收户数',
      val: `${stats.submittedCount}`,
      sub: `/ ${stats.totalHouseholds} 户 · 一户一票`,
      color: '#00288e',
    },
    {
      label: '投票覆盖率',
      val: `${stats.coverageRate}%`,
      sub: stats.quorumMet ? '已过法定2/3门槛 (66.7%)' : '法定门槛为 66.7%',
      color: '#006c4a',
    },
    {
      label: '主流意向归向',
      val: leadingOption.rate,
      sub: leadingOption.label,
      color: '#0042b2',
    },
    {
      label: '数据核验有效率',
      val: `${stats.validRate}%`,
      sub: stats.submittedCount > 0 ? '0作废 · 房产确权匹配' : '等待首份有效答卷',
      color: '#0b1c30',
    },
  ];
  kpis.forEach((k, i) => {
    const kx = PAD + i * (kpiW + 24);
    c1.fillStyle = '#ffffff';
    roundRect(c1, kx, y, kpiW, 140, 18);
    c1.fill();
    c1.strokeStyle = '#dce9ff';
    c1.lineWidth = 2;
    c1.stroke();

    c1.fillStyle = '#444653';
    c1.font = `600 18px ${FONT_FAMILY}`;
    c1.fillText(k.label, kx + 22, y + 38);

    c1.fillStyle = k.color;
    c1.font = `700 38px ${FONT_FAMILY}`;
    c1.fillText(k.val, kx + 22, y + 88);

    c1.fillStyle = '#444653';
    c1.font = `400 15px ${FONT_FAMILY}`;
    c1.fillText(k.sub, kx + 22, y + 118);
  });

  y += 168;

  // Q01 Card
  c1.fillStyle = '#ffffff';
  roundRect(c1, PAD, y, CONTENT_W, 380, 22);
  c1.fill();
  c1.strokeStyle = '#dce9ff';
  c1.stroke();

  c1.fillStyle = '#00288e';
  roundRect(c1, PAD + 28, y + 26, 60, 30, 8);
  c1.fill();
  c1.fillStyle = '#ffffff';
  c1.font = `700 17px ${FONT_FAMILY}`;
  c1.fillText('Q01', PAD + 41, y + 47);

  c1.fillStyle = '#0b1c30';
  c1.font = `700 24px ${FONT_FAMILY}`;
  c1.fillText('整体处置方案核心意向分布', PAD + 102, y + 49);

  c1.fillStyle = '#444653';
  c1.font = `600 18px ${FONT_FAMILY}`;
  c1.textAlign = 'right';
  c1.fillText(`共 ${stats.q1.total} 票`, PAD + CONTENT_W - 28, y + 49);
  c1.textAlign = 'left';

  // Stacked Q01 Bar
  const barX = PAD + 28;
  const barY = y + 78;
  const barW = CONTENT_W - 56;
  const wB = (barW * stats.q1.planB.rate) / 100;
  const wA = (barW * stats.q1.planA.rate) / 100;
  const wC = Math.max(0, barW - wB - wA);

  c1.save();
  roundRect(c1, barX, barY, barW, 24, 12);
  c1.clip();
  c1.fillStyle = '#00288e';
  c1.fillRect(barX, barY, wB, 24);
  c1.fillStyle = '#b4c5ff';
  c1.fillRect(barX + wB, barY, wA, 24);
  c1.fillStyle = '#c4c5d5';
  c1.fillRect(barX + wB + wA, barY, wC, 24);
  c1.restore();

  const q1Rows = [
    {
      badge: 'B',
      title: '方案B：更换新的物业公司（重新公开招投标优质服务）',
      count: `${stats.q1.planB.count} 票`,
      rate: `${stats.q1.planB.rate}%`,
      bg: '#eff4ff',
      badgeBg: '#00288e',
      badgeFg: '#ffffff',
      rateColor: '#006c4a',
    },
    {
      badge: 'A',
      title: '方案A：继续聘用现有物业公司（限期1个月整改后评估）',
      count: `${stats.q1.planA.count} 票`,
      rate: `${stats.q1.planA.rate}%`,
      bg: '#f8f9ff',
      badgeBg: '#dce9ff',
      badgeFg: '#0b1c30',
      rateColor: '#444653',
    },
    {
      badge: 'C',
      title: '暂不表态 / 需更多信息（视后续宣讲会方案决定）',
      count: `${stats.q1.planC.count} 票`,
      rate: `${stats.q1.planC.rate}%`,
      bg: '#f8f9ff',
      badgeBg: '#e5eeff',
      badgeFg: '#444653',
      rateColor: '#444653',
    },
  ];
  q1Rows.forEach((r, idx) => {
    const ry = y + 122 + idx * 78;
    c1.fillStyle = r.bg;
    roundRect(c1, PAD + 28, ry, CONTENT_W - 56, 66, 14);
    c1.fill();

    c1.fillStyle = r.badgeBg;
    roundRect(c1, PAD + 44, ry + 13, 40, 40, 10);
    c1.fill();
    c1.fillStyle = r.badgeFg;
    c1.font = `700 20px ${FONT_FAMILY}`;
    c1.fillText(r.badge, PAD + 57, ry + 40);

    c1.fillStyle = '#0b1c30';
    c1.font = `600 20px ${FONT_FAMILY}`;
    c1.fillText(r.title, PAD + 100, ry + 41);

    c1.textAlign = 'right';
    c1.fillStyle = '#00288e';
    c1.font = `700 22px ${FONT_FAMILY}`;
    c1.fillText(r.count, PAD + CONTENT_W - 44, ry + 32);
    c1.fillStyle = r.rateColor;
    c1.font = `600 17px ${FONT_FAMILY}`;
    c1.fillText(r.rate, PAD + CONTENT_W - 44, ry + 54);
    c1.textAlign = 'left';
  });

  y += 408;

  // Plan A Section Card
  c1.fillStyle = '#ffffff';
  roundRect(c1, PAD, y, CONTENT_W, 650, 22);
  c1.fill();
  c1.strokeStyle = '#dce9ff';
  c1.stroke();

  c1.fillStyle = '#0b1c30';
  c1.font = `700 24px ${FONT_FAMILY}`;
  c1.fillText(`方案A定向细则研判（${stats.planA.sampleCount}人样本 · 第2~5题）`, PAD + 28, y + 48);

  // Q02 & Q03
  const drawMiniAgree = (title: string, agreeRate: number, agreeCount: number, disagreeCount: number, ry: number) => {
    c1.fillStyle = '#0b1c30';
    c1.font = `600 20px ${FONT_FAMILY}`;
    c1.fillText(title, PAD + 28, ry);
    c1.textAlign = 'right';
    c1.fillStyle = '#006c4a';
    c1.font = `700 20px ${FONT_FAMILY}`;
    c1.fillText(`${agreeRate}% 同意`, PAD + CONTENT_W - 28, ry);
    c1.textAlign = 'left';

    drawBar(c1, PAD + 28, ry + 14, CONTENT_W - 56, 14, agreeRate, '#006c4a');
    c1.fillStyle = '#444653';
    c1.font = `400 16px ${FONT_FAMILY}`;
    c1.fillText(`同意 ${agreeCount}人 · 不同意 ${disagreeCount}人`, PAD + 28, ry + 48);
  };

  drawMiniAgree(
    'Q02. 给予现物业1个月整改期且满意度须达90%',
    stats.planA.q2.agree.rate,
    stats.planA.q2.agree.count,
    stats.planA.q2.disagree.count,
    y + 98
  );
  drawMiniAgree(
    'Q03. 满意度达标后欠费业主在1个月内补齐欠费',
    stats.planA.q3.agree.rate,
    stats.planA.q3.agree.count,
    stats.planA.q3.disagree.count,
    y + 186
  );

  c1.fillStyle = '#0b1c30';
  c1.font = `700 20px ${FONT_FAMILY}`;
  c1.fillText('Q04. 优先整改服务迫切度排行 (Top 5)', PAD + 28, y + 290);

  if (stats.planA.q4Top5.length === 0) {
    c1.fillStyle = '#757684';
    c1.font = `400 18px ${FONT_FAMILY}`;
    c1.fillText('暂无选择方案A的整改项目统计数据', PAD + 28, y + 340);
  } else {
    stats.planA.q4Top5.forEach((item, idx) => {
      const iy = y + 332 + idx * 58;
      c1.fillStyle = '#0b1c30';
      c1.font = `600 18px ${FONT_FAMILY}`;
      c1.fillText(`${idx + 1}. ${item.label}`, PAD + 28, iy);
      c1.textAlign = 'right';
      c1.fillStyle = idx === 0 ? '#ba1a1a' : '#00288e';
      c1.font = `700 18px ${FONT_FAMILY}`;
      c1.fillText(`${item.rate}% (${item.count}人)`, PAD + CONTENT_W - 28, iy);
      c1.textAlign = 'left';
      drawBar(
        c1,
        PAD + 28,
        iy + 12,
        CONTENT_W - 56,
        14,
        item.rate,
        idx === 0 ? '#ba1a1a' : idx === 1 ? '#1e40af' : '#3755c3'
      );
    });
  }

  drawPageFooter(c1, 1, 2);

  // PAGE 2: Plan B (Q06-Q10), Q11 Cross-tab, Q12 Feedback & Committee Conclusion
  const [p2, c2] = createPageCanvas();
  let y2 = PAD;

  c2.fillStyle = '#ffffff';
  roundRect(c2, PAD, y2, CONTENT_W, 590, 22);
  c2.fill();
  c2.strokeStyle = '#dce9ff';
  c2.lineWidth = 2;
  c2.stroke();

  c2.fillStyle = '#0b1c30';
  c2.font = `700 24px ${FONT_FAMILY}`;
  c2.fillText(`方案B新选聘机制意向分析（${stats.planB.sampleCount}人样本 · 第6~10题）`, PAD + 28, y2 + 48);

  // Q06 & Q08
  c2.fillStyle = '#0b1c30';
  c2.font = `600 20px ${FONT_FAMILY}`;
  c2.fillText('Q06. 按收支平衡预算匹配新物业', PAD + 28, y2 + 98);
  c2.textAlign = 'right';
  c2.fillStyle = '#006c4a';
  c2.font = `700 22px ${FONT_FAMILY}`;
  c2.fillText(`${stats.planB.q6.agree.rate}% (${stats.planB.q6.agree.count}人)`, PAD + CONTENT_W - 28, y2 + 98);
  c2.textAlign = 'left';
  drawBar(c2, PAD + 28, y2 + 114, CONTENT_W - 56, 14, stats.planB.q6.agree.rate, '#006c4a');

  c2.fillStyle = '#0b1c30';
  c2.font = `600 20px ${FONT_FAMILY}`;
  c2.fillText('Q08. 引入公共广告经营性收益补贴物业开支', PAD + 28, y2 + 174);
  c2.textAlign = 'right';
  c2.fillStyle = '#00288e';
  c2.font = `700 22px ${FONT_FAMILY}`;
  c2.fillText(`${stats.planB.q8.agree.rate}% (${stats.planB.q8.agree.count}人)`, PAD + CONTENT_W - 28, y2 + 174);
  c2.textAlign = 'left';
  drawBar(c2, PAD + 28, y2 + 190, CONTENT_W - 56, 14, stats.planB.q8.agree.rate, '#00288e');

  // Q07
  c2.fillStyle = '#0b1c30';
  c2.font = `700 20px ${FONT_FAMILY}`;
  c2.fillText('Q07. 若现有费用不足以聘优质物业，调价接受度分布', PAD + 28, y2 + 256);

  const q7Items = [
    {
      label: '暂不确定，看上调幅度与具体服务明细',
      val: stats.planB.q7.uncertain,
      color: '#00288e',
    },
    {
      label: '可以接受适当上调（参考周边品质盘标准）',
      val: stats.planB.q7.accept,
      color: '#006c4a',
    },
    {
      label: '严格不接受上调，按现有费用水平选聘',
      val: stats.planB.q7.reject,
      color: '#757684',
    },
  ];
  q7Items.forEach((it, idx) => {
    const iy = y2 + 298 + idx * 54;
    c2.fillStyle = '#0b1c30';
    c2.font = `500 18px ${FONT_FAMILY}`;
    c2.fillText(it.label, PAD + 28, iy);
    c2.textAlign = 'right';
    c2.fillStyle = it.color;
    c2.font = `700 18px ${FONT_FAMILY}`;
    c2.fillText(`${it.val.rate}% (${it.val.count}人)`, PAD + CONTENT_W - 28, iy);
    c2.textAlign = 'left';
    drawBar(c2, PAD + 28, iy + 10, CONTENT_W - 56, 12, it.val.rate, it.color);
  });

  // Q09 3-col cards
  c2.fillStyle = '#0b1c30';
  c2.font = `700 20px ${FONT_FAMILY}`;
  c2.fillText('Q09. 新物业公司选聘核心考核权重要素', PAD + 28, y2 + 482);

  const q9Cards = [
    { label: '电梯及设施安全', rate: `${stats.planB.q9Weights.elevatorFacilityRate}%`, color: '#00288e' },
    { label: '安保与门禁管理', rate: `${stats.planB.q9Weights.securityAccessRate}%`, color: '#006c4a' },
    { label: '保洁与绿化养护', rate: `${stats.planB.q9Weights.cleaningGreeningRate}%`, color: '#002e81' },
  ];
  const q9W = (CONTENT_W - 56 - 32) / 3;
  q9Cards.forEach((card, idx) => {
    const cx = PAD + 28 + idx * (q9W + 16);
    c2.fillStyle = '#eff4ff';
    roundRect(c2, cx, y2 + 498, q9W, 74, 14);
    c2.fill();
    c2.fillStyle = '#444653';
    c2.font = `500 16px ${FONT_FAMILY}`;
    c2.fillText(card.label, cx + 18, y2 + 528);
    c2.fillStyle = card.color;
    c2.font = `700 26px ${FONT_FAMILY}`;
    c2.fillText(card.rate, cx + 18, y2 + 558);
  });

  y2 += 620;

  // Q11 Cross-tab Card
  c2.fillStyle = '#ffffff';
  roundRect(c2, PAD, y2, CONTENT_W, 330, 22);
  c2.fill();
  c2.strokeStyle = '#dce9ff';
  c2.stroke();

  c2.fillStyle = '#0b1c30';
  c2.font = `700 24px ${FONT_FAMILY}`;
  c2.fillText('Q11. 现行物业费缴纳情况与换聘意向交叉分析', PAD + 28, y2 + 48);

  const halfW = (CONTENT_W - 56 - 24) / 2;
  c2.fillStyle = '#eff4ff';
  roundRect(c2, PAD + 28, y2 + 74, halfW, 132, 16);
  c2.fill();
  c2.fillStyle = '#006c4a';
  c2.font = `700 18px ${FONT_FAMILY}`;
  c2.fillText(`无欠费户 (${stats.general.noArrearsRate}%)`, PAD + 48, y2 + 108);
  c2.fillStyle = '#0b1c30';
  c2.font = `700 34px ${FONT_FAMILY}`;
  c2.fillText(`${stats.general.noArrearsCount} 户`, PAD + 48, y2 + 154);
  c2.fillStyle = '#444653';
  c2.font = `500 17px ${FONT_FAMILY}`;
  c2.fillText(`其中支持更换物业比例：${stats.general.noArrearsPlanBRate}%`, PAD + 48, y2 + 186);

  c2.fillStyle = '#ffdad6';
  roundRect(c2, PAD + 28 + halfW + 24, y2 + 74, halfW, 132, 16);
  c2.fill();
  c2.fillStyle = '#ba1a1a';
  c2.font = `700 18px ${FONT_FAMILY}`;
  c2.fillText(`有欠费户 (${stats.general.arrearsRate}%)`, PAD + 48 + halfW + 24, y2 + 108);
  c2.font = `700 34px ${FONT_FAMILY}`;
  c2.fillText(`${stats.general.arrearsCount} 户`, PAD + 48 + halfW + 24, y2 + 154);
  c2.font = `500 17px ${FONT_FAMILY}`;
  c2.fillText(`其中支持更换物业比例：${stats.general.arrearsPlanBRate}%`, PAD + 48 + halfW + 24, y2 + 186);

  c2.fillStyle = '#e5eeff';
  roundRect(c2, PAD + 28, y2 + 224, CONTENT_W - 56, 82, 14);
  c2.fill();
  c2.fillStyle = '#0b1c30';
  c2.font = `500 17px ${FONT_FAMILY}`;
  const totalAllSamples = stats.general.noArrearsCount + stats.general.arrearsCount;
  const crossInsight =
    totalAllSamples > 0
      ? `交叉洞察：无欠费户支持更换新物业占比 ${stats.general.noArrearsPlanBRate}%，有欠费户支持更换新物业占比 ${stats.general.arrearsPlanBRate}%，系统已基于全部真实有效样本完成实时交叉测算。`
      : '交叉洞察：当前暂无样本数据，收到业主提交后将自动对比无欠费户与欠费户的换聘意愿。';
  drawTextWrapped(c2, crossInsight, PAD + 46, y2 + 256, CONTENT_W - 92, 26);

  y2 += 360;

  // Q12 & Committee Conclusion Card
  c2.fillStyle = '#ffffff';
  roundRect(c2, PAD, y2, CONTENT_W, 560, 22);
  c2.fill();
  c2.strokeStyle = '#dce9ff';
  c2.stroke();

  c2.fillStyle = '#0b1c30';
  c2.font = `700 24px ${FONT_FAMILY}`;
  c2.fillText('Q12. 代表性业主建言与业委会下一步工作结论', PAD + 28, y2 + 48);

  const sampleVoices = stats.general.feedbacks.slice(0, 2);
  if (sampleVoices.length === 0) {
    c2.fillStyle = '#eff4ff';
    roundRect(c2, PAD + 28, y2 + 76, CONTENT_W - 56, 114, 14);
    c2.fill();
    c2.fillStyle = '#757684';
    c2.font = `400 18px ${FONT_FAMILY}`;
    c2.fillText('暂无业主第12题文字建言，提交后将自动汇总展示于此。', PAD + 46, y2 + 138);
  } else {
    sampleVoices.forEach((fb, idx) => {
      const fy = y2 + 76 + idx * 130;
      c2.fillStyle = '#eff4ff';
      roundRect(c2, PAD + 28, fy, CONTENT_W - 56, 114, 14);
      c2.fill();
      c2.fillStyle = '#00288e';
      c2.font = `700 17px ${FONT_FAMILY}`;
      c2.fillText(`${fb.author} · ${fb.tag}`, PAD + 46, fy + 32);
      c2.fillStyle = '#0b1c30';
      c2.font = `400 17px ${FONT_FAMILY}`;
      drawTextWrapped(c2, fb.text, PAD + 46, fy + 62, CONTENT_W - 92, 24);
    });
  }

  // Committee Blue Box
  const recY = y2 + 356;
  c2.fillStyle = '#00288e';
  roundRect(c2, PAD + 28, recY, CONTENT_W - 56, 174, 18);
  c2.fill();
  c2.fillStyle = '#ffffff';
  c2.font = `700 22px ${FONT_FAMILY}`;
  c2.fillText('业委会下步依法推进建议', PAD + 52, recY + 44);
  c2.fillStyle = '#dbe1ff';
  c2.font = `400 19px ${FONT_FAMILY}`;
  const recText =
    stats.submittedCount === 0
      ? '问卷已正式开启一户一票实时征集，待回收达到法定比例后，系统将根据真实统计结果生成业委会下一步依法推进建议并公示。'
      : `当前已回收有效答卷 ${stats.submittedCount} 份（全区覆盖率 ${stats.coverageRate}%），主流意向为「${leadingOption.label}」（占比 ${leadingOption.rate}）。业委会将依据《民法典》第278条及真实汇总民意推进下一步表决公示。`;
  drawTextWrapped(c2, recText, PAD + 52, recY + 84, CONTENT_W - 104, 29);

  drawPageFooter(c2, 2, 2);

  return [p1, p2];
}

function buildPdfFromCanvases(canvases: HTMLCanvasElement[]): Blob {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let offset = 0;

  const pushStr = (s: string) => {
    const bytes = encoder.encode(s);
    chunks.push(bytes);
    offset += bytes.length;
  };
  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    offset += bytes.length;
  };

  const pageImages = canvases.map((canvas) => {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const base64 = dataUrl.split(',')[1];
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return { bytes, width: canvas.width, height: canvas.height };
  });

  // PDF Header (595.28 x 841.89 pt A4)
  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  const offsets: number[] = [0]; // obj 0 unused

  // Object 1: Catalog
  offsets[1] = offset;
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Object 2: Pages
  const pageObjIds = pageImages.map((_, idx) => 3 + idx * 3);
  offsets[2] = offset;
  pushStr(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageImages.length} >>\nendobj\n`
  );

  pageImages.forEach((img, idx) => {
    const pageId = 3 + idx * 3;
    const contentId = pageId + 1;
    const imgId = pageId + 2;
    const pdfW = 595.28;
    const pdfH = 841.89;

    // Page object
    offsets[pageId] = offset;
    pushStr(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfW} ${pdfH}] /Resources << /XObject << /Im0 ${imgId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`
    );

    // Content stream drawing image full-page
    const streamStr = `q\n${pdfW} 0 0 ${pdfH} 0 0 cm\n/Im0 Do\nQ\n`;
    offsets[contentId] = offset;
    pushStr(
      `${contentId} 0 obj\n<< /Length ${streamStr.length} >>\nstream\n${streamStr}endstream\nendobj\n`
    );

    // Image XObject
    offsets[imgId] = offset;
    pushStr(
      `${imgId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.bytes.length} >>\nstream\n`
    );
    pushBytes(img.bytes);
    pushStr('\nendstream\nendobj\n');
  });

  const xrefOffset = offset;
  const totalObjs = offsets.length;
  pushStr(`xref\n0 ${totalObjs}\n`);
  pushStr('0000000000 65535 f \n');
  for (let i = 1; i < totalObjs; i++) {
    const offStr = String(offsets[i]).padStart(10, '0');
    pushStr(`${offStr} 00000 n \n`);
  }
  pushStr(`trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const blobParts: BlobPart[] = chunks.map((chunk) => new Uint8Array(chunk));
  return new Blob(blobParts, { type: 'application/pdf' });
}

export async function exportStatsPdf(stats: SurveyStats): Promise<void> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore font loading timeout
    }
  }
  const canvases = renderReportPages(stats);
  const blob = buildPdfFromCanvases(canvases);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateTag = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `利安花园业主表决统计报告_${dateTag}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
