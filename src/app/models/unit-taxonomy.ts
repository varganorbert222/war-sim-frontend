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
    'AttackHelicopter',
    'TransportHelicopter',
    'UtilityHelicopter',
    'ScoutHelicopter',
    'NavalHelicopter',
  ],
  GROUND_UNIT: [
    'MainBattleTank',
    'InfantryFightingVehicle',
    'ArmoredPersonnelCarrier',
    'ReconVehicle',
    'SelfPropelledArtillery',
    'TowedArtillery',
    'MLRS',
    'AAA',
    'SAMShortRange',
    'SAMMediumRange',
    'SAMLongRange',
    'EWR',
    'CommandPost',
    'Logistics',
    'Engineer',
    'Infantry',
    'CivilianVehicles',
    'Trains',
  ],
  SHIP: [
    'AircraftCarrier',
    'HelicopterCarrier',
    'Destroyer',
    'Frigate',
    'Corvette',
    'PatrolBoat',
    'Submarine',
    'MissileBoat',
    'LandingCraft',
    'CivilianShip',
    'TankerShip',
    'CargoShip',
  ],
  STRUCTURE: [
    'MilitaryBuilding',
    'CommandBunker',
    'AmmoDepot',
    'FuelDepot',
    'RadarTower',
    'CommunicationTower',
    'AirfieldStructure',
    'Hangar',
    'HardenedAircraftShelter',
    'RunwayObject',
    'Bridge',
    'CivilianBuilding',
    'IndustrialBuilding',
    'PowerPlant',
    'StaticSAM',
    'StaticAAA',
    'StaticVehicle',
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
