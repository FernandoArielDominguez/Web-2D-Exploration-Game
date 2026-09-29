import { RESOURCE_DEFINITIONS } from './resources';

export type ResourceSpawn = {
  id: string;
  definitionId: string;
  regionId: string;
  x: number;
  y: number;
};

export const RESOURCE_SPAWNS: ResourceSpawn[] = [
  { id: 'emberwood-tree', definitionId: 'emberwood-tree', regionId: 'emberheart-meadow', x: 1150, y: 1060 },
  { id: 'sunstone-vein', definitionId: 'sunstone-vein', regionId: 'emberheart-meadow', x: 1460, y: 1030 },
  { id: 'emberwood-tree-heartland-north', definitionId: 'emberwood-tree', regionId: 'emberheart-meadow', x: 1120, y: 760 },
  { id: 'emberwood-tree-heartland-south', definitionId: 'emberwood-tree', regionId: 'emberheart-meadow', x: 1480, y: 1180 },
  { id: 'sunstone-vein-heartland-west', definitionId: 'sunstone-vein', regionId: 'emberheart-meadow', x: 1025, y: 900 },
  { id: 'sunstone-vein-heartland-east', definitionId: 'sunstone-vein', regionId: 'emberheart-meadow', x: 1550, y: 820 },
  { id: 'frost-vein', definitionId: 'frost-vein', regionId: 'frost-shelf', x: 1230, y: 320 },
  { id: 'star-crystal-cluster', definitionId: 'star-crystal-cluster', regionId: 'frost-shelf', x: 1450, y: 400 },
  { id: 'emberwood-tree-west', definitionId: 'emberwood-tree', regionId: 'whisper-river', x: 600, y: 930 },
  { id: 'emberwood-tree-east', definitionId: 'emberwood-tree', regionId: 'sunstone-ridge', x: 2050, y: 1000 },
  { id: 'sunstone-vein-south', definitionId: 'sunstone-vein', regionId: 'wayfarer-marsh', x: 1700, y: 1540 },
  { id: 'frost-vein-north', definitionId: 'frost-vein', regionId: 'frost-shelf', x: 980, y: 280 },
  { id: 'star-crystal-cluster-east', definitionId: 'star-crystal-cluster', regionId: 'sunstone-ridge', x: 2100, y: 700 },
];

export const RESOURCE_DEFINITIONS_BY_ID = new Map(
  RESOURCE_DEFINITIONS.map((definition) => [definition.id, definition]),
);