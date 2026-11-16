import { SymbolView } from "expo-symbols";
import { useIconScale } from "@/theme/use-text-size";
import type { IconName } from "./icons";

export function Icon({
  name,
  color,
  size = 20,
}: {
  name: IconName;
  color: string;
  size?: number;
}) {
  const scale = useIconScale();
  return (
    <SymbolView
      name={name}
      size={size * scale}
      tintColor={color}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
