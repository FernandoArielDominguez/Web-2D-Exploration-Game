export type Vec2 = {
  x: number;
  y: number;
};

export type Rect = Vec2 & {
  width: number;
  height: number;
};

export type Direction = 'up' | 'down' | 'left' | 'right';