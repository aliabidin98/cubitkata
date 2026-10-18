import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { GameMode, InputMode, Question, PlayerState, CardState, DetectedHand } from '../types/game';
import { playSound } from '../utils/audio';
import { MousePointer, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

interface GameCanvasProps {
  gameMode: GameMode;
  inputMode: InputMode;
  targetScore: number;
  pointsCorrect: number;
  pointsWrong: number;
  questionBank: Question[];
  pinchSensitivity: number;
  isMirrored: boolean;
  onGoHome: () => void;
  onChangeInputMode: (mode: InputMode) => void;
}

// MediaPipe global declarations
declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameMode,
  inputMode,
  targetScore,
  pointsCorrect = 10,
  pointsWrong = 5,
  questionBank,
  pinchSensitivity,
  isMirrored,
  onGoHome,
  onChangeInputMode
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isLoadingCamera, setIsLoadingCamera] = useState(inputMode === 'camera');
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [currentQP1, setCurrentQP1] = useState<Question | null>(null);
  const [currentQP2, setCurrentQP2] = useState<Question | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState<{ title: string; subtitle: string; icon: string } | null>(null);

  // Synchronized question refs
  const currentQP1Ref = useRef<Question | null>(null);
  const currentQP2Ref = useRef<Question | null>(null);

  // Toast feedback state
  const [toastP1, setToastP1] = useState<{ msg: string; isCorrect: boolean } | null>(null);
  const [toastP2, setToastP2] = useState<{ msg: string; isCorrect: boolean } | null>(null);
  const toastP1Timer = useRef<NodeJS.Timeout | null>(null);
  const toastP2Timer = useRef<NodeJS.Timeout | null>(null);

  // Game internal state refs
  const stateP1Ref = useRef<PlayerState>({
    cards: [],
    heldCard: null,
    holdingHandId: null,
    dropTarget: null,
    dropGraceFrames: 0,
    isHoveringTarget: false
  });

  const stateP2Ref = useRef<PlayerState>({
    cards: [],
    heldCard: null,
    holdingHandId: null,
    dropTarget: null,
    dropGraceFrames: 0,
    isHoveringTarget: false
  });

  const poolP1Ref = useRef<Question[]>([]);
  const poolP2Ref = useRef<Question[]>([]);
  const isGameActiveRef = useRef(true);
  const detectedHandsRef = useRef<DetectedHand[]>([]);
  const prevTrackedHandsRef = useRef<{ id: number; x: number; y: number }[]>([]);
  const smoothHandMapRef = useRef<Map<number, { x: number; y: number; lastSeen: number }>>(new Map());

  const handsInstanceRef = useRef<any>(null);
  const cameraInstanceRef = useRef<any>(null);
  const mousePointerRef = useRef({ x: 0, y: 0, isDown: false, activePNum: 1 });

  // drawFrame ref to avoid stale closure
  const drawFrameRef = useRef<(cameraImage: CanvasImageSource | null) => void>(() => {});

  // Helper round rect drawing
  const drawRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
    } else {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }
  };

  // Toast notification trigger
  const showToast = (pNum: number, isCorrect: boolean) => {
    const msg = isCorrect
      ? (gameMode === 'battle' ? `P${pNum}: Tepat! (+${pointsCorrect})` : `Jawaban Tepat! (+${pointsCorrect})`)
      : (gameMode === 'battle' ? `P${pNum}: Salah! (-${pointsWrong})` : `Jawaban Salah! (-${pointsWrong})`);

    if (pNum === 1) {
      if (toastP1Timer.current) clearTimeout(toastP1Timer.current);
      setToastP1({ msg, isCorrect });
      toastP1Timer.current = setTimeout(() => setToastP1(null), 2000);
    } else {
      if (toastP2Timer.current) clearTimeout(toastP2Timer.current);
      setToastP2({ msg, isCorrect });
      toastP2Timer.current = setTimeout(() => setToastP2(null), 2000);
    }
  };

  // Trigger victory
  const handleVictory = useCallback((p1: number, p2: number) => {
    isGameActiveRef.current = false;
    setIsGameOver(true);
    playSound('victory');

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }

    if (gameMode === 'solo') {
      setWinnerInfo({
        icon: '🏆',
        title: 'Target Skor Tercapai!',
        subtitle: `Skor Kamu: ${p1} Poin (Target: ${targetScore})`
      });
    } else if (p1 > p2) {
      setWinnerInfo({
        icon: '🏆',
        title: 'Pemain 1 Menang!',
        subtitle: `Skor: ${p1} vs ${p2} (Target: ${targetScore})`
      });
    } else if (p2 > p1) {
      setWinnerInfo({
        icon: '👑',
        title: 'Pemain 2 Menang!',
        subtitle: `Skor: ${p2} vs ${p1} (Target: ${targetScore})`
      });
    } else {
      setWinnerInfo({
        icon: '🤝',
        title: 'Hasil Imbang!',
        subtitle: `Skor Seri: ${p1} - ${p2}`
      });
    }
  }, [gameMode, targetScore]);

  // Spawn question
  const spawnQuestion = useCallback((pNum: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let pool = pNum === 1 ? poolP1Ref.current : poolP2Ref.current;
    if (pool.length === 0) {
      pool = [...questionBank];
      if (pNum === 1) poolP1Ref.current = pool;
      else poolP2Ref.current = pool;
    }

    if (pool.length === 0) return;

    const idx = Math.floor(Math.random() * pool.length);
    const q = pool.splice(idx, 1)[0];

    if (gameMode === 'solo') {
      setCurrentQP1(q);
      currentQP1Ref.current = q;

      const state = stateP1Ref.current;
      state.dropTarget = {
        x: canvas.width / 2 - 180,
        y: 65,
        width: 360,
        height: 115,
        label: 'TARUH JAWABAN DI SINI'
      };

      const cardWidth = 240;
      const cardHeight = 72;
      const shuffled = [...q.options].sort(() => Math.random() - 0.5);

      state.cards = [
        {
          id: 'card_0',
          text: shuffled[0].text,
          isCorrect: shuffled[0].isCorrect,
          x: canvas.width / 2 - 265,
          y: 240,
          initX: canvas.width / 2 - 265,
          initY: 240,
          width: cardWidth,
          height: cardHeight,
          bgColor: '#ffffff',
          borderColor: '#0f766e',
          textColor: '#0f766e'
        },
        {
          id: 'card_1',
          text: shuffled[1].text,
          isCorrect: shuffled[1].isCorrect,
          x: canvas.width / 2 + 25,
          y: 240,
          initX: canvas.width / 2 + 25,
          initY: 240,
          width: cardWidth,
          height: cardHeight,
          bgColor: '#ffffff',
          borderColor: '#0f766e',
          textColor: '#0f766e'
        }
      ];
      state.heldCard = null;
      state.holdingHandId = null;
      state.isHoveringTarget = false;
    } else {
      // BATTLE MODE
      if (pNum === 1) {
        setCurrentQP1(q);
        currentQP1Ref.current = q;

        const state = stateP1Ref.current;
        state.dropTarget = {
          x: 75,
          y: 75,
          width: 340,
          height: 105,
          label: 'KOTAK JAWABAN P1'
        };

        const shuffled = [...q.options].sort(() => Math.random() - 0.5);
        state.cards = [
          {
            id: 'p1_card_0',
            text: shuffled[0].text,
            isCorrect: shuffled[0].isCorrect,
            x: 60,
            y: 230,
            initX: 60,
            initY: 230,
            width: 175,
            height: 65,
            bgColor: '#ffffff',
            borderColor: '#0d9488',
            textColor: '#0f766e'
          },
          {
            id: 'p1_card_1',
            text: shuffled[1].text,
            isCorrect: shuffled[1].isCorrect,
            x: 250,
            y: 230,
            initX: 250,
            initY: 230,
            width: 175,
            height: 65,
            bgColor: '#ffffff',
            borderColor: '#0d9488',
            textColor: '#0f766e'
          }
        ];
        state.heldCard = null;
        state.holdingHandId = null;
        state.isHoveringTarget = false;
      } else {
        setCurrentQP2(q);
        currentQP2Ref.current = q;

        const state = stateP2Ref.current;
        state.dropTarget = {
          x: 585,
          y: 75,
          width: 340,
          height: 105,
          label: 'KOTAK JAWABAN P2'
        };

        const shuffled = [...q.options].sort(() => Math.random() - 0.5);
        state.cards = [
          {
            id: 'p2_card_0',
            text: shuffled[0].text,
            isCorrect: shuffled[0].isCorrect,
            x: 570,
            y: 230,
            initX: 570,
            initY: 230,
            width: 175,
            height: 65,
            bgColor: '#ffffff',
            borderColor: '#ea580c',
            textColor: '#c2410c'
          },
          {
            id: 'p2_card_1',
            text: shuffled[1].text,
            isCorrect: shuffled[1].isCorrect,
            x: 760,
            y: 230,
            initX: 760,
            initY: 230,
            width: 175,
            height: 65,
            bgColor: '#ffffff',
            borderColor: '#ea580c',
            textColor: '#c2410c'
          }
        ];
        state.heldCard = null;
        state.holdingHandId = null;
        state.isHoveringTarget = false;
      }
    }
  }, [gameMode, questionBank]);

  // Check Drop Target evaluation
  const checkDropAnswer = useCallback((pState: PlayerState, pNum: number) => {
    const card = pState.heldCard;
    const drop = pState.dropTarget;

    if (!card || !drop) return;

    const cardCenterX = card.x + card.width / 2;
    const cardCenterY = card.y + card.height / 2;

    if (
      cardCenterX >= drop.x &&
      cardCenterX <= drop.x + drop.width &&
      cardCenterY >= drop.y &&
      cardCenterY <= drop.y + drop.height
    ) {
      if (card.isCorrect) {
        playSound('correct');
        showToast(pNum, true);

        if (pNum === 1) {
          setScoreP1(prev => {
            const next = prev + pointsCorrect;
            if (next >= targetScore) {
              handleVictory(next, scoreP2);
            } else {
              spawnQuestion(1);
            }
            return next;
          });
        } else {
          setScoreP2(prev => {
            const next = prev + pointsCorrect;
            if (next >= targetScore) {
              handleVictory(scoreP1, next);
            } else {
              spawnQuestion(2);
            }
            return next;
          });
        }
      } else {
        playSound('wrong');
        showToast(pNum, false);
        if (pNum === 1) {
          setScoreP1(prev => Math.max(0, prev - pointsWrong));
        } else {
          setScoreP2(prev => Math.max(0, prev - pointsWrong));
        }
        spawnQuestion(pNum);
      }
    } else {
      // Snapped back
      card.x = card.initX;
      card.y = card.initY;
    }

    pState.heldCard = null;
    pState.holdingHandId = null;
    pState.isHoveringTarget = false;
  }, [handleVictory, pointsCorrect, pointsWrong, scoreP1, scoreP2, spawnQuestion, targetScore]);

  // Hand Pinch Processing
  const processHandPinch = useCallback((pNum: number, pState: PlayerState, hands: DetectedHand[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let availableHands = hands;
    if (gameMode === 'battle') {
      if (pNum === 1) {
        availableHands = hands.filter(h => h.x <= canvas.width * 0.55);
      } else {
        availableHands = hands.filter(h => h.x >= canvas.width * 0.45);
      }
    }

    // Pinch threshold with hysteresis
    availableHands.forEach(h => {
      const isHoldingThisHand = pState.heldCard && pState.holdingHandId === h.id;
      const threshold = isHoldingThisHand ? pinchSensitivity * 1.35 : pinchSensitivity;
      h.isPinching = h.pinchRatio < threshold;
    });

    if (!pState.heldCard) {
      pState.dropGraceFrames = 0;
      for (const h of availableHands) {
        if (h.isPinching) {
          for (const card of pState.cards) {
            if (
              h.x >= card.x - 20 &&
              h.x <= card.x + card.width + 20 &&
              h.y >= card.y - 20 &&
              h.y <= card.y + card.height + 20
            ) {
              pState.heldCard = card;
              pState.holdingHandId = h.id;
              playSound('grab');
              break;
            }
          }
        }
        if (pState.heldCard) break;
      }
    } else {
      let matchedHand = availableHands.find(h => h.id === pState.holdingHandId);

      if (!matchedHand) {
        let minDist = 220;
        const cardCX = pState.heldCard.x + pState.heldCard.width / 2;
        const cardCY = pState.heldCard.y + pState.heldCard.height / 2;

        for (const h of availableHands) {
          const d = Math.hypot(h.x - cardCX, h.y - cardCY);
          if (d < minDist) {
            minDist = d;
            matchedHand = h;
          }
        }
      }

      if (matchedHand && matchedHand.isPinching) {
        pState.holdingHandId = matchedHand.id;
        pState.dropGraceFrames = 0;

        const targetX = matchedHand.x - pState.heldCard.width / 2;
        const targetY = matchedHand.y - pState.heldCard.height / 2;

        pState.heldCard.x += (targetX - pState.heldCard.x) * 0.75;
        pState.heldCard.y += (targetY - pState.heldCard.y) * 0.75;
      } else {
        pState.dropGraceFrames = (pState.dropGraceFrames || 0) + 1;
        if (pState.dropGraceFrames > 8) {
          checkDropAnswer(pState, pNum);
          pState.holdingHandId = null;
          pState.dropGraceFrames = 0;
        }
      }
    }
  }, [checkDropAnswer, gameMode, pinchSensitivity]);

  // Main Render Frame
  const drawFrame = useCallback((cameraImage: CanvasImageSource | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Background
    if (inputMode === 'camera' && cameraImage) {
      ctx.save();
      if (isMirrored) {
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
      }
      ctx.drawImage(cameraImage, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Simple grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    if (!isGameActiveRef.current) return;

    // 2. Draw Split Screen Divider if Battle Mode
    if (gameMode === 'battle') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Render Drop Targets & Cards for Players
    const renderPlayerAssets = (pState: PlayerState, pNum: number) => {
      const drop = pState.dropTarget;
      if (!drop) return;

      let isHovering = false;
      if (pState.heldCard) {
        const cardCX = pState.heldCard.x + pState.heldCard.width / 2;
        const cardCY = pState.heldCard.y + pState.heldCard.height / 2;
        if (
          cardCX >= drop.x &&
          cardCX <= drop.x + drop.width &&
          cardCY >= drop.y &&
          cardCY <= drop.y + drop.height
        ) {
          isHovering = true;
        }
      }

      if (isHovering && !pState.isHoveringTarget) {
        playSound('hover');
      }
      pState.isHoveringTarget = isHovering;

      // Draw Drop Target
      ctx.save();
      if (isHovering) {
        const primaryColor = pNum === 2 ? '#fb923c' : '#2dd4bf';
        const fillGlow = pNum === 2 ? 'rgba(234, 88, 12, 0.25)' : 'rgba(13, 148, 136, 0.25)';
        ctx.fillStyle = fillGlow;
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 3;
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
      }

      drawRoundRect(ctx, drop.x, drop.y, drop.width, drop.height, 20);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 14px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = isHovering ? 'LEPAS UNTUK MENJAWAB' : drop.label;
      ctx.fillText(label, drop.x + drop.width / 2, drop.y + drop.height / 2);
      ctx.restore();

      // Draw Answer Cards
      pState.cards.forEach((card) => {
        const isHeld = pState.heldCard === card;
        const isCardHovering = isHeld && isHovering;

        const cardScale = isCardHovering ? 1.08 : isHeld ? 1.04 : 1.0;
        const cWidth = card.width * cardScale;
        const cHeight = card.height * cardScale;
        const cX = card.x - (cWidth - card.width) / 2;
        const cY = card.y - (cHeight - card.height) / 2;

        ctx.save();

        // Shadow under card
        ctx.fillStyle = isHeld ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.2)';
        drawRoundRect(ctx, cX + (isHeld ? 5 : 2), cY + (isHeld ? 6 : 3), cWidth, cHeight, 16);
        ctx.fill();

        // Card Body
        ctx.fillStyle = isCardHovering ? '#f0fdf4' : card.bgColor;
        drawRoundRect(ctx, cX, cY, cWidth, cHeight, 16);
        ctx.fill();

        ctx.lineWidth = isCardHovering ? 3.5 : isHeld ? 3 : 2;
        ctx.strokeStyle = isCardHovering
          ? (pNum === 2 ? '#ea580c' : '#0d9488')
          : card.borderColor;
        ctx.stroke();

        // Card Text
        ctx.fillStyle = card.textColor;
        ctx.font = gameMode === 'battle' ? '800 15px "Plus Jakarta Sans", sans-serif' : '800 17px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.text, cX + cWidth / 2, cY + cHeight / 2);
        ctx.restore();
      });
    };

    renderPlayerAssets(stateP1Ref.current, 1);
    if (gameMode === 'battle') {
      renderPlayerAssets(stateP2Ref.current, 2);
    }

    // 4. Hand Tracking Logic and Clean Cursors
    if (inputMode === 'camera') {
      processHandPinch(1, stateP1Ref.current, detectedHandsRef.current);
      if (gameMode === 'battle') {
        processHandPinch(2, stateP2Ref.current, detectedHandsRef.current);
      }

      detectedHandsRef.current.forEach((hand) => {
        const primaryColor = hand.x < canvas.width / 2 ? '#0d9488' : '#f97316';

        ctx.save();
        if (hand.isPinching) {
          // Clean solid green reticle when pinching
          ctx.beginPath();
          ctx.arc(hand.x, hand.y, 11, 0, 2 * Math.PI);
          ctx.fillStyle = '#22c55e';
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(hand.x, hand.y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        } else {
          // Open hand hover indicator
          ctx.beginPath();
          ctx.arc(hand.x, hand.y, 14, 0, 2 * Math.PI);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(hand.x, hand.y, 6, 0, 2 * Math.PI);
          ctx.fillStyle = primaryColor;
          ctx.fill();
        }
        ctx.restore();
      });
    }
  }, [gameMode, inputMode, isMirrored, processHandPinch]);

  // Keep drawFrameRef updated
  useEffect(() => {
    drawFrameRef.current = drawFrame;
  }, [drawFrame]);

  // Pointer / Mouse events for manual dragging
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isGameActiveRef.current) return;
    const { x, y } = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    mousePointerRef.current.x = x;
    mousePointerRef.current.y = y;
    mousePointerRef.current.isDown = true;

    let pNum = 1;
    if (gameMode === 'battle') {
      pNum = x < canvas.width / 2 ? 1 : 2;
    }
    mousePointerRef.current.activePNum = pNum;

    const pState = pNum === 1 ? stateP1Ref.current : stateP2Ref.current;

    for (const card of pState.cards) {
      if (x >= card.x && x <= card.x + card.width && y >= card.y && y <= card.y + card.height) {
        pState.heldCard = card;
        playSound('grab');
        break;
      }
    }

    if (inputMode === 'mouse') {
      drawFrame(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isGameActiveRef.current || !mousePointerRef.current.isDown) return;
    const { x, y } = getCanvasCoords(e);

    mousePointerRef.current.x = x;
    mousePointerRef.current.y = y;

    const pNum = mousePointerRef.current.activePNum;
    const pState = pNum === 1 ? stateP1Ref.current : stateP2Ref.current;

    if (pState.heldCard) {
      pState.heldCard.x = x - pState.heldCard.width / 2;
      pState.heldCard.y = y - pState.heldCard.height / 2;
    }

    if (inputMode === 'mouse') {
      drawFrame(null);
    }
  };

  const handlePointerUp = () => {
    if (!isGameActiveRef.current || !mousePointerRef.current.isDown) return;
    mousePointerRef.current.isDown = false;

    const pNum = mousePointerRef.current.activePNum;
    const pState = pNum === 1 ? stateP1Ref.current : stateP2Ref.current;

    if (pState.heldCard) {
      checkDropAnswer(pState, pNum);
    }

    if (inputMode === 'mouse') {
      drawFrame(null);
    }
  };

  // MediaPipe Results Callback
  const onResults = useCallback((results: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const hands: DetectedHand[] = [];

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks = results.multiHandLandmarks[i];

        const wrist = landmarks[0];
        const indexMcp = landmarks[5];
        const middleMcp = landmarks[9];
        const pinkyMcp = landmarks[17];
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];

        const ix = (1 - indexTip.x) * canvas.width;
        const iy = indexTip.y * canvas.height;

        const tx = (1 - thumbTip.x) * canvas.width;
        const ty = thumbTip.y * canvas.height;

        const wx = (1 - wrist.x) * canvas.width;
        const wy = wrist.y * canvas.height;

        const mx = (1 - middleMcp.x) * canvas.width;
        const my = middleMcp.y * canvas.height;

        const imx = (1 - indexMcp.x) * canvas.width;
        const imy = indexMcp.y * canvas.height;

        const px = (1 - pinkyMcp.x) * canvas.width;
        const py = pinkyMcp.y * canvas.height;

        const palmLength = Math.hypot(wx - mx, wy - my);
        const palmWidth = Math.hypot(imx - px, imy - py);
        const handScale = Math.max(40, palmLength * 0.6 + palmWidth * 0.8);

        const pinchDist = Math.hypot(ix - tx, iy - ty);
        const rawCenterX = (ix + tx) / 2;
        const rawCenterY = (iy + ty) / 2;

        let assignedId = i;
        let minIdDist = Infinity;
        prevTrackedHandsRef.current.forEach((prevHand) => {
          const d = Math.hypot(prevHand.x - rawCenterX, prevHand.y - rawCenterY);
          if (d < minIdDist && d < 180) {
            minIdDist = d;
            assignedId = prevHand.id;
          }
        });

        let smoothX = rawCenterX;
        let smoothY = rawCenterY;

        if (smoothHandMapRef.current.has(assignedId)) {
          const prevPos = smoothHandMapRef.current.get(assignedId)!;
          const alpha = 0.45;
          smoothX = prevPos.x * (1 - alpha) + rawCenterX * alpha;
          smoothY = prevPos.y * (1 - alpha) + rawCenterY * alpha;
        }

        smoothHandMapRef.current.set(assignedId, { x: smoothX, y: smoothY, lastSeen: Date.now() });

        const pinchRatio = pinchDist / handScale;

        hands.push({
          id: assignedId,
          x: smoothX,
          y: smoothY,
          pinchRatio,
          handScale,
          isPinching: false
        });
      }
    }

    const now = Date.now();
    smoothHandMapRef.current.forEach((val, key) => {
      if (now - val.lastSeen > 1000) {
        smoothHandMapRef.current.delete(key);
      }
    });

    prevTrackedHandsRef.current = hands.map(h => ({ id: h.id, x: h.x, y: h.y }));
    detectedHandsRef.current = hands;

    drawFrameRef.current(results.image);
  }, []);

  // Initialize Game & Camera
  useEffect(() => {
    isGameActiveRef.current = true;
    setIsGameOver(false);
    setScoreP1(0);
    setScoreP2(0);

    poolP1Ref.current = [...questionBank];
    poolP2Ref.current = [...questionBank];

    spawnQuestion(1);
    if (gameMode === 'battle') {
      spawnQuestion(2);
    }

    if (inputMode === 'mouse') {
      setIsLoadingCamera(false);
      let animId: number;
      const loop = () => {
        if (isGameActiveRef.current) {
          drawFrameRef.current(null);
          animId = requestAnimationFrame(loop);
        }
      };
      animId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(animId);
    } else {
      setIsLoadingCamera(true);

      const setupMediaPipe = async () => {
        try {
          if (!window.Hands || !window.Camera) {
            console.warn('MediaPipe scripts not yet loaded, falling back to mouse mode');
            setIsLoadingCamera(false);
            onChangeInputMode('mouse');
            return;
          }

          if (!handsInstanceRef.current) {
            handsInstanceRef.current = new window.Hands({
              locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            });

            handsInstanceRef.current.setOptions({
              maxNumHands: 2,
              modelComplexity: 1,
              minDetectionConfidence: 0.7,
              minTrackingConfidence: 0.7
            });

            handsInstanceRef.current.onResults(onResults);
          }

          if (videoRef.current && !cameraInstanceRef.current) {
            cameraInstanceRef.current = new window.Camera(videoRef.current, {
              onFrame: async () => {
                if (isGameActiveRef.current && videoRef.current && handsInstanceRef.current) {
                  await handsInstanceRef.current.send({ image: videoRef.current });
                }
              },
              width: 640,
              height: 480
            });

            await cameraInstanceRef.current.start();
          }

          setIsLoadingCamera(false);
        } catch (err) {
          console.warn('Could not initialize camera / hands tracking, switching to mouse:', err);
          setIsLoadingCamera(false);
          onChangeInputMode('mouse');
        }
      };

      setupMediaPipe();
    }

    return () => {
      isGameActiveRef.current = false;
    };
  }, [gameMode, inputMode, onChangeInputMode, onResults, questionBank, spawnQuestion]);

  // Restart function
  const handleRestart = () => {
    playSound('click');
    setScoreP1(0);
    setScoreP2(0);
    setIsGameOver(false);
    isGameActiveRef.current = true;
    poolP1Ref.current = [...questionBank];
    poolP2Ref.current = [...questionBank];
    spawnQuestion(1);
    if (gameMode === 'battle') spawnQuestion(2);
  };

  return (
    <div className="w-full max-w-6xl flex-1 flex flex-col items-center justify-center relative">
      <video ref={videoRef} className="hidden" autoPlay playsInline muted />

      <div className="relative w-full aspect-[16/9] max-w-[1100px] bg-slate-900 border-4 border-slate-800 rounded-3xl overflow-hidden shadow-[6px_6px_0px_#1e293b]">
        
        {/* Widescreen Canvas */}
        <canvas
          ref={canvasRef}
          width={1000}
          height={562}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full object-cover cursor-pointer touch-none select-none"
        />

        {/* TOAST FEEDBACK: Player 1 */}
        {toastP1 && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-300">
            <div
              className={`px-5 py-3 rounded-2xl border-2 border-white/20 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.3)] text-white flex items-center gap-2.5 text-xs sm:text-sm font-black ${
                toastP1.isCorrect ? 'bg-emerald-500/90' : 'bg-rose-500/90'
              }`}
            >
              {toastP1.isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <span className="drop-shadow">{toastP1.msg}</span>
            </div>
          </div>
        )}

        {/* TOAST FEEDBACK: Player 2 (Battle mode) */}
        {toastP2 && (
          <div className="absolute top-16 right-6 z-30 pointer-events-none transition-all duration-300">
            <div
              className={`px-4 py-2.5 rounded-2xl border-2 border-white/20 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.3)] text-white flex items-center gap-2 text-xs font-black ${
                toastP2.isCorrect ? 'bg-emerald-500/90' : 'bg-rose-500/90'
              }`}
            >
              {toastP2.isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span className="drop-shadow">{toastP2.msg}</span>
            </div>
          </div>
        )}

        {/* IN-GAME HUD OVERLAY */}
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 sm:p-5">
          {/* Top Status Bar */}
          <div className="w-full flex justify-between items-start gap-2">
            {/* Player 1 Score badge */}
            <div className="bg-white/90 backdrop-blur-sm border-2 border-slate-800 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl shadow-[3px_3px_0px_#0f172a] flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 rounded-full bg-teal-600 border border-teal-800 shadow-sm" />
              <div>
                <div className="text-[10px] uppercase font-black tracking-wider text-slate-500">
                  {gameMode === 'battle' ? 'Pemain 1' : 'Skor Saya'}
                </div>
                <div className="text-lg sm:text-xl font-black text-teal-700 leading-none">
                  {scoreP1} <span className="text-[11px] text-slate-400 font-bold">/ {targetScore}</span>
                </div>
              </div>
            </div>

            {/* Central Mode Badge */}
            <div className="flex flex-col items-center gap-1">
              <div className="bg-slate-900/75 backdrop-blur-md border border-white/30 px-3 py-1 rounded-full text-[11px] sm:text-xs text-white font-black shadow-sm flex items-center gap-1.5">
                <span>{gameMode === 'battle' ? '⚔️ Mode Battle 2P' : '👤 Mode Solo'}</span>
                <span className="text-teal-300">• Target {targetScore} (+{pointsCorrect}/-{pointsWrong})</span>
              </div>
              <div className="bg-amber-400/90 text-amber-950 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-amber-500 shadow-sm">
                {inputMode === 'camera' ? '👌 Jepit jari & geser' : '🖱️ Klik/Sentuh & seret'}
              </div>
            </div>

            {/* Player 2 Score badge (Battle mode only) */}
            {gameMode === 'battle' ? (
              <div className="bg-white/90 backdrop-blur-sm border-2 border-slate-800 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl shadow-[3px_3px_0px_#0f172a] flex items-center gap-2.5">
                <div>
                  <div className="text-[10px] uppercase font-black tracking-wider text-slate-500 text-right">
                    Pemain 2
                  </div>
                  <div className="text-lg sm:text-xl font-black text-orange-600 leading-none text-right">
                    {scoreP2} <span className="text-[11px] text-slate-400 font-bold">/ {targetScore}</span>
                  </div>
                </div>
                <div className="w-3.5 h-3.5 rounded-full bg-orange-500 border border-orange-800 shadow-sm" />
              </div>
            ) : (
              <div className="w-16" />
            )}
          </div>

          {/* BOTTOM QUESTION BANNERS */}
          {/* Solo Mode Question Card */}
          {gameMode === 'solo' && (
            <div className="w-full flex justify-center mt-auto mb-1">
              <div className="bg-slate-900/75 backdrop-blur-xl border-2 border-teal-500/50 text-white px-5 sm:px-8 py-3 rounded-3xl text-center shadow-[0_8px_32px_rgba(0,0,0,0.5)] max-w-2xl w-full">
                <div className="text-[10px] font-black tracking-widest uppercase text-teal-300 mb-0.5">
                  PERTANYAAN
                </div>
                <div className="text-sm sm:text-base md:text-lg font-black leading-snug drop-shadow-md">
                  {currentQP1 ? currentQP1.q : 'Memuat soal berikutnya...'}
                </div>
              </div>
            </div>
          )}

          {/* Battle 2P Mode Questions Cards - Both Player 1 and Player 2 */}
          {gameMode === 'battle' && (
            <div className="w-full grid grid-cols-2 gap-3 sm:gap-4 mt-auto mb-1 px-1">
              {/* Player 1 Question Card (Left) */}
              <div className="bg-slate-900/85 backdrop-blur-xl border-2 border-teal-500 text-white p-3 sm:p-3.5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                <div className="text-[10px] font-black tracking-wider uppercase text-teal-300 mb-0.5 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-sm" />
                  <span>SOAL PEMAIN 1</span>
                </div>
                <div className="text-xs sm:text-sm font-black leading-snug drop-shadow-md text-slate-100">
                  {currentQP1 ? currentQP1.q : 'Memuat soal P1...'}
                </div>
              </div>

              {/* Player 2 Question Card (Right) */}
              <div className="bg-slate-900/85 backdrop-blur-xl border-2 border-orange-500 text-white p-3 sm:p-3.5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                <div className="text-[10px] font-black tracking-wider uppercase text-orange-400 mb-0.5 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-sm" />
                  <span>SOAL PEMAIN 2</span>
                </div>
                <div className="text-xs sm:text-sm font-black leading-snug drop-shadow-md text-slate-100">
                  {currentQP2 ? currentQP2.q : 'Memuat soal P2...'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* LOADING OVERLAY (Camera initialization) */}
        {isLoadingCamera && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-white border-3 border-slate-900 rounded-3xl p-6 sm:p-7 shadow-[8px_8px_0px_#000] flex flex-col items-center max-w-sm">
              <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4" />
              <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1">
                Menyiapkan Kamera...
              </h3>
              <p className="text-xs text-slate-600 font-medium mb-5 leading-relaxed">
                Mohon izinkan akses webcam pada browser kamu untuk mulai mendeteksi cubitan jari (👌).
              </p>
              <button
                onClick={() => {
                  playSound('click');
                  setIsLoadingCamera(false);
                  onChangeInputMode('mouse');
                }}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 border-2 border-slate-300 rounded-xl text-xs font-black transition flex items-center justify-center gap-2"
              >
                <MousePointer className="w-4 h-4 text-slate-600" />
                <span>Beralih ke Mouse / Sentuh Layar</span>
              </button>
            </div>
          </div>
        )}

        {/* GAME OVER MODAL */}
        {isGameOver && winnerInfo && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md z-30 flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-white border-3 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_#000] max-w-sm w-full flex flex-col items-center">
              <div className="text-5xl mb-2">{winnerInfo.icon}</div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">{winnerInfo.title}</h2>
              <p className="text-xs sm:text-sm text-slate-600 font-bold mb-6">{winnerInfo.subtitle}</p>

              <div className="flex gap-2.5 w-full">
                <button
                  onClick={handleRestart}
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-[0_4px_0_#0f766e] active:translate-y-1 active:shadow-none transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Main Lagi</span>
                </button>
                <button
                  onClick={() => {
                    playSound('click');
                    onGoHome();
                  }}
                  className="flex-1 py-3 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 rounded-xl text-xs font-black shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-none transition"
                >
                  Menu Utama
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
