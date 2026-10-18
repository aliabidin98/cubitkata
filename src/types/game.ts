export type GameMode = 'solo' | 'battle';
export type InputMode = 'camera' | 'mouse';

export interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: number;
  q: string;
  category?: string;
  options: [QuestionOption, QuestionOption];
}

export interface CardState {
  id: string;
  text: string;
  isCorrect: boolean;
  x: number;
  y: number;
  initX: number;
  initY: number;
  width: number;
  height: number;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

export interface DropTarget {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface PlayerState {
  cards: CardState[];
  heldCard: CardState | null;
  holdingHandId: number | null;
  dropTarget: DropTarget | null;
  dropGraceFrames: number;
  isHoveringTarget: boolean;
}

export interface DetectedHand {
  id: number;
  x: number;
  y: number;
  pinchRatio: number;
  handScale: number;
  isPinching: boolean;
}
