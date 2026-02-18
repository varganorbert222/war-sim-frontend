import { UnitStatus } from './unit-status';

export interface Unit {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  heading: number;
  status: UnitStatus;
}
