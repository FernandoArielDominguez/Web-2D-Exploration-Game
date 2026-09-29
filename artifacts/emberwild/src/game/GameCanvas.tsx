import { useEffect, useRef } from 'react';

import { Game } from './Game';
import type { GameSnapshot } from './core/EventBus';

type GameCanvasProps = {
  paused?: boolean;
  debug?: boolean;
  gatherRequest?: number;
  unlockRegionRequest?: { regionId: string; requestId: number };
  onSnapshot?: (snapshot: GameSnapshot) => void;
};

export function GameCanvas({
  paused = false,
  debug = false,
  gatherRequest = 0,
  unlockRegionRequest,
  onSnapshot,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const lastGatherRequest = useRef(gatherRequest);
  const lastUnlockRequest = useRef(unlockRegionRequest?.requestId ?? 0);
  const onSnapshotRef = useRef(onSnapshot);
  onSnapshotRef.current = onSnapshot;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const game = new Game();
    gameRef.current = game;
    const unsubscribe = game.events.on('snapshot', (snapshot) => {
      onSnapshotRef.current?.(snapshot);
    });
    const resizeObserver = new ResizeObserver(() => game.resize());

    game.mount(canvas);
    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
      unsubscribe();
      game.unmount();
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    gameRef.current?.setPaused(paused);
  }, [paused]);

  useEffect(() => {
    gameRef.current?.setDebug(debug);
  }, [debug]);

  useEffect(() => {
    if (gatherRequest === lastGatherRequest.current) {
      return;
    }
    lastGatherRequest.current = gatherRequest;
    gameRef.current?.gatherNearbyResource();
  }, [gatherRequest]);

  useEffect(() => {
    if (!unlockRegionRequest || unlockRegionRequest.requestId === lastUnlockRequest.current) {
      return;
    }
    lastUnlockRequest.current = unlockRegionRequest.requestId;
    gameRef.current?.unlockRegion(unlockRegionRequest.regionId);
  }, [unlockRegionRequest]);

  return (
    <canvas
      ref={canvasRef}
      className="world-canvas emberwild-canvas"
      aria-label="Emberwild game world"
      data-testid="canvas-game-world"
    />
  );
}