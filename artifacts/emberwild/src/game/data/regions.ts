export type RegionBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type RegionDefinition = {
  id: string;
  name: string;
  subtitle: string;
  bounds: RegionBounds;
  unlockCost: number;
  color: string;
};

export const STARTING_REGION_ID = 'emberheart-meadow';

export const REGION_DEFINITIONS: RegionDefinition[] = [
  {
    id: STARTING_REGION_ID,
    name: 'Emberheart meadow',
    subtitle: 'Your first clearing',
    bounds: { left: 760, top: 520, right: 1840, bottom: 1400 },
    unlockCost: 0,
    color: '#d6c38b',
  },
  {
    id: 'whisper-river',
    name: 'Whisper river',
    subtitle: 'A shaded western trail',
    bounds: { left: 280, top: 500, right: 760, bottom: 1200 },
    unlockCost: 35,
    color: '#bbd0c3',
  },
  {
    id: 'frost-shelf',
    name: 'Frost shelf',
    subtitle: 'Where the air turns silver',
    bounds: { left: 700, top: 100, right: 1700, bottom: 520 },
    unlockCost: 55,
    color: '#c8d9e0',
  },
  {
    id: 'sunstone-ridge',
    name: 'Sunstone ridge',
    subtitle: 'Warm stone above the wilds',
    bounds: { left: 1840, top: 300, right: 2400, bottom: 1200 },
    unlockCost: 75,
    color: '#e6a462',
  },
  {
    id: 'wayfarer-marsh',
    name: 'Wayfarer marsh',
    subtitle: 'A quiet southern refuge',
    bounds: { left: 1200, top: 1400, right: 2400, bottom: 1750 },
    unlockCost: 105,
    color: '#c995a1',
  },
];

export const REGION_DEFINITIONS_BY_ID = new Map(
  REGION_DEFINITIONS.map((region) => [region.id, region]),
);