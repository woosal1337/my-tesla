export type Place = {
  key: string;
  name: string;
  road: string;
  houseNumber: string | null;
  city: string;
  latitude: number;
  longitude: number;
  geofence: string | null;
};

export type Geofence = {
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  costPerUnit: number | null;
};

export const geofences: Geofence[] = [
  {
    name: "Home",
    latitude: 33.4205,
    longitude: -111.94,
    radius: 60,
    costPerUnit: 0.14,
  },
  {
    name: "Office",
    latitude: 33.45,
    longitude: -112.0738,
    radius: 80,
    costPerUnit: null,
  },
  {
    name: "Supercharger Scottsdale",
    latitude: 33.503,
    longitude: -111.929,
    radius: 50,
    costPerUnit: 0.42,
  },
  {
    name: "Supercharger Flagstaff",
    latitude: 35.187,
    longitude: -111.661,
    radius: 50,
    costPerUnit: null,
  },
];

export const places: Place[] = [
  {
    key: "home",
    name: "Home",
    road: "South Mill Avenue",
    houseNumber: "700",
    city: "Tempe",
    latitude: 33.4205,
    longitude: -111.94,
    geofence: "Home",
  },
  {
    key: "office",
    name: "Office",
    road: "North Central Avenue",
    houseNumber: "200",
    city: "Phoenix",
    latitude: 33.45,
    longitude: -112.0738,
    geofence: "Office",
  },
  {
    key: "local-sc",
    name: "Supercharger Scottsdale",
    road: "East Camelback Road",
    houseNumber: null,
    city: "Scottsdale",
    latitude: 33.503,
    longitude: -111.929,
    geofence: "Supercharger Scottsdale",
  },
  {
    key: "trip-sc",
    name: "Supercharger Flagstaff",
    road: "South Milton Road",
    houseNumber: null,
    city: "Flagstaff",
    latitude: 35.187,
    longitude: -111.661,
    geofence: "Supercharger Flagstaff",
  },
  {
    key: "hotel",
    name: "Hotel Grand Canyon",
    road: "Arizona State Route 64",
    houseNumber: null,
    city: "Tusayan",
    latitude: 35.973,
    longitude: -112.127,
    geofence: null,
  },
  {
    key: "market",
    name: "Farmers Market",
    road: "West Main Street",
    houseNumber: null,
    city: "Mesa",
    latitude: 33.415,
    longitude: -111.831,
    geofence: null,
  },
  {
    key: "mall",
    name: "Tempe Marketplace",
    road: "East Marketplace Way",
    houseNumber: null,
    city: "Tempe",
    latitude: 33.43,
    longitude: -111.899,
    geofence: null,
  },
  {
    key: "lake",
    name: "Saguaro Lake",
    road: "Bush Highway",
    houseNumber: null,
    city: "Mesa",
    latitude: 33.568,
    longitude: -111.536,
    geofence: null,
  },
  {
    key: "viewpoint",
    name: "South Mountain Lookout",
    road: "Summit Road",
    houseNumber: null,
    city: "Phoenix",
    latitude: 33.339,
    longitude: -112.059,
    geofence: null,
  },
  {
    key: "friends",
    name: "Riverview Park",
    road: "West 8th Street",
    houseNumber: null,
    city: "Mesa",
    latitude: 33.4365,
    longitude: -111.86,
    geofence: null,
  },
];

export const car = {
  fullRangeKm: 446,
  capacityKwh: 60,
  whPerKm: 152,
  newOdometerKm: 1000,
  wearPerKm: 0.0000025,
};

export function placeByKey(key: string): Place {
  const place = places.find((candidate) => candidate.key === key);
  if (!place) throw new Error(`Add the place "${key}" to the demo world.`);
  return place;
}
