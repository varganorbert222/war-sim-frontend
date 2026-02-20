import { UnitMainCategory, UnitSubCategory } from './unit-taxonomy';

export interface UnitMovement {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  heading: number;
  speedMps: number;
  status: string;
  factionId: number;

  // new backend taxonomy
  mainCategory?: UnitMainCategory;
  subCategory?: UnitSubCategory;

  // legacy backend fields (temporary backward compatibility)
  category?: string;
  type?: string;
}

export interface ProjectileMovement {
  id: string;
  latitude: number;
  longitude: number;
  heading: number;
  speedMps: number;
  type: string;
  ownerUnitId: string;
}

export interface MovementSnapshot {
  tick: number;
  timestamp: string;
  units: UnitMovement[];
  projectiles: ProjectileMovement[];
}
