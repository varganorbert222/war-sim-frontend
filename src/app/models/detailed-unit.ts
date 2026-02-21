export interface DetailedUnit {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  position: Position;
  velocity: Velocity;
  directionVector: DirectionVector;
  status: string;
  health: Health;
  faction: FactionInfo;
  vision: Vision;
  weapons: WeaponStatus[];
  ammo: AmmoStatus;
  aiState?: AIState;
  specifications: Record<string, unknown>;
  baseLocation: string;
}

export interface Position {
  latitude: number;
  longitude: number;
  altitude?: number;
  heading: number;
}

export interface Velocity {
  speed: number;
  speedKnots?: number;
  groundSpeed?: number;
  airspeed?: number;
  velocityX: number;
  velocityY: number;
  climbRate?: number;
}

export interface DirectionVector {
  heading: number;
  normalizedX: number;
  normalizedY: number;
  normalizedZ: number;
}

export interface Health {
  current: number;
  maximum: number;
  percentage: number;
  armor: number;
  isDestroyed: boolean;
  isDamaged: boolean;
}

export interface FactionInfo {
  id: number;
  name: string;
  color: string;
  isAlly: boolean;
  isEnemy: boolean;
}

export interface Vision {
  rangeMeters: number;
  detectionRangeMeters: number;
  visibleEnemies: string[];
  visibleAllies: string[];
  hasRadar: boolean;
  radarRangeMeters?: number;
}

export interface WeaponStatus {
  weaponId: string;
  name: string;
  count: number;
  projectileType: string;
  currentAmmo: number;
  maxAmmo: number;
  currentMagazine: number;
  magazineSize: number;
  damage: number;
  rangeMeters: number;
  rateOfFire: number;
  isReloading: boolean;
  canFire: boolean;
}

export interface AmmoStatus {
  totalAmmoPercentage: number;
  totalRoundsRemaining: number;
  isLowAmmo: boolean;
  isOutOfAmmo: boolean;
}

export interface AIState {
  currentState: string;
  lastState?: string;
  timeInState: number;
  currentTarget?: TargetInfo;
  behavior: AIBehavior;
}

export interface TargetInfo {
  unitId: string;
  name: string;
  category: string;
  distance: number;
  heading: number;
  inRange: boolean;
}

export interface AIBehavior {
  unitType: string;
  aggressionLevel: number;
  engageRange: number;
  patrolRadius: number;
}
