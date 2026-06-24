// Shared Campaign type — used by components and tests
export interface Campaign {
  id: number;
  title: string;
  creator: string;
  goal: number;
  raised: number;
  deadline: string;
  claimed: boolean;
}
