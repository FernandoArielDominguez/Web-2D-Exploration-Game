export type GameEventMap = {
  snapshot: GameSnapshot;
};

export type GameSnapshot = {
  fps: number;
  player: {
    x: number;
    y: number;
    state: 'idle' | 'walking';
    direction: 'up' | 'down' | 'left' | 'right';
  };
  camera: {
    x: number;
    y: number;
    zoom: number;
  };
  world: {
    width: number;
    height: number;
    zone: string;
    regions: Array<{
      id: string;
      name: string;
      subtitle: string;
      unlockCost: number;
      unlocked: boolean;
    }>;
  };
  entityCount: number;
  coins: number;
  inventory: Record<string, number>;
  nearbyResource: {
    id: string;
    name: string;
    itemId: string;
    durability: number;
    maxDurability: number;
    distance: number;
  } | null;
  feedback: {
    id: number;
    message: string;
    tone: 'neutral' | 'success' | 'warning' | 'error';
  };
};

type Listener<T> = (payload: T) => void;

export class EventBus<Events extends Record<string, unknown>> {
  private listeners = new Map<keyof Events, Set<Listener<unknown>>>();

  on<Key extends keyof Events>(
    event: Key,
    listener: Listener<Events[Key]>,
  ): () => void {
    const eventListeners = this.listeners.get(event) ?? new Set();
    eventListeners.add(listener as Listener<unknown>);
    this.listeners.set(event, eventListeners);

    return () => {
      eventListeners.delete(listener as Listener<unknown>);
    };
  }

  emit<Key extends keyof Events>(event: Key, payload: Events[Key]): void {
    this.listeners.get(event)?.forEach((listener) => listener(payload));
  }

  clear(): void {
    this.listeners.clear();
  }
}