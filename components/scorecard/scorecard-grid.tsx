'use client';

import { useEffect, useState, useCallback } from 'react';
import ScorecardRow from './scorecard-row';
import ScoreCell from './score-cell';
import GridScoreCell from './grid-score-cell';
import { useScorecardStore, formatScoreToPar } from '@/stores/scorecard-store';

interface Hole {
  id: string;
  hole_number: number;
  par: number;
  distance: number;
  handicap_index: number;
}

interface Score {
  id: string;
  strokes: number | null;
  putts: number | null;
  fairway_hit: boolean | null;
  green_in_regulation: boolean | null;
  hole: {
    hole_number: number;
    par: number;
  };
}

interface RoundPlayer {
  id: string;
  playing_handicap: number | null;
  gross_score: number | null;
  player: {
    id: string;
    name: string;
  };
  scores: Score[];
}

interface ScorecardGridProps {
  roundId: string;
  holes: Hole[];
  roundPlayers: RoundPlayer[];
  teeSetName?: string;
  isEditable?: boolean;
  gridMode?: boolean;
  onGridModeChange?: (enabled: boolean) => void;
}

type NineView = 'front' | 'back' | 'all';

interface GridFocusedCell {
  playerId: string;
  holeNumber: number;
}

export default function ScorecardGrid({
  roundId,
  holes,
  roundPlayers,
  isEditable = false,
  gridMode = false,
  onGridModeChange,
}: ScorecardGridProps) {
  const {
    initializeScores,
    scores: storeScores,
    getScore,
    updateScore,
    currentHole,
    playerOrder,
    movePlayer,
    getPlayerScoreToPar,
    getPlayerFrontNineToPar,
    getPlayerBackNineToPar,
  } = useScorecardStore();
  const [mobileView, setMobileView] = useState<NineView>('front');
  const [isMobile, setIsMobile] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [gridFocusedCell, setGridFocusedCell] = useState<GridFocusedCell | null>(null);


  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize scores in the store
  useEffect(() => {
    if (!isEditable) return;

    const allScores = roundPlayers.flatMap((rp) =>
      rp.scores.map((score) => ({
        id: score.id,
        roundPlayerId: rp.id,
        holeId: score.hole.hole_number.toString(),
        holeNumber: score.hole.hole_number,
        par: score.hole.par,
        strokes: score.strokes,
        putts: score.putts,
        fairway_hit: score.fairway_hit,
        green_in_regulation: score.green_in_regulation,
      }))
    );

    initializeScores(roundId, allScores);
  }, [roundId, roundPlayers, isEditable, initializeScores]);

  // Split holes into front and back nine
  const frontNine = holes.filter((h) => h.hole_number <= 9).sort((a, b) => a.hole_number - b.hole_number);
  const backNine = holes.filter((h) => h.hole_number > 9).sort((a, b) => a.hole_number - b.hole_number);

  // Calculate totals for par and yards
  const frontParTotal = frontNine.reduce((sum, h) => sum + h.par, 0);
  const backParTotal = backNine.reduce((sum, h) => sum + h.par, 0);
  const totalPar = frontParTotal + backParTotal;

  const frontYardsTotal = frontNine.reduce((sum, h) => sum + h.distance, 0);
  const backYardsTotal = backNine.reduce((sum, h) => sum + h.distance, 0);
  const totalYards = frontYardsTotal + backYardsTotal;

  // Helper to get player's score for a hole
  const getPlayerScore = (player: RoundPlayer, holeNumber: number): number | null => {
    if (isEditable) {
      const storeEntry = getScore(player.id, holeNumber);
      return storeEntry?.current.strokes ?? null;
    }
    // For completed/non-editable rounds, read directly from player.scores
    const score = player.scores?.find((s) => s.hole?.hole_number === holeNumber);
    return score?.strokes ?? null;
  };

  // Calculate player totals
  const getPlayerFrontTotal = (player: RoundPlayer): number | null => {
    const scores = frontNine.map((h) => getPlayerScore(player, h.hole_number));
    if (scores.every((s) => s === null)) return null;
    return scores.reduce((sum: number, s) => sum + (s || 0), 0);
  };

  const getPlayerBackTotal = (player: RoundPlayer): number | null => {
    const scores = backNine.map((h) => getPlayerScore(player, h.hole_number));
    if (scores.every((s) => s === null)) return null;
    return scores.reduce((sum: number, s) => sum + (s || 0), 0);
  };

  const getPlayerGrandTotal = (player: RoundPlayer): number | null => {
    const front = getPlayerFrontTotal(player);
    const back = getPlayerBackTotal(player);
    if (front === null && back === null) return null;
    return (front || 0) + (back || 0);
  };

  // Force re-render when store changes
  const storeScoresKeys = Object.keys(storeScores);

  // Get ordered players based on store's playerOrder
  const orderedPlayers = playerOrder.length > 0
    ? playerOrder
        .map((id) => roundPlayers.find((rp) => rp.id === id))
        .filter((rp): rp is RoundPlayer => rp !== undefined)
    : roundPlayers;

  // Initialize grid focus when entering grid mode
  useEffect(() => {
    if (gridMode && orderedPlayers.length > 0 && !gridFocusedCell) {
      setGridFocusedCell({
        playerId: orderedPlayers[0].id,
        holeNumber: 1,
      });
    }
    if (!gridMode) {
      setGridFocusedCell(null);
    }
  }, [gridMode, orderedPlayers.length]);

  // Grid navigation handler
  const handleGridNavigate = useCallback((direction: 'up' | 'down' | 'left' | 'right' | 'next' | 'prev') => {
    if (!gridFocusedCell || orderedPlayers.length === 0) return;

    const currentPlayerIndex = orderedPlayers.findIndex(p => p.id === gridFocusedCell.playerId);
    if (currentPlayerIndex === -1) return;

    const totalHoles = holes.length;
    let newPlayerIndex = currentPlayerIndex;
    let newHoleNumber = gridFocusedCell.holeNumber;

    switch (direction) {
      case 'up':
        newPlayerIndex = Math.max(0, currentPlayerIndex - 1);
        break;
      case 'down':
        newPlayerIndex = Math.min(orderedPlayers.length - 1, currentPlayerIndex + 1);
        break;
      case 'left':
        newHoleNumber = Math.max(1, gridFocusedCell.holeNumber - 1);
        break;
      case 'right':
        newHoleNumber = Math.min(totalHoles, gridFocusedCell.holeNumber + 1);
        break;
      case 'next':
        // Move to next cell (right, then down to next row)
        if (gridFocusedCell.holeNumber < totalHoles) {
          newHoleNumber = gridFocusedCell.holeNumber + 1;
        } else if (currentPlayerIndex < orderedPlayers.length - 1) {
          newHoleNumber = 1;
          newPlayerIndex = currentPlayerIndex + 1;
        }
        break;
      case 'prev':
        // Move to previous cell (left, then up to previous row)
        if (gridFocusedCell.holeNumber > 1) {
          newHoleNumber = gridFocusedCell.holeNumber - 1;
        } else if (currentPlayerIndex > 0) {
          newHoleNumber = totalHoles;
          newPlayerIndex = currentPlayerIndex - 1;
        }
        break;
    }

    setGridFocusedCell({
      playerId: orderedPlayers[newPlayerIndex].id,
      holeNumber: newHoleNumber,
    });
  }, [gridFocusedCell, orderedPlayers, holes.length]);

  // Handle score change in grid mode
  const handleGridScoreChange = useCallback((playerId: string, holeNumber: number, value: number | null) => {
    updateScore(playerId, holeNumber, value);
  }, [updateScore]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      movePlayer(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Determine which holes to show based on mobile view
  const showFront = !isMobile || mobileView === 'front' || mobileView === 'all';
  const showBack = !isMobile || mobileView === 'back' || mobileView === 'all';

  // Handle swipe gestures for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && mobileView === 'front') {
      setMobileView('back');
    } else if (isRightSwipe && mobileView === 'back') {
      setMobileView('front');
    }
  };

  return (
    <div className="relative">
      {/* Mobile View Toggle */}
      {isMobile && (
        <div className="flex items-center justify-center gap-1 mb-3 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMobileView('front')}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-colors min-h-[44px] ${
              mobileView === 'front'
                ? 'bg-white text-golf-text shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Front 9
          </button>
          <button
            onClick={() => setMobileView('back')}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-colors min-h-[44px] ${
              mobileView === 'back'
                ? 'bg-white text-golf-text shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Back 9
          </button>
          <button
            onClick={() => setMobileView('all')}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-colors min-h-[44px] ${
              mobileView === 'all'
                ? 'bg-white text-golf-text shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All 18
          </button>
        </div>
      )}

      {/* Scorecard Grid */}
      <div
        className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className={isMobile && mobileView !== 'all' ? 'min-w-[400px]' : 'min-w-[800px]'}>
          {/* Hole Numbers Row */}
          <ScorecardRow
            type="hole"
            label="HOLE"
            frontNine={showFront ? frontNine.map((h) => (
              <span
                key={h.hole_number}
                className={`${
                  isEditable && h.hole_number === currentHole
                    ? 'bg-amber-400 text-amber-900 rounded px-1'
                    : ''
                }`}
              >
                {h.hole_number}
              </span>
            )) : undefined}
            frontTotal={showFront ? 'OUT' : undefined}
            backNine={showBack ? backNine.map((h) => (
              <span
                key={h.hole_number}
                className={`${
                  isEditable && h.hole_number === currentHole
                    ? 'bg-amber-400 text-amber-900 rounded px-1'
                    : ''
                }`}
              >
                {h.hole_number}
              </span>
            )) : undefined}
            backTotal={showBack ? 'IN' : undefined}
            grandTotal={showBack || mobileView === 'front' ? 'TOT' : undefined}
            compactMode={isMobile && mobileView !== 'all'}
          />

          {/* Handicap Row */}
          <ScorecardRow
            type="hdcp"
            label="HDCP"
            frontNine={showFront ? frontNine.map((h) => h.handicap_index) : undefined}
            frontTotal={showFront ? '' : undefined}
            backNine={showBack ? backNine.map((h) => h.handicap_index) : undefined}
            backTotal={showBack ? '' : undefined}
            grandTotal={showBack || mobileView === 'front' ? '' : undefined}
            compactMode={isMobile && mobileView !== 'all'}
          />

          {/* Yards Row */}
          <ScorecardRow
            type="yards"
            label="YARDS"
            frontNine={showFront ? frontNine.map((h) => h.distance) : undefined}
            frontTotal={showFront ? frontYardsTotal : undefined}
            backNine={showBack ? backNine.map((h) => h.distance) : undefined}
            backTotal={showBack ? backYardsTotal : undefined}
            grandTotal={showBack ? totalYards : mobileView === 'front' ? frontYardsTotal : undefined}
            compactMode={isMobile && mobileView !== 'all'}
          />

          {/* Par Row */}
          <ScorecardRow
            type="par"
            label="PAR"
            frontNine={showFront ? frontNine.map((h) => h.par) : undefined}
            frontTotal={showFront ? frontParTotal : undefined}
            backNine={showBack ? backNine.map((h) => h.par) : undefined}
            backTotal={showBack ? backParTotal : undefined}
            grandTotal={showBack ? totalPar : mobileView === 'front' ? frontParTotal : undefined}
            compactMode={isMobile && mobileView !== 'all'}
          />

          {/* Player Rows */}
          {orderedPlayers.map((roundPlayer, index) => {
            const frontTotal = getPlayerFrontTotal(roundPlayer);
            const backTotal = getPlayerBackTotal(roundPlayer);
            const grandTotal = getPlayerGrandTotal(roundPlayer);

            // Get running totals vs par for editable mode
            const frontToPar = isEditable ? getPlayerFrontNineToPar(roundPlayer.id) : null;
            const backToPar = isEditable ? getPlayerBackNineToPar(roundPlayer.id) : null;
            const totalToPar = isEditable ? getPlayerScoreToPar(roundPlayer.id) : null;

            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;

            return (
              <div
                key={roundPlayer.id}
                draggable={isEditable && orderedPlayers.length > 1}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  transition-all duration-200
                  ${isDragging ? 'opacity-50 scale-[0.98]' : ''}
                  ${isDragOver ? 'ring-2 ring-primary ring-inset' : ''}
                  ${isEditable && orderedPlayers.length > 1 ? 'cursor-grab active:cursor-grabbing' : ''}
                `}
              >
                <ScorecardRow
                  type="player"
                  label={roundPlayer.player.name}
                  className={index % 2 === 1 ? 'bg-gray-50' : ''}
                compactMode={isMobile && mobileView !== 'all'}
                frontNine={showFront ? frontNine.map((hole) => {
                  const score = getPlayerScore(roundPlayer, hole.hole_number);
                  const isFocused = gridMode &&
                    gridFocusedCell?.playerId === roundPlayer.id &&
                    gridFocusedCell?.holeNumber === hole.hole_number;

                  if (gridMode) {
                    return (
                      <GridScoreCell
                        key={`${roundPlayer.id}-${hole.hole_number}`}
                        value={score}
                        par={hole.par}
                        roundPlayerId={roundPlayer.id}
                        holeNumber={hole.hole_number}
                        isFocused={isFocused}
                        onValueChange={(value) => handleGridScoreChange(roundPlayer.id, hole.hole_number, value)}
                        onNavigate={handleGridNavigate}
                        onFocus={() => setGridFocusedCell({ playerId: roundPlayer.id, holeNumber: hole.hole_number })}
                      />
                    );
                  }

                  return (
                    <ScoreCell
                      key={`${roundPlayer.id}-${hole.hole_number}`}
                      value={score}
                      par={hole.par}
                      isInteractive={isEditable}
                      roundPlayerId={roundPlayer.id}
                      holeNumber={hole.hole_number}
                      playerName={roundPlayer.player.name}
                      isCurrentHole={isEditable && hole.hole_number === currentHole}
                    />
                  );
                }) : undefined}
                frontTotal={showFront ? (
                  isEditable && frontToPar !== null ? (
                    <div className="flex flex-col items-center justify-center leading-none">
                      <span className="font-mono font-bold text-sm text-gray-900">
                        {frontTotal ?? '-'}
                      </span>
                      <span className={`text-xs font-semibold ${
                        frontToPar === 0 ? 'text-gray-500' :
                        frontToPar < 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatScoreToPar(frontToPar)}
                      </span>
                    </div>
                  ) : (
                    <ScoreCell
                      value={frontTotal}
                      par={frontParTotal}
                      isSubtotal
                    />
                  )
                ) : undefined}
                backNine={showBack ? backNine.map((hole) => {
                  const score = getPlayerScore(roundPlayer, hole.hole_number);
                  const isFocused = gridMode &&
                    gridFocusedCell?.playerId === roundPlayer.id &&
                    gridFocusedCell?.holeNumber === hole.hole_number;

                  if (gridMode) {
                    return (
                      <GridScoreCell
                        key={`${roundPlayer.id}-${hole.hole_number}`}
                        value={score}
                        par={hole.par}
                        roundPlayerId={roundPlayer.id}
                        holeNumber={hole.hole_number}
                        isFocused={isFocused}
                        onValueChange={(value) => handleGridScoreChange(roundPlayer.id, hole.hole_number, value)}
                        onNavigate={handleGridNavigate}
                        onFocus={() => setGridFocusedCell({ playerId: roundPlayer.id, holeNumber: hole.hole_number })}
                      />
                    );
                  }

                  return (
                    <ScoreCell
                      key={`${roundPlayer.id}-${hole.hole_number}`}
                      value={score}
                      par={hole.par}
                      isInteractive={isEditable}
                      roundPlayerId={roundPlayer.id}
                      holeNumber={hole.hole_number}
                      playerName={roundPlayer.player.name}
                      isCurrentHole={isEditable && hole.hole_number === currentHole}
                    />
                  );
                }) : undefined}
                backTotal={showBack ? (
                  isEditable && backToPar !== null ? (
                    <div className="flex flex-col items-center justify-center leading-none">
                      <span className="font-mono font-bold text-sm text-gray-900">
                        {backTotal ?? '-'}
                      </span>
                      <span className={`text-xs font-semibold ${
                        backToPar === 0 ? 'text-gray-500' :
                        backToPar < 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatScoreToPar(backToPar)}
                      </span>
                    </div>
                  ) : (
                    <ScoreCell
                      value={backTotal}
                      par={backParTotal}
                      isSubtotal
                    />
                  )
                ) : undefined}
                grandTotal={showBack ? (
                  isEditable && totalToPar !== null ? (
                    <div className="flex flex-col items-center justify-center leading-none">
                      <span className="font-mono font-bold text-base text-gray-900">
                        {grandTotal ?? '-'}
                      </span>
                      <span className={`text-xs font-bold ${
                        totalToPar === 0 ? 'text-gray-600' :
                        totalToPar < 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {formatScoreToPar(totalToPar)}
                      </span>
                    </div>
                  ) : (
                    <ScoreCell
                      value={grandTotal}
                      par={totalPar}
                      isTotal
                    />
                  )
                ) : mobileView === 'front' ? (
                  isEditable && frontToPar !== null ? (
                    <div className="flex flex-col items-center justify-center leading-none">
                      <span className="font-mono font-bold text-sm text-gray-900">
                        {frontTotal ?? '-'}
                      </span>
                      <span className={`text-xs font-semibold ${
                        frontToPar === 0 ? 'text-gray-500' :
                        frontToPar < 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatScoreToPar(frontToPar)}
                      </span>
                    </div>
                  ) : (
                    <ScoreCell
                      value={frontTotal}
                      par={frontParTotal}
                      isSubtotal
                    />
                  )
                ) : undefined}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Swipe Hint for Mobile */}
      {isMobile && mobileView !== 'all' && (
        <p className="text-center text-xs text-gray-400 mt-2">
          Swipe left/right to switch nines
        </p>
      )}
    </div>
  );
}
