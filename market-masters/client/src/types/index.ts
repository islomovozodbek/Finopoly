export interface InvestmentCard {
  name: string;
  type: 'Good' | 'Bad';
  percentage: number;
  reason: string;
  description: string;
}

export interface Team {
  id: string;
  name: string;
  room: string;
  cash: number;
  lapTurnsTaken: number;
  position: number;
  eraStartingCash: number;
  nextMultiplier?: number;
  hedgeFund?: number;
  insiderInfo?: number;
  blindFaith?: number;
  bigShort?: number;
  monopolyPower?: number;
  frozen?: number;
  sabotaged?: number;
  immune?: number;
}

export interface Room {
  deck: InvestmentCard[];
  turnIndex: number;
  lapTeamsFinished: number;
  eraStatus: 'ACTIVE' | 'INTERMISSION';
  roundEnding: boolean;
}

export interface Transaction {
  id: number;
  teamId: string;
  roomId: string;
  actionType: string;
  amount: number;
  details: string;
  timestamp: string;
}

export interface SpecialCard {
  id: number;
  title: string;
  description: string;
  type: string;
  effect: string;
  value?: number;
}

export interface GameState {
  currentEraId: string;
  currentEraName: string;
  teams: Team[];
  rooms: Record<string, Room>;
  transactions: Transaction[];
}
