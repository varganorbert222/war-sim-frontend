export const UNIT_MAIN_CATEGORIES = [
  'AIRPLANE',
  'HELICOPTER',
  'GROUND_UNIT',
  'SHIP',
  'STRUCTURE',
] as const;

export type UnitMainCategory = (typeof UNIT_MAIN_CATEGORIES)[number];

export const UNIT_SUBCATEGORIES = {
  AIRPLANE: [
    'Fighter',
    'Interceptor',
    'Multirole',
    'Strike',
    'Attack',
    'Bomber',
    'AWACS',
    'Tanker',
    'Transport',
    'Trainer',
    'Reconnaissance',
    'UAV',
  ],
  HELICOPTER: [
    'Attack helicopter',
    'Transport helicopter',
    'Utility helicopter',
    'Scout helicopter',
    'Naval helicopter',
  ],
  GROUND_UNIT: [
    'Main Battle Tank',
    'Infantry Fighting Vehicle',
    'Armored Personnel Carrier',
    'Recon vehicle',
    'Self-Propelled Artillery',
    'Towed artillery',
    'MLRS',
    'AAA',
    'SAM Short Range',
    'SAM Medium Range',
    'SAM Long Range',
    'EWR',
    'Command Post',
    'Logistics',
    'Engineer',
    'Infantry',
    'Civilian vehicles',
    'Trains',
  ],
  SHIP: [
    'Aircraft carrier',
    'Helicopter carrier',
    'Destroyer',
    'Frigate',
    'Corvette',
    'Patrol boat',
    'Submarine',
    'Missile boat',
    'Landing craft',
    'Civilian ship',
    'Tanker ship',
    'Cargo ship',
  ],
  STRUCTURE: [
    'Military building',
    'Command bunker',
    'Ammo depot',
    'Fuel depot',
    'Radar tower',
    'Communication tower',
    'Airfield structure',
    'Hangar',
    'Hardened aircraft shelter',
    'Runway object',
    'Bridge',
    'Civilian building',
    'Industrial building',
    'Power plant',
    'Static SAM',
    'Static AAA',
    'Static vehicle',
    'Fortification',
  ],
} as const satisfies Record<UnitMainCategory, readonly string[]>;

type SubcategoryMap = typeof UNIT_SUBCATEGORIES;

export type UnitSubCategory =
  | SubcategoryMap['AIRPLANE'][number]
  | SubcategoryMap['HELICOPTER'][number]
  | SubcategoryMap['GROUND_UNIT'][number]
  | SubcategoryMap['SHIP'][number]
  | SubcategoryMap['STRUCTURE'][number];
