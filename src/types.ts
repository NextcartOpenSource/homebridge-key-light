import { PlatformAccessory } from "homebridge";
import { Response, Referrer } from "spread-the-word";

export type KeyLightAccessory = Omit<PlatformAccessory, "context"> & {
  context: KeyLightAccessoryContext;
};

export type KeyLightAccessoryContext = {
  endpoint: string;
  name: string;
  referrer: Referrer;
  response: Response;
};

export type KeyLightBody = {
  numberOfLights: 1;
  lights: [
    {
      on?: number;
      brightness?: number;
      temperature?: number;
    },
  ];
};
