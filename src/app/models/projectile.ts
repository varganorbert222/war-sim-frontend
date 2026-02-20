export interface Projectile {
  id: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  damage: number;
  ownerUnitId?: string;
  /* type string matches the abstract `Type` property on the backend
   * subclasses ("Bullet","Shell","Missile"). */
  type: string;
}
