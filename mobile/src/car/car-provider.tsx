import type { CarIdentity } from "@contract";
import * as SecureStore from "expo-secure-store";
import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { useCars } from "@/api/queries";
import { EmptyState, QueryView } from "@/components/query-view";
import { Screen } from "@/components/screen";
import { keychainKeys } from "@/connection/install";

type CarState = {
  cars: CarIdentity[];
  car: CarIdentity;
  choose: (carId: number) => void;
};

const CarContext = createContext<CarState | null>(null);

export async function rememberCar(carId: number): Promise<void> {
  await SecureStore.setItemAsync(keychainKeys.car, String(carId));
}

export function CarProvider({ children }: { children: ReactNode }) {
  const cars = useCars();
  const [chosen, setChosen] = useState<number | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(keychainKeys.car)
      .then((stored) => setChosen(stored ? Number(stored) : null))
      .catch(() => setChosen(null));
  }, []);

  const choose = (carId: number) => {
    setChosen(carId);
    SecureStore.setItemAsync(keychainKeys.car, String(carId)).catch(() => null);
  };

  if (!cars.data) {
    return (
      <Screen withoutHeader>
        <QueryView query={cars}>{() => null}</QueryView>
      </Screen>
    );
  }
  const list = cars.data.cars;
  const car =
    list.find((entry) => entry.id === chosen) ??
    list.find((entry) => entry.id === cars.data.defaultCarId) ??
    list[0];
  if (!car) {
    return (
      <Screen withoutHeader>
        <EmptyState
          title="No car yet"
          text="TeslaMate shows a car here after you sign in to your Tesla account in TeslaMate."
        />
      </Screen>
    );
  }
  return (
    <CarContext value={{ cars: list, car, choose }}>{children}</CarContext>
  );
}

export function useCar(): CarState {
  const state = use(CarContext);
  if (!state) throw new Error("Wrap the tabs in CarProvider.");
  return state;
}
