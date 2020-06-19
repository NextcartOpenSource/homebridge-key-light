import axios from "axios";
import stw, { Listener, Response, Referrer } from "spread-the-word";
import {
  API,
  APIEvent,
  CharacteristicEventTypes,
  CharacteristicSetCallback,
  CharacteristicValue,
  DynamicPlatformPlugin,
  HAP,
  Logging,
  PlatformAccessory,
  PlatformConfig,
} from "homebridge";
import { KeyLightBody, KeyLightAccessory } from "./types";

const PLUGIN_NAME = "homebridge-key-light";
const PLATFORM_NAME = "key-light";

let hap: HAP;
let Accessory: typeof PlatformAccessory;

export = (api: API) => {
  hap = api.hap;
  Accessory = api.platformAccessory;

  api.registerPlatform(PLATFORM_NAME, KeyLightPlatform);
};

class KeyLightPlatform implements DynamicPlatformPlugin {
  private readonly log: Logging;
  private readonly api: API;
  private readonly accessoriesByUuid: Record<string, KeyLightAccessory> = {};

  private listener?: Listener;

  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.log = log;
    this.api = api;

    this.api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
      stw.listen({ type: "elg" }).then((listener) => {
        listener.on("up", (remoteService, response, referrer) => {
          const name = remoteService.name;
          const { port } = remoteService;
          const { address } = referrer;
          const endpoint = KeyLightPlatform.getEndpoint(address, port);
          this.addAccessory(name, endpoint, response, referrer);
        });
        listener.on("down", (remoteService, _response, referrer) => {
          const { port } = remoteService;
          const { address } = referrer;
          const endpoint = KeyLightPlatform.getEndpoint(address, port);
          this.removeAccessory(endpoint);
        });
      });
    });
  }

  /**
   * Configures accessories with the necessary functions if they don't already exist.
   */
  configureAccessory = (accessory: KeyLightAccessory): void => {
    const { name, endpoint } = accessory.context;
    this.log.info("Discovered %s at %s", name, endpoint);

    const lightBulb = accessory.getService(hap.Service.Lightbulb)!;

    lightBulb
      .getCharacteristic(hap.Characteristic.On)
      .on(CharacteristicEventTypes.GET, this.handleGetOn(accessory).bind(this));

    lightBulb
      .getCharacteristic(hap.Characteristic.On)
      .on(CharacteristicEventTypes.SET, this.handleSetOn(accessory).bind(this));

    lightBulb
      .getCharacteristic(hap.Characteristic.Brightness)
      .on(
        CharacteristicEventTypes.GET,
        this.handleGetBrightness(accessory).bind(this),
      );

    lightBulb
      .getCharacteristic(hap.Characteristic.Brightness)
      .on(
        CharacteristicEventTypes.SET,
        this.handleSetBrightness(accessory).bind(this),
      );

    lightBulb
      .getCharacteristic(hap.Characteristic.ColorTemperature)
      .on(
        CharacteristicEventTypes.GET,
        this.handleGetTemperature(accessory).bind(this),
      );

    lightBulb
      .getCharacteristic(hap.Characteristic.ColorTemperature)
      .on(
        CharacteristicEventTypes.SET,
        this.handleSetTemperature(accessory).bind(this),
      );

    this.accessoriesByUuid[accessory.UUID] = accessory;
  };

  private addAccessory = (
    name: string,
    endpoint: string,
    response: Response,
    referrer: Referrer,
  ): void => {
    const uuid = hap.uuid.generate(endpoint);

    if (this.accessoriesByUuid.hasOwnProperty(uuid)) {
      return;
    }

    const accessory = new Accessory(name, uuid) as KeyLightAccessory;
    accessory.addService(hap.Service.Lightbulb, name);

    accessory.context = {
      endpoint,
      name,
      referrer,
      response,
    };

    this.configureAccessory(accessory);

    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
      accessory,
    ]);
  };

  private removeAccessory = (endpoint: string): void => {
    const uuid = hap.uuid.generate(endpoint);
    this.removeAccessoryByUuid(uuid);
  };

  private removeAccessoryByUuid = (uuid: string): void => {
    const accessory = this.accessoriesByUuid[uuid];

    if (!accessory) {
      return;
    }

    const { name, endpoint } = accessory.context;
    this.log.info("%s (%s) disconnected", name, endpoint);

    delete this.accessoriesByUuid[uuid];

    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
      accessory,
    ]);

    if (this.listener) {
      const { name, referrer, response } = accessory.context;
      this.listener.removeRemoteService(name, response, referrer);
    }
  };

  private handleGetOn = (
    accessory: KeyLightAccessory,
  ): ((callback: CharacteristicSetCallback) => void) => {
    return (callback: CharacteristicSetCallback) => {
      this.getStatus(accessory)
        .then((status) => callback(null, status.lights[0].on === 1))
        .catch((err) => callback(err, undefined));
    };
  };

  private handleSetOn = (
    accessory: KeyLightAccessory,
  ): ((
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ) => void) => {
    return (
      value: CharacteristicValue,
      callback: CharacteristicSetCallback,
    ) => {
      const on = value === true ? 1 : 0;
      const requestBody: KeyLightBody = {
        numberOfLights: 1,
        lights: [
          {
            on,
          },
        ],
      };
      this.sendBody(accessory, requestBody)
        .then(() => {
          callback(undefined, true);
        })
        .catch((err) => {
          callback(err, undefined);
        });
    };
  };

  private handleGetBrightness = (
    accessory: KeyLightAccessory,
  ): ((callback: CharacteristicSetCallback) => void) => {
    return (callback: CharacteristicSetCallback) => {
      this.getStatus(accessory)
        .then((status) => callback(null, status.lights[0].brightness))
        .catch((err) => callback(err, undefined));
    };
  };

  private handleSetBrightness = (
    accessory: KeyLightAccessory,
  ): ((
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ) => void) => {
    return (
      value: CharacteristicValue,
      callback: CharacteristicSetCallback,
    ) => {
      const brightness = value as number;
      const requestBody: KeyLightBody = {
        numberOfLights: 1,
        lights: [
          {
            brightness,
          },
        ],
      };
      this.sendBody(accessory, requestBody)
        .then(() => {
          callback(undefined, true);
        })
        .catch((err) => {
          callback(err, undefined);
        });
    };
  };

  private handleGetTemperature = (
    accessory: KeyLightAccessory,
  ): ((callback: CharacteristicSetCallback) => void) => {
    return (callback: CharacteristicSetCallback) => {
      this.getStatus(accessory)
        .then((status) => callback(null, status.lights[0].temperature))
        .catch((err) => callback(err, undefined));
    };
  };

  private handleSetTemperature = (
    accessory: KeyLightAccessory,
  ): ((
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ) => void) => {
    return (
      value: CharacteristicValue,
      callback: CharacteristicSetCallback,
    ) => {
      const temperature = value as number;
      const requestBody: KeyLightBody = {
        numberOfLights: 1,
        lights: [
          {
            temperature,
          },
        ],
      };
      this.sendBody(accessory, requestBody)
        .then(() => {
          callback(undefined, true);
        })
        .catch((err) => {
          callback(err, undefined);
        });
    };
  };

  /**
   * Gets the status of the given light.
   */
  private getStatus = (accessory: KeyLightAccessory): Promise<KeyLightBody> => {
    const { endpoint } = accessory.context;
    return new Promise((resolve, reject) => {
      axios
        .get<KeyLightBody>(endpoint)
        .then((res) => resolve(res.data))
        .catch((err) => {
          this.removeAccessoryByUuid(accessory.UUID);
          reject(err);
        });
    });
  };

  /**
   * Sends the requestBody to the given accessory or all accessories if linked.
   */
  private sendBody = (
    accessory: KeyLightAccessory,
    requestBody: KeyLightBody,
  ): Promise<void> =>
    new Promise((resolve, reject) => {
      const { endpoint } = accessory.context;

      axios
        .put(endpoint, requestBody)
        .then((_) => resolve())
        .catch((err) => reject(err));
    });

  /**
   * Computes the endpoint for the service.
   */
  private static getEndpoint = (address: string, port: number): string =>
    `http://${address}:${port}/elgato/lights`;
}
