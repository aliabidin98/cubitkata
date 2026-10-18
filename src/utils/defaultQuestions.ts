import { Question } from '../types/game';

export const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 1,
    q: 'Monumen Nasional (Monas) terletak di kota...',
    options: [
      { text: 'Jakarta', isCorrect: true },
      { text: 'Surabaya', isCorrect: false }
    ]
  },
  {
    id: 2,
    q: 'Planet terbesar di Tata Surya adalah...',
    options: [
      { text: 'Yupiter', isCorrect: true },
      { text: 'Mars', isCorrect: false }
    ]
  },
  {
    id: 3,
    q: 'Candi Borobudur merupakan peninggalan bersejarah agama...',
    options: [
      { text: 'Buddha', isCorrect: true },
      { text: 'Hindu', isCorrect: false }
    ]
  },
  {
    id: 4,
    q: 'Samudra terluas di bumi adalah Samudra...',
    options: [
      { text: 'Pasifik', isCorrect: true },
      { text: 'Atlantik', isCorrect: false }
    ]
  },
  {
    id: 5,
    q: 'Alat musik tradisional Angklung berasal dari provinsi...',
    options: [
      { text: 'Jawa Barat', isCorrect: true },
      { text: 'Jawa Tengah', isCorrect: false }
    ]
  }
];

export const STORAGE_KEY = 'cubit_kata_questions_v4';

export function loadSavedQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse saved questions', e);
  }
  return DEFAULT_QUESTIONS;
}

export function saveStoredQuestions(questions: Question[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
  } catch (e) {
    console.error('Failed to save questions', e);
  }
}
