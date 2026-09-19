import { useState } from 'react';
import { Box, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Car, Rocket, Sailboat, Zap, Star, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameState, Team, InvestmentCard, SpecialCard } from '../types';

const TOKEN_TYPES = [
  { icon: Car, color: 'bg-white', text: 'text-black', border: 'border-[var(--border-strong)]' },
  { icon: Rocket, color: 'bg-[var(--color-brand)]', text: 'text-white', border: 'border-transparent' },
  { icon: Sailboat, color: 'bg-black', text: 'text-white', border: 'border-[var(--border-strong)]' },
  { icon: Zap, color: 'bg-[var(--color-brand-hover)]', text: 'text-white', border: 'border-transparent' },
  { icon: Star, color: 'bg-white', text: 'text-[var(--color-brand)]', border: 'border-[var(--color-brand)]' },
  { icon: Crown, color: 'bg-[var(--bg-elevated)]', text: 'text-white', border: 'border-[var(--border-strong)]' },
];

const SPECIAL_TILES = [2, 7, 17, 22, 33, 36];

const ERA_BACKGROUNDS: Record<string, string> = {
  "Trump vs. China (2025)": "/eras/trump_china.png",
  "The Great Depression (1929–1939)": "/eras/great_depression.png",
  "AI Boom & Tech Stock Rally (2023–2025)": "/eras/ai_boom.png",
  "War in Ukraine (2022–Ongoing)": "/eras/ukraine.png",
  "U.S. Regional Bank Failures (2023)": "/eras/bank_failures.png",
  "2008 Global Financial Crisis": "/eras/2008_crisis.png",
  "COVID": "/eras/covid.png"
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ProjectorBoard({ socket, gameState, roomId }: { socket: any, gameState: GameState, roomId: string }) {
  const [drawnCards, setDrawnCards] = useState<InvestmentCard[]>([]);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);
  const [specialEvent, setSpecialEvent] = useState<string | null>(null);
  const [marketNewsCard, setMarketNewsCard] = useState<SpecialCard | null>(null);
  const [targetTeamId, setTargetTeamId] = useState<string>('');
  const [coinTossResult, setCoinTossResult] = useState<string>('');

  const [betAmount, setBetAmount] = useState<string>('');
  const [isBetLocked, setIsBetLocked] = useState(false);

  const roomState = gameState?.rooms?.[roomId] || { deck: [], turnIndex: 0, eraStatus: 'ACTIVE' };
  const teamsInRoom = gameState?.teams?.filter((t: Team) => t.room === roomId) || [];
  const currentTurnTeam = teamsInRoom[roomState.turnIndex];

  // Map 0-39 position to a grid cell id or array for rendering
  const renderTokens = (squareIndex: number) => {
    const teamsOnSquare = teamsInRoom.filter((t: Team) => (t.position || 0) === squareIndex);
    return (
      <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-1 p-1 pointer-events-none z-20">
        {teamsOnSquare.map((t: Team) => {
          // Find index of team in the room to assign a consistent token style
          const teamIdx = teamsInRoom.findIndex((team: Team) => team.id === t.id);
          const tokenStyle = TOKEN_TYPES[teamIdx % TOKEN_TYPES.length];
          const IconComponent = tokenStyle.icon;

          return (
            <motion.div
              layoutId={`token-${t.id}`}
              key={t.id}
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${tokenStyle.color} ${tokenStyle.text} border-2 ${tokenStyle.border} shadow-[0_0_8px_rgba(0,0,0,0.5)] flex items-center justify-center`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <IconComponent size={12} />
            </motion.div>
          );
        })}
      </div>
    );
  };

  const rollDice = () => {
    if (isRolling || specialEvent || drawnCards.length > 0 || diceResult !== null) return;
    setIsRolling(true);
    setDiceResult(null);
    setBetAmount('');
    setIsBetLocked(false);

    // eslint-disable-next-line react-hooks/purity
    const steps = Math.floor(Math.random() * 6) + 1;

    setTimeout(() => {
      setDiceResult(steps);
      setIsRolling(false);

      // Move piece on server
      if (currentTurnTeam) {
        socket.emit('movePiece', { teamId: currentTurnTeam.id, steps }, (res: { specialEvent?: string, newsCard?: SpecialCard }) => {
           if (res?.specialEvent) {
             setMarketNewsCard(res.newsCard || null);
             // Handle Corner Action locally
             setTimeout(() => setSpecialEvent(res.specialEvent || null), 1000);
           }
        });
      }
    }, 1500);
  };

  const handleDrawInvestments = () => {
    if (!currentTurnTeam) return;
    socket.emit('drawInvestments', { roomId, teamId: currentTurnTeam.id }, (response: { error?: string, cards?: InvestmentCard[] }) => {
      if (response.error) alert(response.error);
      else {
        setDrawnCards(response.cards || []);
        setSelectedCardIdx(null);
      }
    });
  };

  const handleSelectInvestment = (_card: InvestmentCard, idx: number) => {
    if (!currentTurnTeam) return;
    setSelectedCardIdx(idx);
  };

  const dismissSpecialEvent = () => {
    if (specialEvent === 'MARKET_NEWS' && marketNewsCard && currentTurnTeam) {
        if (marketNewsCard.type === 'TARGET_OPPONENT' && !targetTeamId) {
            alert("Please select a target team.");
            return;
        }
        if (marketNewsCard.type === 'COIN_TOSS' && !coinTossResult) {
            alert("Please flip the coin first.");
            return;
        }
        if (marketNewsCard.effect === 'HOSTILE_BID' && !coinTossResult) {
            alert("Please select the winner of the dice roll.");
            return;
        }
        socket.emit('resolveMarketNews', {
            teamId: currentTurnTeam.id,
            roomId,
            newsCard: marketNewsCard,
            targetTeamId,
            coinTossResult
        });
    }

    if (specialEvent && ['ANGEL_INVESTMENT', 'CORPORATE_BUYOUT', 'WHITE_COLLAR_PRISON'].includes(specialEvent) && currentTurnTeam) {
        if (specialEvent === 'ANGEL_INVESTMENT' && !coinTossResult) {
            alert("Please flip the coin first.");
            return;
        }
        if (specialEvent === 'CORPORATE_BUYOUT' && !targetTeamId) {
            alert("Please select a target team.");
            return;
        }
        if (specialEvent === 'CORPORATE_BUYOUT' && !coinTossResult) {
            alert("Please select the winner of the dice roll.");
            return;
        }
        socket.emit('resolveCornerEvent', {
            teamId: currentTurnTeam.id,
            roomId,
            eventType: specialEvent,
            coinTossResult,
            targetTeamId
        });
    }

    setSpecialEvent(null);
    setMarketNewsCard(null);
    setTargetTeamId('');
    setCoinTossResult('');
    setDiceResult(null);

    if (currentTurnTeam) {
        socket.emit('processInvestment', { teamId: currentTurnTeam.id, betAmount: 0, percentage: 0, unselectedCards: [] });
    }
  };

  const lockBet = () => {
    let parsedBet = parseInt(betAmount);
    if (currentTurnTeam?.blindFaith) {
        parsedBet = currentTurnTeam.cash;
    }
    if (isNaN(parsedBet) || parsedBet <= 0) {
      alert("Please enter a valid bet amount.");
      return;
    }
    if (parsedBet > currentTurnTeam.cash) {
      alert("Bet exceeds team's current capital!");
      return;
    }

    setIsBetLocked(true);

    if (selectedCardIdx === null) return;
    const card = drawnCards[selectedCardIdx];
    const unselectedCards = drawnCards.filter((_, i) => i !== selectedCardIdx);

    setTimeout(() => {
      socket.emit('processInvestment', {
        teamId: currentTurnTeam.id,
        betAmount: parsedBet,
        percentage: card.percentage,
        unselectedCards
      });
      setTimeout(() => {
        setDrawnCards([]);
        setDiceResult(null);
        setBetAmount('');
        setIsBetLocked(false);
        setSelectedCardIdx(null);
      }, 4000);
    }, 1000);
  };

  const cancelDraw = () => {
    // Return all 3 to deck and advance turn
    socket.emit('processInvestment', { teamId: currentTurnTeam.id, betAmount: 0, percentage: 0, unselectedCards: drawnCards });
    setDrawnCards([]);
    setDiceResult(null);
    setBetAmount('');
    setIsBetLocked(false);
  };

  const renderSquareContent = (squareIndex: number, orientation: 'bottom' | 'left' | 'top' | 'right') => {
    const isSpecial = SPECIAL_TILES.includes(squareIndex);

    const content = isSpecial ? (
        <>
            {squareIndex % 2 === 0 ? <span className="font-display text-[var(--color-brand-hover)] mb-1 text-[clamp(0.5rem,1.4vw,0.75rem)] leading-none">[!]</span> : <span className="font-display text-[var(--text-primary)] mb-1 text-[clamp(0.5rem,1.4vw,0.75rem)] leading-none">[$]</span>}
            <div className="font-display text-[clamp(0.4rem,1vw,0.55rem)] text-[var(--text-secondary)] uppercase text-center leading-tight tracking-tighter">Market<br/>News</div>
        </>
    ) : (
        <div className="font-display text-[clamp(0.4rem,1vw,0.55rem)] text-[var(--text-tertiary)] uppercase text-center leading-tight tracking-tighter">Asset<br/><span className="text-[clamp(0.45rem,1.1vw,0.6rem)]">{squareIndex}</span></div>
    );

    if (orientation === 'bottom') return <div className="mt-1 sm:mt-2 flex flex-col items-center">{content}</div>;
    if (orientation === 'top') return <div className="mb-1 sm:mb-2 flex flex-col items-center">{content}</div>;
    if (orientation === 'left') return <div className="mr-1 sm:mr-2 flex flex-col items-center -rotate-90 origin-center whitespace-nowrap">{content}</div>;
    if (orientation === 'right') return <div className="ml-1 sm:ml-2 flex flex-col items-center rotate-90 origin-center whitespace-nowrap">{content}</div>;
  };

  const getStripeColor = (squareIndex: number) => {
    if (SPECIAL_TILES.includes(squareIndex)) return 'bg-white/60';
    const colors = ['bg-[var(--color-brand)]', 'bg-black', 'bg-[var(--color-brand-hover)]', 'bg-white/80'];
    return colors[squareIndex % colors.length];
  }

  // 1-9 (Bottom edge)
  const bottomEdge = Array.from({ length: 9 }).map((_, i) => {
    const squareIndex = 9 - i;
    return (
      <div key={`bottom-${i}`} className="col-span-1 border-r border-t border-[var(--border-strong)] bg-[var(--bg-secondary)] flex flex-col items-center justify-start relative overflow-hidden group">
        {renderSquareContent(squareIndex, 'bottom')}
        <div className={`absolute bottom-0 w-full h-2 sm:h-3 ${getStripeColor(squareIndex)} opacity-90`}></div>
        {renderTokens(squareIndex)}
      </div>
    );
  });

  // 11-19 (Left edge)
  const leftEdge = Array.from({ length: 9 }).map((_, i) => {
    const squareIndex = 19 - i;
    return (
      <div key={`left-${i}`} className="col-span-1 border-b border-r border-[var(--border-strong)] bg-[var(--bg-secondary)] flex flex-row items-center justify-end relative overflow-hidden group">
        <div className={`absolute left-0 w-2 sm:w-3 h-full ${getStripeColor(squareIndex)} opacity-90`}></div>
        {renderSquareContent(squareIndex, 'left')}
        {renderTokens(squareIndex)}
      </div>
    );
  });

  // 21-29 (Top edge)
  const topEdge = Array.from({ length: 9 }).map((_, i) => {
    const squareIndex = 21 + i;
    return (
      <div key={`top-${i}`} className="col-span-1 border-r border-b border-[var(--border-strong)] bg-[var(--bg-secondary)] flex flex-col items-center justify-end relative overflow-hidden group">
        <div className={`absolute top-0 w-full h-2 sm:h-3 ${getStripeColor(squareIndex)} opacity-90`}></div>
        {renderSquareContent(squareIndex, 'top')}
        {renderTokens(squareIndex)}
      </div>
    );
  });

  // 31-39 (Right edge)
  const rightEdge = Array.from({ length: 9 }).map((_, i) => {
    const squareIndex = 31 + i;
    return (
      <div key={`right-${i}`} className="col-span-1 border-b border-l border-[var(--border-strong)] bg-[var(--bg-secondary)] flex flex-row items-center justify-start relative overflow-hidden group">
        {renderSquareContent(squareIndex, 'right')}
        <div className={`absolute right-0 w-2 sm:w-3 h-full ${getStripeColor(squareIndex)} opacity-90`}></div>
        {renderTokens(squareIndex)}
      </div>
    );
  });

  // Compute Leaderboard
  const sortedTeams = [...teamsInRoom].sort((a, b) => b.cash - a.cash);

  if (roomState.eraStatus === 'INTERMISSION') {
    return (
      <div className="min-h-[calc(100dvh-64px)] sm:min-h-[calc(100dvh-72px)] flex items-center justify-center p-[var(--space-md)] bg-[var(--bg-primary)]">
         <motion.div
           className="w-full max-w-4xl soft-panel p-[var(--space-xl)] text-center relative overflow-hidden"
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ type: 'spring', damping: 25 }}
         >
            <div className="absolute top-0 left-0 w-full h-3 sm:h-4 bg-[var(--color-brand)]"></div>
            <h1 className="text-[length:var(--text-heading-xl)] display-font text-[var(--color-brand-hover)] mb-[var(--space-2xs)] uppercase tracking-tighter">Era Concluded</h1>
            <h2 className="text-[length:var(--text-heading-md)] font-bold text-[var(--text-secondary)] mb-[var(--space-lg)]">{gameState?.currentEraName}</h2>

            <p className="text-[var(--text-tertiary)] font-semibold mb-[var(--space-lg)] tracking-widest uppercase text-xs sm:text-sm">
               Take 20-30 minutes for research before the next era begins.
            </p>

            <div className="space-y-[var(--space-xs)]">
              {sortedTeams.map((t, idx) => {
                 const profit = t.cash - (t.eraStartingCash || 0);
                 const isProfit = profit >= 0;
                 const rankChip =
                   idx === 0 ? 'bg-[var(--color-brand)] text-white' :
                   idx === 1 ? 'bg-white text-black' :
                   idx === 2 ? 'bg-black text-white border border-[var(--border-strong)]' :
                   'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]';
                 return (
                   <motion.div
                     key={t.id}
                     initial={{ x: -20, opacity: 0 }}
                     animate={{ x: 0, opacity: 1 }}
                     transition={{ delay: idx * 0.1 }}
                     className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-[var(--space-md)] rounded-xl"
                   >
                     <div className="flex items-center gap-4">
                       <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${rankChip}`}>{idx + 1}</span>
                       <span className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">{t.name}</span>
                     </div>
                     <div className="text-right pl-12 sm:pl-0">
                       <div className="text-xl sm:text-2xl display-font text-[var(--color-brand-hover)] tabular-nums">${t.cash.toLocaleString()}</div>
                       <div className={`text-sm font-bold tabular-nums ${isProfit ? 'text-white' : 'text-[var(--color-danger)]'}`}>
                         {isProfit ? '+' : ''}{profit.toLocaleString()} this era
                       </div>
                     </div>
                   </motion.div>
                 );
              })}
            </div>
         </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-64px)] sm:min-h-[calc(100dvh-72px)] flex items-center justify-center p-[var(--space-sm)] relative">

      {/* Mini Leaderboard (Top Right, desktop only) */}
      <div className="hidden lg:block absolute top-6 right-6 w-64 bg-[var(--bg-secondary)]/90 backdrop-blur-md border border-[var(--border-subtle)] shadow-[var(--shadow-medium)] rounded-2xl p-4 z-40">
        <h3 className="text-xs font-black text-[var(--color-brand-hover)] uppercase tracking-widest mb-3 text-center border-b border-[var(--border-subtle)] pb-2">Leaderboard</h3>
        <ul className="space-y-2">
          {sortedTeams.map((t, idx) => (
            <li key={t.id} className="flex justify-between items-center text-sm">
               <div className="flex items-center gap-2">
                 <span className={`font-black ${idx === 0 ? 'text-[var(--color-brand-hover)]' : 'text-[var(--text-tertiary)]'}`}>#{idx + 1}</span>
                 <span className="font-semibold text-[var(--text-primary)] truncate max-w-[100px]">{t.name}</span>
               </div>
               <span className="font-bold text-white tabular-nums">${(t.cash / 1000).toFixed(1)}k</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 11x11 Grid Board */}
      <div className="relative w-[min(94vw,80vh,760px)] aspect-square bg-[var(--bg-secondary)] border-4 sm:border-8 border-[var(--border-strong)] shadow-[var(--shadow-medium)] grid grid-cols-11 grid-rows-11 overflow-hidden rounded-xl">

        {/* TOP LEFT CORNER (20) */}
        <div className="col-span-1 row-span-1 border border-[var(--border-strong)] bg-[var(--bg-elevated)] flex flex-col items-center justify-center relative p-1 text-center">
           <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-md bg-white p-1 mb-0.5 flex items-center justify-center">
             <img src="/corners/corner_prison.png" className="w-full h-full object-contain" />
           </div>
           <span className="font-display text-[clamp(0.45rem,1.2vw,0.65rem)] text-[var(--text-primary)] uppercase tracking-wide leading-none">PRISON</span>
           {renderTokens(20)}
        </div>

        <div className="col-span-9 row-span-1 grid grid-cols-9">{topEdge}</div>

        {/* TOP RIGHT CORNER (30) */}
        <div className="col-span-1 row-span-1 border border-[var(--border-strong)] bg-[var(--bg-elevated)] flex flex-col items-center justify-center relative p-1 text-center">
           <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-md bg-white p-1 mb-0.5 flex items-center justify-center">
             <img src="/corners/corner_buyout.png" className="w-full h-full object-contain" />
           </div>
           <span className="font-display text-[clamp(0.45rem,1.2vw,0.65rem)] text-[var(--text-primary)] uppercase tracking-wide leading-none">BUYOUT</span>
           {renderTokens(30)}
        </div>

        <div className="col-span-1 row-span-9 grid grid-rows-9">{leftEdge}</div>

        {/* CENTER AREA */}
        <div className="col-span-9 row-span-9 relative flex flex-col items-center justify-center bg-[var(--bg-primary)] border-2 sm:border-4 border-[var(--border-strong)] overflow-hidden shadow-inner">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             {(() => {
                const eraName = gameState?.currentEraName || '';
                let bgSrc = ERA_BACKGROUNDS[eraName];
                if (!bgSrc && eraName.toLowerCase().includes('covid')) bgSrc = '/eras/covid.png';

                if (bgSrc) {
                   return <img src={bgSrc} alt="Era Background" className="w-full h-full object-cover opacity-20" />;
                }
                return <h1 className="text-[clamp(2rem,8vw,6rem)] display-font text-[var(--color-brand)] whitespace-nowrap tracking-tighter -rotate-12 opacity-[0.08]">MARKET MASTERS</h1>;
             })()}
          </div>

          <div className="z-10 flex flex-col items-center gap-6 sm:gap-10 px-2">
            <motion.div
              className="text-center soft-panel px-[var(--space-lg)] py-[var(--space-md)]"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-xs sm:text-sm font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Current Turn</h2>
              {currentTurnTeam ? (
                <div className="flex flex-col items-center">
                   <div className="text-2xl sm:text-4xl display-font text-[var(--color-brand-hover)]">{currentTurnTeam.name}</div>
                   <div className="text-lg sm:text-xl font-semibold text-white mt-2 tabular-nums">${currentTurnTeam.cash.toLocaleString()}</div>
                </div>
              ) : (
                <div className="text-lg sm:text-xl font-medium text-[var(--text-tertiary)] italic">Waiting to start...</div>
              )}
            </motion.div>

            <div className="flex flex-col items-center gap-6">
               <div className={`dice-container ${!isRolling && !diceResult ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`} onClick={rollDice}>
                  <div className={`dice ${isRolling ? 'rolling' : ''} ${diceResult ? 'show-' + diceResult : 'show-1'}`}>
                    <div className="dice-face face-front"><span className="dot"></span></div>
                    <div className="dice-face face-back">
                      <div className="flex gap-2"><span className="dot"></span><span className="dot"></span></div>
                    </div>
                    <div className="dice-face face-right">
                      <div className="flex gap-2"><span className="dot"></span><span className="dot"></span><span className="dot"></span></div>
                    </div>
                    <div className="dice-face face-left">
                      <div className="grid grid-cols-2 gap-2"><span className="dot"></span><span className="dot"></span><span className="dot"></span><span className="dot"></span></div>
                    </div>
                    <div className="dice-face face-top">
                      <div className="grid grid-cols-3 gap-2"><span className="dot"></span><span className="dot"></span><span className="dot"></span><span className="dot"></span><span className="dot"></span></div>
                    </div>
                    <div className="dice-face face-bottom">
                      <div className="grid grid-cols-2 gap-2"><span className="dot"></span><span className="dot"></span><span className="dot"></span><span className="dot"></span><span className="dot"></span><span className="dot"></span></div>
                    </div>
                  </div>
               </div>

              {diceResult && !isRolling && !specialEvent && currentTurnTeam && (
                currentTurnTeam.frozen ? (
                  <motion.button
                    onClick={() => {
                        setDiceResult(null);
                        socket.emit('processInvestment', { teamId: currentTurnTeam.id, betAmount: 0, percentage: 0, unselectedCards: [] });
                    }}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-white rounded-xl font-bold flex items-center gap-3 text-sm sm:text-base"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                      Assets Frozen - End Turn
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={handleDrawInvestments}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white rounded-xl font-bold shadow-[var(--shadow-brand-glow)] hover:scale-105 transition-all flex items-center gap-3 text-sm sm:text-base"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                      <Box size={22}/> Reveal Investments
                  </motion.button>
                )
              )}
            </div>
          </div>
        </div>

        <div className="col-span-1 row-span-9 grid grid-rows-9">{rightEdge}</div>

        {/* BOTTOM LEFT CORNER (10) */}
        <div className="col-span-1 row-span-1 border border-[var(--border-strong)] bg-[var(--bg-elevated)] flex flex-col items-center justify-center relative p-1 text-center">
           <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-md bg-white p-1 mb-0.5 flex items-center justify-center">
             <img src="/corners/corner_crash.png" className="w-full h-full object-contain" />
           </div>
           <span className="font-display text-[clamp(0.45rem,1.2vw,0.65rem)] text-[var(--text-primary)] uppercase tracking-wide leading-none">ANGEL</span>
           {renderTokens(10)}
        </div>

        <div className="col-span-9 row-span-1 grid grid-cols-9">{bottomEdge}</div>

        {/* BOTTOM RIGHT CORNER - Start (0) */}
        <div className="col-span-1 row-span-1 border border-[var(--border-strong)] bg-[var(--bg-elevated)] flex flex-col items-center justify-center relative p-1 text-center">
           <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-md bg-white p-1 mb-0.5 flex items-center justify-center">
             <img src="/corners/corner_start.png" className="w-full h-full object-contain" />
           </div>
           <span className="font-display text-[clamp(0.45rem,1.2vw,0.65rem)] text-[var(--text-primary)] uppercase tracking-wide leading-none">START</span>
           {renderTokens(0)}
        </div>

      </div>

      {/* Special Corner Event Popup */}
      <AnimatePresence>
      {specialEvent && (
        <motion.div
          className="fixed inset-0 bg-black/75 z-50 flex flex-col items-center justify-center p-[var(--space-md)] backdrop-blur-md overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
           <motion.div
             className="soft-panel p-[var(--space-xl)] max-w-lg w-full text-center flex flex-col items-center gap-6 my-auto"
             initial={{ scale: 0.8, y: 50 }}
             animate={{ scale: 1, y: 0 }}
           >
              <AlertTriangle size={64} className="text-[var(--color-brand-hover)] animate-pulse" />
              <h2 className="text-2xl sm:text-4xl display-font text-[var(--text-primary)] tracking-tight">
                {specialEvent === 'ANGEL_INVESTMENT' && "Angel Investment"}
                {specialEvent === 'WHITE_COLLAR_PRISON' && "White Collar Prison"}
                {specialEvent === 'CORPORATE_BUYOUT' && "Corporate Buyout"}
                {specialEvent === 'START_BONUS' && "Pass Start"}
                {specialEvent === 'MARKET_NEWS' && "Market News"}
              </h2>
              <div className="text-base sm:text-xl text-[var(--text-secondary)]">
                {specialEvent === 'WHITE_COLLAR_PRISON' && "You've been caught! You are frozen for your next turn, but immune to negative effects."}
                {specialEvent === 'START_BONUS' && "Direct landing on Start! Extra $200!"}

                {specialEvent === 'ANGEL_INVESTMENT' && (
                  <div className="flex flex-col items-center">
                    <span className="block mb-4">Invest 50% of your cash. Heads: Triple it. Tails: Lose it.</span>
                    {!coinTossResult && (
                        <div className="flex gap-4">
                            <button onClick={() => setCoinTossResult('HEADS')} className="px-6 py-2 bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-white rounded-lg font-bold hover:border-[var(--color-brand)]">Heads</button>
                            <button onClick={() => setCoinTossResult('TAILS')} className="px-6 py-2 bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-white rounded-lg font-bold hover:border-[var(--color-brand)]">Tails</button>
                        </div>
                    )}
                    {coinTossResult && (
                        <div className="text-xl sm:text-2xl display-font text-[var(--color-brand-hover)] mt-4">Result: {coinTossResult}</div>
                    )}
                  </div>
                )}

                {specialEvent === 'CORPORATE_BUYOUT' && (
                  <div className="flex flex-col items-center">
                    <span className="block mb-4">Target a team and roll dice. Winner steals $1000.</span>
                    <div className="mt-4">
                        <label className="block text-sm font-bold mb-2">Select Target:</label>
                        <select
                            className="px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:border-[var(--color-brand)]"
                            value={targetTeamId}
                            onChange={e => setTargetTeamId(e.target.value)}
                        >
                            <option value="">-- Choose Team --</option>
                            {teamsInRoom.filter(t => t.id !== currentTurnTeam?.id && !t.immune).map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                    {targetTeamId && !coinTossResult && (
                        <div className="mt-4 flex gap-4">
                            <button onClick={() => setCoinTossResult('WIN')} className="px-6 py-2 bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-white rounded-lg font-bold hover:border-[var(--color-brand)]">{currentTurnTeam?.name} Wins</button>
                            <button onClick={() => setCoinTossResult('LOSS')} className="px-6 py-2 bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-white rounded-lg font-bold hover:border-[var(--color-brand)]">Target Wins</button>
                        </div>
                    )}
                    {coinTossResult && (
                        <div className="mt-4 text-xl sm:text-2xl display-font text-[var(--color-brand-hover)]">Winner: {coinTossResult === 'WIN' ? currentTurnTeam?.name : 'Target'}</div>
                    )}
                  </div>
                )}
                {specialEvent === 'MARKET_NEWS' && marketNewsCard ? (
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-[var(--text-primary)] block mb-2">{marketNewsCard.title}</span>
                    <span>{marketNewsCard.description}</span>

                    {marketNewsCard.type === 'TARGET_OPPONENT' && (
                        <div className="mt-4">
                            <label className="block text-sm font-bold mb-2">Select Target:</label>
                            <select
                                className="px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:border-[var(--color-brand)]"
                                value={targetTeamId}
                                onChange={e => setTargetTeamId(e.target.value)}
                            >
                                <option value="">-- Choose Team --</option>
                                {teamsInRoom.filter(t => t.id !== currentTurnTeam?.id && !t.immune).map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {marketNewsCard.effect === 'HOSTILE_BID' && targetTeamId && !coinTossResult && (
                        <div className="mt-4 flex gap-4">
                            <button onClick={() => setCoinTossResult('WIN')} className="px-6 py-2 bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-white rounded-lg font-bold hover:border-[var(--color-brand)]">{currentTurnTeam.name} Wins</button>
                            <button onClick={() => setCoinTossResult('LOSS')} className="px-6 py-2 bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-white rounded-lg font-bold hover:border-[var(--color-brand)]">Target Wins</button>
                        </div>
                    )}
                    {marketNewsCard.effect === 'HOSTILE_BID' && coinTossResult && (
                        <div className="mt-4 text-xl sm:text-2xl display-font text-[var(--color-brand-hover)]">Winner: {coinTossResult === 'WIN' ? currentTurnTeam.name : 'Target'}</div>
                    )}

                    {marketNewsCard.type === 'COIN_TOSS' && !coinTossResult && (
                        <div className="mt-4 flex gap-4">
                            <button onClick={() => setCoinTossResult('HEADS')} className="px-6 py-2 bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-white rounded-lg font-bold hover:border-[var(--color-brand)]">Heads</button>
                            <button onClick={() => setCoinTossResult('TAILS')} className="px-6 py-2 bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-white rounded-lg font-bold hover:border-[var(--color-brand)]">Tails</button>
                        </div>
                    )}
                    {marketNewsCard.type === 'COIN_TOSS' && coinTossResult && (
                        <div className="mt-4 text-xl sm:text-2xl display-font text-[var(--color-brand-hover)]">Result: {coinTossResult}</div>
                    )}

                    {marketNewsCard.value !== undefined && (
                        <span className="block mt-4 font-black text-xl sm:text-2xl text-white">
                          Multiplier: {marketNewsCard.value}x
                        </span>
                    )}
                  </div>
                ) : null}
              </div>
              <button onClick={dismissSpecialEvent} className="mt-4 sm:mt-6 px-8 sm:px-10 py-3 sm:py-4 bg-[var(--color-brand)] text-white font-bold rounded-xl hover:bg-[var(--color-brand-hover)] transition-colors">
                Acknowledge & Continue
              </button>
           </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Blind Draw Cards Modal Overlay */}
      <AnimatePresence>
      {drawnCards.length > 0 && !specialEvent && (
        <motion.div
          className="fixed inset-0 bg-black/75 z-50 flex flex-col items-center justify-center p-[var(--space-md)] backdrop-blur-xl overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.h2
            className="text-2xl sm:text-5xl display-font text-[var(--text-primary)] mb-[var(--space-lg)] tracking-tight flex items-center gap-3 sm:gap-4"
            initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          >
            <Sparkles className="text-[var(--color-brand-hover)]" size={32}/> Investment Phase
          </motion.h2>

          {selectedCardIdx === null ? (
            <motion.div
              className="mb-6 sm:mb-8 text-center"
              initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            >
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Select an Investment</h3>
              <p className="text-[var(--text-secondary)]">Discuss and click on the company you wish to invest in.</p>
            </motion.div>
          ) : !isBetLocked ? (
            <motion.div
              className="soft-panel p-[var(--space-xl)] mb-[var(--space-lg)] text-center max-w-md w-full mx-auto"
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            >
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-3">Place Your Bet</h3>
              <p className="text-[var(--text-secondary)] mb-6 sm:mb-8 text-sm">Enter the amount {currentTurnTeam?.name} wants to risk on {drawnCards[selectedCardIdx].name}.</p>
              <div className="relative mb-6 sm:mb-8">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] font-bold text-2xl">$</span>
                <input
                  type="number"
                  className={`w-full bg-[var(--bg-primary)] border-2 border-[var(--border-strong)] rounded-2xl p-4 sm:p-5 pl-12 text-[var(--text-primary)] font-black text-2xl sm:text-3xl focus:outline-none focus:border-[var(--color-brand)] text-center tabular-nums ${currentTurnTeam?.blindFaith ? 'opacity-70 cursor-not-allowed' : ''}`}
                  placeholder="0"
                  value={currentTurnTeam?.blindFaith ? currentTurnTeam.cash : betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  disabled={!!currentTurnTeam?.blindFaith}
                />
              </div>
              {!!currentTurnTeam?.blindFaith && (
                 <p className="text-[var(--color-brand-hover)] font-bold mb-4">Blind Faith: You must invest 100% of your cash!</p>
              )}
              <button onClick={lockBet} className="w-full py-4 sm:py-5 bg-[var(--color-brand)] text-white font-bold rounded-xl hover:bg-[var(--color-brand-hover)] transition-colors flex justify-center items-center gap-3 text-base sm:text-lg">
                Confirm Investment <ArrowRight size={22}/>
              </button>
            </motion.div>
          ) : (
             <motion.div
               className="mb-8 sm:mb-10 text-xl sm:text-2xl font-bold text-[var(--text-primary)] bg-[var(--bg-elevated)] px-6 sm:px-8 py-3 rounded-full border border-[var(--border-subtle)]"
               initial={{ scale: 0.8 }} animate={{ scale: 1 }}
             >
                Locked Bet: <span className="text-white tabular-nums">${parseInt(betAmount).toLocaleString()}</span>
             </motion.div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 w-full max-w-7xl transition-all duration-700">
            {drawnCards.map((card, idx) => {
              const isSelected = selectedCardIdx === idx;
              const hasSelection = selectedCardIdx !== null;

              return (
                <motion.div
                  key={idx}
                  onClick={() => !isBetLocked && handleSelectInvestment(card, idx)}
                  className={`flex-1 soft-panel p-[var(--space-xl)] flex flex-col relative overflow-hidden
                    ${!isBetLocked ? 'cursor-pointer' : ''}
                    ${hasSelection && isSelected ? 'ring-4 ring-[var(--color-brand)] z-10' : ''}
                    ${hasSelection && !isSelected && isBetLocked ? 'pointer-events-none' : ''}
                  `}
                  animate={{
                    scale: hasSelection ? (isSelected ? 1.03 : 0.97) : 1,
                    opacity: hasSelection ? (isSelected ? 1 : 0.4) : 1,
                    filter: hasSelection && !isSelected ? 'grayscale(100%)' : 'grayscale(0%)',
                    y: 0
                  }}
                  whileHover={
                    !isBetLocked && hasSelection && !isSelected ? { scale: 0.98, opacity: 0.8, filter: 'grayscale(0%)' } :
                    !isBetLocked && !hasSelection ? { y: -8 } : {}
                  }
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <div className={`absolute top-0 left-0 w-full h-2 ${isSelected ? 'bg-[var(--color-brand)]' : 'bg-[var(--border-strong)]'}`}></div>
                  <div className="text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6 px-4 py-2 rounded-lg w-fit bg-[var(--color-brand-subtle)] text-[var(--color-brand-hover)] border border-[var(--border-subtle)]">
                    Opportunity
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] mb-4 leading-tight">{card.name}</h3>
                  <p className="text-[var(--text-secondary)] flex-grow mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed">
                    {card.description || "Evaluate this asset's market fundamentals for potential returns."}
                  </p>

                  <div className="mt-auto pt-6 sm:pt-8 border-t border-[var(--border-subtle)] min-h-[160px] sm:min-h-[180px] flex items-center justify-center bg-[var(--bg-primary)] -mx-6 sm:-mx-10 -mb-6 sm:-mb-10 px-6 sm:px-10 rounded-b-xl">
                    {!isSelected && !isBetLocked ? (
                       <span className="text-lg sm:text-xl font-medium text-[var(--text-tertiary)] italic pulse-glow rounded-full px-6 py-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] cursor-pointer">Click to Select</span>
                    ) : isSelected ? (
                       !isBetLocked ? (
                          <span className="text-lg sm:text-xl font-bold text-[var(--color-brand-hover)] animate-pulse">Enter bet amount above...</span>
                       ) : (
                          <motion.div
                            className="flex flex-col items-center gap-3 w-full"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', bounce: 0.5 }}
                          >
                            <div className={`text-5xl sm:text-6xl font-black tracking-tighter tabular-nums ${card.percentage > 0 ? 'text-white' : 'text-[var(--color-danger)]'}`}>
                              {card.percentage > 0 ? '+' : ''}{card.percentage}%
                            </div>
                            <div className="text-sm sm:text-base font-semibold text-[var(--text-secondary)] text-center mt-3 px-4 py-3 bg-[var(--bg-elevated)] rounded-xl w-full border border-[var(--border-subtle)]">
                              {card.reason}
                            </div>
                            <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-brand-hover)] mt-4">
                               <CheckCircle2 size={20} className="text-[var(--color-brand-hover)]"/>
                               Locked for {currentTurnTeam?.name}
                            </div>
                          </motion.div>
                       )
                    ) : (
                       <span className="text-2xl sm:text-3xl font-black text-[var(--text-tertiary)] line-through">HIDDEN</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {selectedCardIdx === null && (
            <motion.button
              onClick={cancelDraw}
              className="mt-10 sm:mt-14 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] uppercase font-bold tracking-widest text-sm transition-all border border-[var(--border-subtle)] px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-primary)]"
              initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 1 } }}
            >
               Discard & Advance Turn
            </motion.button>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
