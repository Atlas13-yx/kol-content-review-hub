import { KolPastWork, KolHistoricalMetrics } from '../types';

/**
 * 将形如 '120万', '1.2M', '450,000', '32k', '850000' 的文本解析为纯数字
 */
export function parseMetricNumber(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  const raw = String(val).trim().toLowerCase();
  if (!raw) return 0;

  // 1.2M or 1.2m
  if (raw.endsWith('m')) {
    const num = parseFloat(raw.replace('m', ''));
    return isNaN(num) ? 0 : Math.round(num * 1000000);
  }
  // 120万 or 120w
  if (raw.endsWith('万') || raw.endsWith('w')) {
    const num = parseFloat(raw.replace(/[万w]/g, ''));
    return isNaN(num) ? 0 : Math.round(num * 10000);
  }
  // 32k
  if (raw.endsWith('k')) {
    const num = parseFloat(raw.replace('k', ''));
    return isNaN(num) ? 0 : Math.round(num * 1000);
  }
  // 带有千分位逗号或空格或百分号
  const clean = raw.replace(/[,%\s]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * 格式化数字为可读友好的展示文本 (如: 125.0万, 3.2万, 8,500)
 */
export function formatMetricNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num) || num === 0) return '0';
  if (num >= 1000000) {
    return `${(num / 10000).toFixed(1)}万`;
  }
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`;
  }
  return num.toLocaleString();
}

/**
 * 基于达人一条条录入的过往作品，自动计算过往汇总表现数据
 */
export function computeMetricsFromPastWorks(
  pastWorks: KolPastWork[] = [],
  existingMetrics?: KolHistoricalMetrics
): KolHistoricalMetrics {
  const validWorks = pastWorks.filter((w) => w.title?.trim() || w.url?.trim() || w.views);

  if (validWorks.length === 0) {
    return {
      avgViews: existingMetrics?.avgViews,
      highestViews: existingMetrics?.highestViews,
      avgLikes: existingMetrics?.avgLikes,
      avgComments: existingMetrics?.avgComments,
      avgEngagementRate: existingMetrics?.avgEngagementRate,
      avgCpm: existingMetrics?.avgCpm,
      cooperationRating: existingMetrics?.cooperationRating || 5.0,
      cooperatedBrandCount: existingMetrics?.cooperatedBrandCount,
      historicalCooperationNotes: existingMetrics?.historicalCooperationNotes,
    };
  }

  let totalViews = 0;
  let viewsCount = 0;
  let highestViews = 0;
  let totalLikes = 0;
  let likesCount = 0;
  let totalComments = 0;
  let commentsCount = 0;

  validWorks.forEach((w) => {
    const viewsNum = parseMetricNumber(w.views);
    if (viewsNum > 0) {
      totalViews += viewsNum;
      viewsCount++;
      if (viewsNum > highestViews) {
        highestViews = viewsNum;
      }
    }

    const likesNum = parseMetricNumber(w.likes);
    if (likesNum > 0) {
      totalLikes += likesNum;
      likesCount++;
    }

    const commentsNum = parseMetricNumber(w.comments);
    if (commentsNum > 0) {
      totalComments += commentsNum;
      commentsCount++;
    }
  });

  const avgViews = viewsCount > 0 ? Math.round(totalViews / viewsCount) : undefined;
  const avgLikes = likesCount > 0 ? Math.round(totalLikes / likesCount) : undefined;
  const avgComments = commentsCount > 0 ? Math.round(totalComments / commentsCount) : undefined;

  let avgEngagementRate: number | undefined = undefined;
  if (avgViews && avgViews > 0 && (avgLikes || avgComments)) {
    const totalInteractions = (avgLikes || 0) + (avgComments || 0);
    avgEngagementRate = parseFloat(((totalInteractions / avgViews) * 100).toFixed(2));
  }

  return {
    ...existingMetrics,
    avgViews,
    highestViews: highestViews > 0 ? highestViews : undefined,
    avgLikes,
    avgComments,
    avgEngagementRate,
    cooperationRating: existingMetrics?.cooperationRating || 5.0,
    cooperatedBrandCount: existingMetrics?.cooperatedBrandCount || validWorks.length,
    historicalCooperationNotes: existingMetrics?.historicalCooperationNotes,
  };
}
