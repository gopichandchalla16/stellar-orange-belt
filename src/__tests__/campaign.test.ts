/**
 * Campaign contract logic tests
 * Mirrors on-chain Soroban validation rules
 */

interface Campaign {
  id: number;
  title: string;
  goal: number;
  raised: number;
  deadline: number;
  creator: string;
  claimed: boolean;
}

function validateCampaign(title: string, goal: number, deadlineDays: number): string | null {
  if (!title || title.trim().length === 0) return 'Title cannot be empty';
  if (title.length > 64) return 'Title too long (max 64 chars)';
  if (goal <= 0) return 'Goal must be greater than zero';
  if (goal < 1) return 'Minimum goal is 1 XLM';
  if (deadlineDays < 1) return 'Deadline must be at least 1 day from now';
  if (deadlineDays > 365) return 'Deadline cannot exceed 365 days';
  return null;
}

function calculateProgress(raised: number, goal: number): number {
  if (goal === 0) return 0;
  const pct = (raised / goal) * 100;
  return Math.min(Math.round(pct * 100) / 100, 100);
}

function canClaim(campaign: Campaign, now: number): boolean {
  return campaign.raised >= campaign.goal && !campaign.claimed;
}

function canRefund(campaign: Campaign, now: number): boolean {
  return now > campaign.deadline && campaign.raised < campaign.goal && !campaign.claimed;
}

describe('Campaign Contract Logic', () => {
  test('validates campaign title is not empty', () => {
    expect(validateCampaign('', 100, 30)).toBe('Title cannot be empty');
    expect(validateCampaign('   ', 100, 30)).toBe('Title cannot be empty');
  });

  test('validates goal is greater than zero', () => {
    expect(validateCampaign('Test Campaign', 0, 30)).toBe('Goal must be greater than zero');
    expect(validateCampaign('Test Campaign', -50, 30)).toBe('Goal must be greater than zero');
  });

  test('calculates progress percentage correctly', () => {
    expect(calculateProgress(50, 100)).toBe(50);
    expect(calculateProgress(100, 100)).toBe(100);
    expect(calculateProgress(0, 100)).toBe(0);
    expect(calculateProgress(150, 100)).toBe(100); // capped at 100
  });

  test('validates title max length', () => {
    const longTitle = 'A'.repeat(65);
    expect(validateCampaign(longTitle, 100, 30)).toBe('Title too long (max 64 chars)');
  });

  test('validates deadline range', () => {
    expect(validateCampaign('Title', 100, 0)).toBe('Deadline must be at least 1 day from now');
    expect(validateCampaign('Title', 100, 400)).toBe('Deadline cannot exceed 365 days');
    expect(validateCampaign('Title', 100, 30)).toBeNull();
  });

  test('canClaim returns true when goal met and not yet claimed', () => {
    const campaign: Campaign = { id: 1, title: 'Test', goal: 100, raised: 100, deadline: Date.now() + 86400000, creator: 'GXXX', claimed: false };
    expect(canClaim(campaign, Date.now())).toBe(true);
  });

  test('canRefund returns true when deadline passed and goal not met', () => {
    const campaign: Campaign = { id: 1, title: 'Test', goal: 100, raised: 50, deadline: Date.now() - 1000, creator: 'GXXX', claimed: false };
    expect(canRefund(campaign, Date.now())).toBe(true);
  });
});
