import { UnitMainCategory, UnitSubCategory } from './unit-taxonomy';

export interface UnitMovement {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  heading: number;
  speedMps: number;
  status: string;
  factionId: number;
  health: number;
  visionRange: number;
  directionX: number;
  directionY: number;
  ammoPercentage: number;
  category: UnitMainCategory;
  subcategory: UnitSubCategory;
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
