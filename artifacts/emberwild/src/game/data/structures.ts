export type StructureKind = 'camp' | 'bridge' | 'monolith' | 'shelter';

export type StructureDefinition = {
  id: string;
  name: string;
  kind: StructureKind;
  regionId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export const STRUCTURE_DEFINITIONS: StructureDefinition[] = [
  {
    id: 'field-hearth',
    name: 'Field hearth',
    kind: 'camp',
    regionId: 'emberheart-meadow',
    x: 1300,
    y: 900,
    width: 112,
    height: 96,
  },
  {
    id: 'old-wooden-bridge',
    name: 'Old wooden bridge',
    kind: 'bridge',
    regionId: 'whisper-river',
    x: 600,
    y: 650,
    width: 184,
    height: 88,
  },
  {
    id: 'mosslight-monolith',
    name: 'Mosslight monolith',
    kind: 'monolith',
    regionId: 'sunstone-ridge',
    x: 2100,
    y: 650,
    width: 84,
    height: 116,
  },
  {
    id: 'wayfarer-shelter',
    name: 'Wayfarer shelter',
    kind: 'shelter',
    regionId: 'wayfarer-marsh',
    x: 1880,
    y: 1550,
    width: 150,
    height: 112,
  },
];