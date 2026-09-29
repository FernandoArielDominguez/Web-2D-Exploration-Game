const MOVEMENT_KEYS = new Set([
  'w',
  'a',
  's',
  'd',
  'arrowup',
  'arrowleft',
  'arrowdown',
  'arrowright',
]);

export class Input {
  private readonly pressedKeys = new Set<string>();
  private readonly pressedThisFrame = new Set<string>();
  private attached = false;

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    if (MOVEMENT_KEYS.has(key) || key === 'escape') {
      event.preventDefault();
    }

    if (!this.pressedKeys.has(key)) {
      this.pressedThisFrame.add(key);
    }
    this.pressedKeys.add(key);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.key.toLowerCase());
  };

  attach(): void {
    if (this.attached) {
      return;
    }
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.attached = true;
  }

  detach(): void {
    if (!this.attached) {
      return;
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.pressedKeys.clear();
    this.pressedThisFrame.clear();
    this.attached = false;
  }

  isDown(...keys: string[]): boolean {
    return keys.some((key) => this.pressedKeys.has(key.toLowerCase()));
  }

  wasPressed(key: string): boolean {
    return this.pressedThisFrame.has(key.toLowerCase());
  }

  endFrame(): void {
    this.pressedThisFrame.clear();
  }

  getMovement(): { x: number; y: number } {
    return {
      x:
        (this.isDown('d', 'arrowright') ? 1 : 0) -
        (this.isDown('a', 'arrowleft') ? 1 : 0),
      y:
        (this.isDown('s', 'arrowdown') ? 1 : 0) -
        (this.isDown('w', 'arrowup') ? 1 : 0),
    };
  }
}