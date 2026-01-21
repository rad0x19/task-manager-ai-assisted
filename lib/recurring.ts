export interface RecurringRule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  endDate?: Date;
  skipWeekends?: boolean;
  skipCompleted?: boolean;
  exceptions?: Date[];
}

export function calculateNextOccurrence(
  rule: RecurringRule,
  lastOccurrence: Date
): Date | null {
  const { frequency, interval, endDate, skipWeekends, exceptions } = rule;

  let nextDate = new Date(lastOccurrence);

  switch (frequency) {
    case 'DAILY':
      nextDate.setDate(nextDate.getDate() + interval);
      break;
    case 'WEEKLY':
      nextDate.setDate(nextDate.getDate() + 7 * interval);
      break;
    case 'MONTHLY':
      nextDate.setMonth(nextDate.getMonth() + interval);
      break;
    case 'YEARLY':
      nextDate.setFullYear(nextDate.getFullYear() + interval);
      break;
  }

  // Skip weekends if enabled
  if (skipWeekends) {
    while (isWeekend(nextDate)) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
  }

  // Check exceptions
  if (exceptions) {
    while (exceptions.some((ex) => isSameDay(ex, nextDate))) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
  }

  // Check end date
  if (endDate && nextDate > endDate) {
    return null;
  }

  return nextDate;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function shouldSkipOccurrence(
  rule: RecurringRule,
  occurrenceDate: Date,
  isCompleted: boolean
): boolean {
  if (rule.skipCompleted && isCompleted) {
    return true;
  }

  if (rule.exceptions) {
    return rule.exceptions.some((ex) => isSameDay(ex, occurrenceDate));
  }

  return false;
}
