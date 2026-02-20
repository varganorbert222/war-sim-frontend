import { UnitStatus } from './unit-status';
import { UnitMainCategory, UnitSubCategory } from './unit-taxonomy';

export interface Unit {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  heading: number;
  status: UnitStatus;

  // additional fields returned by the backend
  factionId?: number;

  // new backend taxonomy
  mainCategory?: UnitMainCategory;
  subCategory?: UnitSubCategory;

  // legacy backend fields (temporary backward compatibility)
  category?: string;
  type?: string;
}
