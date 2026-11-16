import type { Ref } from "react";
export type CityPlaceId =
  | "newsroom"
  | "factory"
  | "hall"
  | "market"
  | "station"
  | "harbour"
  | "tram"
  | "bank"
  | "press"
  | "kiosk"
  | "park";
export interface CityView {
  day: number;
  factory: "fire" | "closed" | "open";
  kiosk: "locked" | "building" | "open";
  press: "locked" | "building" | "open";
  tramAd: boolean;
  boatAd: boolean;
  motion: boolean;
  quality: "auto" | "high" | "low";
  dispatch: { id: number; placeId: string } | null;
  publication: number;
  harbour?: "open" | "restricted";
}
export interface CityMarker {
  id: CityPlaceId;
  label: string;
  tone: "news" | "urgent" | "money" | "selected";
}
export interface CityHandle {
  focus: (id: string) => void;
  reset: () => void;
  zoomBy: (factor: number) => void;
  rotate: () => void;
}
export interface CityCanvasProps {
  view: CityView;
  selected: CityPlaceId | null;
  markers: CityMarker[];
  onSelect: (id: CityPlaceId) => void;
  onReady?: () => void;
  onError?: (message: string) => void;
  ref?: Ref<CityHandle>;
}
export interface PlaceDefinition {
  id: CityPlaceId;
  name: string;
  district: string;
  description: string;
  owner: string;
  position: [number, number, number];
}
