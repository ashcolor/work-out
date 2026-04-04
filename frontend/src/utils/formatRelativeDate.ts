const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function formatRelativeDate(value: string) {
  const target = parseDate(value);
  if (!target) return value;

  const today = startOfDay(new Date());
  const date = startOfDay(target);
  const diffDays = Math.round((date.getTime() - today.getTime()) / MS_PER_DAY);
  const absDays = Math.abs(diffDays);

  if (diffDays === 0) return "今日";
  if (diffDays === -1) return "昨日";
  if (diffDays === -2) return "一昨日";
  if (diffDays === 1) return "明日";
  if (diffDays === 2) return "明後日";

  if (absDays < 7) {
    return diffDays < 0 ? `${absDays}日前` : `${absDays}日後`;
  }

  if (absDays < 30) {
    const weeks = Math.floor(absDays / 7);
    return diffDays < 0 ? `${weeks}週間前` : `${weeks}週間後`;
  }

  if (absDays < 365) {
    const months = Math.floor(absDays / 30);
    return diffDays < 0 ? `${months}か月前` : `${months}か月後`;
  }

  const years = Math.floor(absDays / 365);
  return diffDays < 0 ? `${years}年前` : `${years}年後`;
}
