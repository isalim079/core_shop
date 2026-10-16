import React, { createContext, useContext, useState, type ReactNode } from "react";
import type { ScenarioPreset } from "./scenarioTypes";
import { scenarioPresets, type ScenarioData } from "./scenarios";

// Export all types & fixtures
export * from "./scenarioTypes";
export * from "./auth";
export * from "./organizations";
export * from "./catalog";
export * from "./inventory";
export * from "./contacts";
export * from "./sales";
export * from "./purchases";
export * from "./expenses";
export * from "./reports";
export * from "./settings";
export * from "./scenarios";

// Default global scenario
let currentPreset: ScenarioPreset = "happy";

export function getStaticData(preset: ScenarioPreset = currentPreset): ScenarioData {
  return scenarioPresets[preset] ?? scenarioPresets.happy;
}

export function setStaticPreset(preset: ScenarioPreset) {
  currentPreset = preset;
}

// React Context & Hook for Dynamic Scenario Switching in UI
type StaticDataContextType = {
  scenario: ScenarioData;
  preset: ScenarioPreset;
  setPreset: (preset: ScenarioPreset) => void;
};

const StaticDataContext = createContext<StaticDataContextType>({
  scenario: scenarioPresets.happy,
  preset: "happy",
  setPreset: () => {},
});

export function StaticDataProvider({
  children,
  initialPreset = "happy",
}: {
  children: ReactNode;
  initialPreset?: ScenarioPreset;
}) {
  const [preset, setPresetState] = useState<ScenarioPreset>(initialPreset);

  const setPreset = (newPreset: ScenarioPreset) => {
    setPresetState(newPreset);
    setStaticPreset(newPreset);
  };

  const scenario = scenarioPresets[preset] ?? scenarioPresets.happy;

  return (
    <StaticDataContext.Provider value={{ scenario, preset, setPreset }}>
      {children}
    </StaticDataContext.Provider>
  );
}

export function useStaticData(): StaticDataContextType {
  return useContext(StaticDataContext);
}
