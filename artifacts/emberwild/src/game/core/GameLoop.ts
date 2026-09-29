export type GameLoopCallbacks = {
  update: (deltaTime: number) => void;
  render: (interpolation: number) => void;
};

export class GameLoop {
  private animationFrame = 0;
  private lastTime = 0;
  private running = false;
  private accumulator = 0;
  private readonly fixedStep = 1 / 60;

  constructor(private readonly callbacks: GameLoopCallbacks) {}

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.lastTime = performance.now();
    this.animationFrame = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animationFrame);
  }

  private readonly tick = (time: number): void => {
    if (!this.running) {
      return;
    }

    const elapsed = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;
    this.accumulator += elapsed;

    while (this.accumulator >= this.fixedStep) {
      this.callbacks.update(this.fixedStep);
      this.accumulator -= this.fixedStep;
    }

    this.callbacks.render(this.accumulator / this.fixedStep);
    this.animationFrame = requestAnimationFrame(this.tick);
  };
}