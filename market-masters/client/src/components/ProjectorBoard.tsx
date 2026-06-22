import { useState } from 'react';
import { Box, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Car, Rocket, Sailboat, Zap, Star, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameState, Team, InvestmentCard, SpecialCard } from '../types';

const TOKEN_TYPES = [
  { icon: Car, color: 'bg-rose-500', border: 'border-rose-200' },
  { icon: Rocket, color: 'bg-sky-500', border: 'border-sky-200' },
  { icon: Sailboat, color: 'bg-emerald-500', border: 'border-emerald-200' },
  { icon: Zap, color: 'bg-amber-500', border: 'border-amber-200' },
  { icon: Star, color: 'bg-fuchsia-500', border: 'border-fuchsia-200' },
  { icon: Crown, color: 'bg-indigo-500', border: 'border-indigo-200' },
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
              className={`w-6 h-6 rounded-full ${tokenStyle.color} border-2 ${tokenStyle.border} shadow-[0_0_10px_rgba(0,0,0,0.2)] flex items-center justify-center text-white`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <IconComponent size={14} />
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
            {squareIndex % 2 === 0 ? <span className="font-pixel text-blue-500 mb-2 text-[10px] drop-shadow-sm">[!]</span> : <span className="font-pixel text-purple-500 mb-2 text-[10px] drop-shadow-sm">[$]</span>}
            <div className="font-pixel text-[5px] text-blue-700 uppercase text-center leading-tight tracking-tighter">Market<br/>News</div>
        </>
    ) : (
        <div className="font-pixel text-[5px] text-[var(--text-tertiary)] uppercase text-center leading-tight tracking-tighter">Asset<br/><span className="text-[6px]">{squareIndex}</span></div>
    );

    if (orientation === 'bottom') return <div className="mt-2 flex flex-col items-center">{content}</div>;
    if (orientation === 'top') return <div className="mb-2 flex flex-col items-center">{content}</div>;
    if (orientation === 'left') return <div className="mr-2 flex flex-col items-center -rotate-90 origin-center whitespace-nowrap">{content}</div>;
    if (orientation === 'right') return <div className="ml-2 flex flex-col items-center rotate-90 origin-center whitespace-nowrap">{content}</div>;
  };

  const getStripeColor = (squareIndex: number) => {
    if (SPECIAL_TILES.includes(squareIndex)) return 'bg-slate-300';
    const colors = ['bg-sky-400', 'bg-emerald-400', 'bg-orange-400', 'bg-fuchsia-400', 'bg-rose-400', 'bg-amber-400', 'bg-teal-400', 'bg-indigo-400'];
    return colors[squareIndex % colors.length];
  }

  // 1-9 (Bottom edge)
  const bottomEdge = Array.from({ length: 9 }).map((_, i) => {
    const squareIndex = 9 - i; 
    return (
      <div key={`bottom-${i}`} className="col-span-1 border-r-2 border-t-2 border-[var(--border-strong)] bg-[var(--bg-secondary)] flex flex-col items-center justify-start relative overflow-hidden group">
        {renderSquareContent(squareIndex, 'bottom')}
        <div className={`absolute bottom-0 w-full h-3 ${getStripeColor(squareIndex)} opacity-80`}></div>
        {renderTokens(squareIndex)}
      </div>
    );
  });

  // 11-19 (Left edge)
  const leftEdge = Array.from({ length: 9 }).map((_, i) => {
    const squareIndex = 19 - i;
    return (
      <div key={`left-${i}`} className="col-span-1 border-b-2 border-r-2 border-[var(--border-strong)] bg-[var(--bg-secondary)] flex flex-row items-center justify-end relative overflow-hidden group">
        <div className={`absolute left-0 w-3 h-full ${getStripeColor(squareIndex)} opacity-80`}></div>
        {renderSquareContent(squareIndex, 'left')}
        {renderTokens(squareIndex)}
      </div>
    );
  });

  // 21-29 (Top edge)
  const topEdge = Array.from({ length: 9 }).map((_, i) => {
    const squareIndex = 21 + i;
    return (
      <div key={`top-${i}`} className="col-span-1 border-r-2 border-b-2 border-[var(--border-strong)] bg-[var(--bg-secondary)] flex flex-col items-center justify-end relative overflow-hidden group">
        <div className={`absolute top-0 w-full h-3 ${getStripeColor(squareIndex)} opacity-80`}></div>
        {renderSquareContent(squareIndex, 'top')}
        {renderTokens(squareIndex)}
      </div>
    );
  });

  // 31-39 (Right edge)
  const rightEdge = Array.from({ length: 9 }).map((_, i) => {
    const squareIndex = 31 + i;
    return (
      <div key={`right-${i}`} className="col-span-1 border-b-2 border-l-2 border-[var(--border-strong)] bg-[var(--bg-secondary)] flex flex-row items-center justify-start relative overflow-hidden group">
        {renderSquareContent(squareIndex, 'right')}
        <div className={`absolute right-0 w-3 h-full ${getStripeColor(squareIndex)} opacity-80`}></div>
        {renderTokens(squareIndex)}
      </div>
    );
  });

  // Compute Leaderboard
  const sortedTeams = [...teamsInRoom].sort((a, b) => b.cash - a.cash);

  if (roomState.eraStatus === 'INTERMISSION') {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-[var(--bg-primary)]">
         <motion.div 
           className="w-full max-w-4xl soft-panel bg-white/90 backdrop-blur-xl p-12 text-center shadow-2xl relative overflow-hidden"
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ type: 'spring', damping: 25 }}
         >
            <div className="absolute top-0 left-0 w-full h-4 bg-brand-500"></div>
            <h1 className="text-5xl font-black text-brand-900 mb-2 uppercase tracking-tighter">Era Concluded</h1>
            <h2 className="text-2xl font-bold text-[var(--text-secondary)] mb-10">{gameState?.currentEraName}</h2>
            
            <p className="text-[var(--text-tertiary)] font-semibold mb-8 tracking-widest uppercase text-sm">
               Take 20-30 minutes for research before the next era begins.
            </p>

            <div className="space-y-4">
              {sortedTeams.map((t, idx) => {
                 const profit = t.cash - (t.eraStartingCash || 0);
                 const isProfit = profit >= 0;
                 return (
                   <motion.div 
                     key={t.id}
                     initial={{ x: -20, opacity: 0 }}
                     animate={{ x: 0, opacity: 1 }}
                     transition={{ delay: idx * 0.1 }}
                     className="flex items-center justify-between bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-4 rounded-xl shadow-sm"
                   >
                     <div className="flex items-center gap-4">
                       <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-700' : 'bg-brand-400'}`}>{idx + 1}</span>
                       <span className="text-xl font-bold text-[var(--text-primary)]">{t.name}</span>
                     </div>
                     <div className="text-right">
                       <div className="text-2xl font-black text-brand-900">${t.cash.toLocaleString()}</div>
                       <div className={`text-sm font-bold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
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
    <div className="h-full flex items-center justify-center p-4 relative">
      
      {/* Mini Leaderboard (Top Right) */}
      <div className="absolute top-6 right-6 w-64 bg-white/80 backdrop-blur-md border border-[var(--border-subtle)] shadow-lg rounded-2xl p-4 z-40">
        <h3 className="text-xs font-black text-brand-600 uppercase tracking-widest mb-3 text-center border-b border-[var(--border-subtle)] pb-2">Leaderboard</h3>
        <ul className="space-y-2">
          {sortedTeams.map((t, idx) => (
            <li key={t.id} className="flex justify-between items-center text-sm">
               <div className="flex items-center gap-2">
                 <span className={`font-black ${idx === 0 ? 'text-amber-500' : 'text-[var(--text-tertiary)]'}`}>#{idx + 1}</span>
                 <span className="font-semibold text-[var(--text-primary)] truncate max-w-[100px]">{t.name}</span>
               </div>
               <span className="font-bold text-emerald-600">${(t.cash / 1000).toFixed(1)}k</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 11x11 Grid Board */}
      <div className="relative w-full max-w-[85vh] aspect-square bg-white border-8 border-[var(--border-strong)] shadow-[var(--shadow-medium)] grid grid-cols-11 grid-rows-11 overflow-hidden">
        
        {/* TOP LEFT CORNER (20) */}
        <div className="col-span-1 row-span-1 border-2 border-[var(--border-strong)] bg-sky-50 flex flex-col items-center justify-center relative p-1 text-center">
           <img src="/corners/corner_prison.png" className="w-8 h-8 object-contain mb-1 drop-shadow-sm mix-blend-multiply" />
           <span className="font-pixel text-[4px] text-sky-700 leading-none">PRISON</span>
           {renderTokens(20)}
        </div>
        
        <div className="col-span-9 row-span-1 grid grid-cols-9">{topEdge}</div>

        {/* TOP RIGHT CORNER (30) */}
        <div className="col-span-1 row-span-1 border-2 border-[var(--border-strong)] bg-orange-50 flex flex-col items-center justify-center relative p-1 text-center">
           <img src="/corners/corner_buyout.png" className="w-8 h-8 object-contain mb-1 drop-shadow-sm mix-blend-multiply" />
           <span className="font-pixel text-[4px] text-orange-700 leading-none">BUYOUT</span>
           {renderTokens(30)}
        </div>

        <div className="col-span-1 row-span-9 grid grid-rows-9">{leftEdge}</div>

        {/* CENTER AREA */}
        <div className="col-span-9 row-span-9 relative flex flex-col items-center justify-center bg-[var(--bg-primary)] border-4 border-[var(--border-strong)] overflow-hidden shadow-inner">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             {(() => {
                const eraName = gameState?.currentEraName || '';
                let bgSrc = ERA_BACKGROUNDS[eraName];
                if (!bgSrc && eraName.toLowerCase().includes('covid')) bgSrc = '/eras/covid.png';
                
                if (bgSrc) {
                   return <img src={bgSrc} alt="Era Background" className="w-full h-full object-cover opacity-15" />;
                }
                return <h1 className="text-9xl font-black text-brand-900 whitespace-nowrap tracking-tighter -rotate-12 opacity-5">MARKET MASTERS</h1>;
             })()}
          </div>

          <div className="z-10 flex flex-col items-center gap-10">
            <motion.div 
              className="text-center soft-panel px-10 py-6 bg-white shadow-2xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-sm font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Current Turn</h2>
              {currentTurnTeam ? (
                <div className="flex flex-col items-center">
                   <div className="text-4xl font-black text-brand-700 drop-shadow-sm">{currentTurnTeam.name}</div>
                   <div className="text-xl font-semibold text-emerald-600 mt-2">${currentTurnTeam.cash.toLocaleString()}</div>
                </div>
              ) : (
                <div className="text-xl font-medium text-[var(--text-tertiary)] italic">Waiting to start...</div>
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
                    className="px-8 py-4 bg-slate-500 text-white rounded-xl font-bold shadow-lg flex items-center gap-3"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                      Assets Frozen - End Turn
                  </motion.button>
                ) : (
                  <motion.button 
                    onClick={handleDrawInvestments} 
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 transition-all flex items-center gap-3"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                      <Box size={24}/> Reveal Investments
                  </motion.button>
                )
              )}
            </div>
          </div>
        </div>

        <div className="col-span-1 row-span-9 grid grid-rows-9">{rightEdge}</div>

        {/* BOTTOM LEFT CORNER (10) */}
        <div className="col-span-1 row-span-1 border-2 border-[var(--border-strong)] bg-rose-50 flex flex-col items-center justify-center relative p-1 text-center">
           <img src="/corners/corner_crash.png" className="w-8 h-8 object-contain mb-1 drop-shadow-sm mix-blend-multiply" />
           <span className="font-pixel text-[4px] text-rose-700 leading-none">ANGEL</span>
           {renderTokens(10)}
        </div>

        <div className="col-span-9 row-span-1 grid grid-cols-9">{bottomEdge}</div>

        {/* BOTTOM RIGHT CORNER - Start (0) */}
        <div className="col-span-1 row-span-1 border-2 border-[var(--border-strong)] bg-emerald-50 flex flex-col items-center justify-center relative p-1 text-center">
           <img src="/corners/corner_start.png" className="w-8 h-8 object-contain mb-1 drop-shadow-sm mix-blend-multiply" />
           <span className="font-pixel text-[5px] text-emerald-700 leading-none">START</span>
           {renderTokens(0)}
        </div>

      </div>

      {/* Special Corner Event Popup */}
      <AnimatePresence>
      {specialEvent && (
        <motion.div 
          className="fixed inset-0 bg-white/70 z-50 flex flex-col items-center justify-center p-10 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
           <motion.div 
             className="soft-panel p-12 max-w-lg text-center flex flex-col items-center gap-6 bg-white"
             initial={{ scale: 0.8, y: 50 }}
             animate={{ scale: 1, y: 0 }}
           >
              <AlertTriangle size={80} className="text-orange-500 drop-shadow-lg animate-pulse" />
              <h2 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">
                {specialEvent === 'ANGEL_INVESTMENT' && "Angel Investment"}
                {specialEvent === 'WHITE_COLLAR_PRISON' && "White Collar Prison"}
                {specialEvent === 'CORPORATE_BUYOUT' && "Corporate Buyout"}
                {specialEvent === 'START_BONUS' && "Pass Start"}
                {specialEvent === 'MARKET_NEWS' && "Market News"}
              </h2>
              <div className="text-xl text-[var(--text-secondary)]">
                {specialEvent === 'WHITE_COLLAR_PRISON' && "You've been caught! You are frozen for your next turn, but immune to negative effects."}
                {specialEvent === 'START_BONUS' && "Direct landing on Start! Extra $200!"}
                
                {specialEvent === 'ANGEL_INVESTMENT' && (
                  <div className="flex flex-col items-center">
                    <span className="block mb-4">Invest 50% of your cash. Heads: Triple it. Tails: Lose it.</span>
                    {!coinTossResult && (
                        <div className="flex gap-4">
                            <button onClick={() => setCoinTossResult('HEADS')} className="px-6 py-2 bg-slate-200 text-slate-800 rounded font-bold hover:bg-slate-300">Heads</button>
                            <button onClick={() => setCoinTossResult('TAILS')} className="px-6 py-2 bg-slate-200 text-slate-800 rounded font-bold hover:bg-slate-300">Tails</button>
                        </div>
                    )}
                    {coinTossResult && (
                        <div className="text-2xl font-black text-brand-600 mt-4">Result: {coinTossResult}</div>
                    )}
                  </div>
                )}

                {specialEvent === 'CORPORATE_BUYOUT' && (
                  <div className="flex flex-col items-center">
                    <span className="block mb-4">Target a team and roll dice. Winner steals $1000.</span>
                    <div className="mt-4">
                        <label className="block text-sm font-bold mb-2">Select Target:</label>
                        <select 
                            className="px-4 py-2 border rounded"
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
                            <button onClick={() => setCoinTossResult('WIN')} className="px-6 py-2 bg-emerald-100 text-emerald-800 rounded font-bold hover:bg-emerald-200">{currentTurnTeam?.name} Wins</button>
                            <button onClick={() => setCoinTossResult('LOSS')} className="px-6 py-2 bg-rose-100 text-rose-800 rounded font-bold hover:bg-rose-200">Target Wins</button>
                        </div>
                    )}
                    {coinTossResult && (
                        <div className="mt-4 text-2xl font-black text-brand-600">Winner: {coinTossResult === 'WIN' ? currentTurnTeam?.name : 'Target'}</div>
                    )}
                  </div>
                )}
                {specialEvent === 'MARKET_NEWS' && marketNewsCard ? (
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-brand-900 block mb-2">{marketNewsCard.title}</span>
                    <span>{marketNewsCard.description}</span>
                    
                    {marketNewsCard.type === 'TARGET_OPPONENT' && (
                        <div className="mt-4">
                            <label className="block text-sm font-bold mb-2">Select Target:</label>
                            <select 
                                className="px-4 py-2 border rounded"
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
                            <button onClick={() => setCoinTossResult('WIN')} className="px-6 py-2 bg-emerald-100 text-emerald-800 rounded font-bold hover:bg-emerald-200">{currentTurnTeam.name} Wins</button>
                            <button onClick={() => setCoinTossResult('LOSS')} className="px-6 py-2 bg-rose-100 text-rose-800 rounded font-bold hover:bg-rose-200">Target Wins</button>
                        </div>
                    )}
                    {marketNewsCard.effect === 'HOSTILE_BID' && coinTossResult && (
                        <div className="mt-4 text-2xl font-black text-brand-600">Winner: {coinTossResult === 'WIN' ? currentTurnTeam.name : 'Target'}</div>
                    )}

                    {marketNewsCard.type === 'COIN_TOSS' && !coinTossResult && (
                        <div className="mt-4 flex gap-4">
                            <button onClick={() => setCoinTossResult('HEADS')} className="px-6 py-2 bg-slate-200 text-slate-800 rounded font-bold hover:bg-slate-300">Heads</button>
                            <button onClick={() => setCoinTossResult('TAILS')} className="px-6 py-2 bg-slate-200 text-slate-800 rounded font-bold hover:bg-slate-300">Tails</button>
                        </div>
                    )}
                    {marketNewsCard.type === 'COIN_TOSS' && coinTossResult && (
                        <div className="mt-4 text-2xl font-black text-brand-600">Result: {coinTossResult}</div>
                    )}

                    {marketNewsCard.value !== undefined && (
                        <span className="block mt-4 font-black text-2xl text-emerald-500">
                          Multiplier: {marketNewsCard.value}x
                        </span>
                    )}
                  </div>
                ) : null}
              </div>
              <button onClick={dismissSpecialEvent} className="mt-6 px-10 py-4 bg-brand-900 text-white font-bold rounded-xl shadow-md hover:bg-brand-800 transition-colors">
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
          className="fixed inset-0 bg-white/80 z-50 flex flex-col items-center justify-center p-10 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.h2 
            className="text-5xl font-black text-[var(--text-primary)] mb-8 tracking-tight flex items-center gap-4 drop-shadow-sm"
            initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          >
            <Sparkles className="text-amber-500" size={40}/> Investment Phase
          </motion.h2>
          
          {selectedCardIdx === null ? (
            <motion.div 
              className="mb-8 text-center"
              initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            >
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">Select an Investment</h3>
              <p className="text-[var(--text-secondary)]">Discuss and click on the company you wish to invest in.</p>
            </motion.div>
          ) : !isBetLocked ? (
            <motion.div 
              className="soft-panel p-10 mb-8 text-center max-w-md w-full bg-white mx-auto"
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            >
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Place Your Bet</h3>
              <p className="text-[var(--text-secondary)] mb-8 text-sm">Enter the amount {currentTurnTeam?.name} wants to risk on {drawnCards[selectedCardIdx].name}.</p>
              <div className="relative mb-8">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] font-bold text-2xl">$</span>
                <input 
                  type="number"
                  className={`w-full bg-[var(--bg-primary)] border-2 border-[var(--border-strong)] rounded-2xl p-5 pl-12 text-[var(--text-primary)] font-black text-3xl focus:outline-none focus:border-brand-500 text-center shadow-inner ${currentTurnTeam?.blindFaith ? 'opacity-70 cursor-not-allowed' : ''}`}
                  placeholder="0"
                  value={currentTurnTeam?.blindFaith ? currentTurnTeam.cash : betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  disabled={!!currentTurnTeam?.blindFaith}
                />
              </div>
              {!!currentTurnTeam?.blindFaith && (
                 <p className="text-amber-600 font-bold mb-4">Blind Faith: You must invest 100% of your cash!</p>
              )}
              <button onClick={lockBet} className="w-full py-5 bg-brand-900 text-white font-bold rounded-xl hover:bg-brand-800 transition-colors shadow-md flex justify-center items-center gap-3 text-lg">
                Confirm Investment <ArrowRight size={24}/>
              </button>
            </motion.div>
          ) : (
             <motion.div 
               className="mb-10 text-2xl font-bold text-brand-900 bg-white px-8 py-3 rounded-full border border-[var(--border-subtle)] shadow-md"
               initial={{ scale: 0.8 }} animate={{ scale: 1 }}
             >
                Locked Bet: <span className="text-emerald-600">${parseInt(betAmount).toLocaleString()}</span>
             </motion.div>
          )}
          
          <div className="flex gap-8 w-full max-w-7xl transition-all duration-700">
            {drawnCards.map((card, idx) => {
              const isSelected = selectedCardIdx === idx;
              const hasSelection = selectedCardIdx !== null;
              
              return (
                <motion.div 
                  key={idx} 
                  onClick={() => !isBetLocked && handleSelectInvestment(card, idx)}
                  className={`flex-1 soft-panel p-10 flex flex-col relative overflow-hidden bg-white
                    ${!isBetLocked ? 'cursor-pointer' : ''}
                    ${hasSelection && isSelected ? 'ring-4 ring-brand-500 z-10 shadow-2xl' : 'shadow-md'}
                    ${hasSelection && !isSelected && isBetLocked ? 'pointer-events-none' : ''}
                  `}
                  animate={{
                    scale: hasSelection ? (isSelected ? 1.05 : 0.95) : 1,
                    opacity: hasSelection ? (isSelected ? 1 : 0.4) : 1,
                    filter: hasSelection && !isSelected ? 'grayscale(100%)' : 'grayscale(0%)',
                    y: 0
                  }}
                  whileHover={
                    !isBetLocked && hasSelection && !isSelected ? { scale: 0.98, opacity: 0.8, filter: 'grayscale(0%)' } :
                    !isBetLocked && !hasSelection ? { y: -8, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" } : {}
                  }
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <div className={`absolute top-0 left-0 w-full h-2 ${isSelected ? 'bg-brand-500' : 'bg-brand-200'}`}></div>
                  <div className="text-xs font-bold uppercase tracking-widest mb-6 px-4 py-2 rounded-lg w-fit bg-brand-50 text-brand-600 border border-[var(--border-subtle)]">
                    Opportunity
                  </div>
                  <h3 className="text-3xl font-black text-[var(--text-primary)] mb-4 leading-tight">{card.name}</h3>
                  <p className="text-[var(--text-secondary)] flex-grow mb-8 text-lg leading-relaxed">
                    {card.description || "Evaluate this asset's market fundamentals for potential returns."}
                  </p>
                  
                  <div className="mt-auto pt-8 border-t border-[var(--border-subtle)] min-h-[180px] flex items-center justify-center bg-[var(--bg-primary)] -mx-10 -mb-10 px-10 rounded-b-xl">
                    {!isSelected && !isBetLocked ? (
                       <span className="text-xl font-medium text-[var(--text-tertiary)] italic pulse-glow rounded-full px-6 py-2 bg-white shadow-sm border border-[var(--border-subtle)] cursor-pointer">Click to Select</span>
                    ) : isSelected ? (
                       !isBetLocked ? (
                          <span className="text-xl font-bold text-brand-500 animate-pulse">Enter bet amount above...</span>
                       ) : (
                          <motion.div 
                            className="flex flex-col items-center gap-3 w-full"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', bounce: 0.5 }}
                          >
                            <div className={`text-6xl font-black tracking-tighter drop-shadow-sm ${card.percentage > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {card.percentage > 0 ? '+' : ''}{card.percentage}%
                            </div>
                            <div className="text-base font-semibold text-[var(--text-secondary)] text-center mt-3 px-4 py-3 bg-white rounded-xl w-full border border-[var(--border-subtle)] shadow-sm">
                              {card.reason}
                            </div>
                            <div className="flex items-center gap-2 text-sm font-bold text-brand-600 mt-4">
                               <CheckCircle2 size={20} className="text-brand-500"/>
                               Locked for {currentTurnTeam?.name}
                            </div>
                          </motion.div>
                       )
                    ) : (
                       <span className="text-3xl font-black text-[var(--text-tertiary)] line-through">HIDDEN</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {selectedCardIdx === null && (
            <motion.button 
              onClick={cancelDraw} 
              className="mt-14 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] uppercase font-bold tracking-widest text-sm transition-all border border-[var(--border-subtle)] px-8 py-4 rounded-xl bg-white hover:bg-[var(--bg-primary)] shadow-sm"
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
