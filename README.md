# @nextcart/homebridge-key-light

[![npm](https://img.shields.io/npm/v/@nextcart/homebridge-key-light?style=for-the-badge)](https://www.npmjs.com/package/@nextcart/homebridge-key-light)
[![npm](https://img.shields.io/npm/dt/@nextcart/homebridge-key-light?style=for-the-badge)](https://www.npmjs.com/package/@nextcart/homebridge-key-light)
[![GitHub issues](https://img.shields.io/github/issues/NextcartOpenSource/homebridge-key-light?style=for-the-badge)](https://github.com/NextcartOpenSource/homebridge-key-light/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/NextcartOpenSource/homebridge-key-light?style=for-the-badge)](https://github.com/NextcartOpenSource/homebridge-key-light/pulls)
![Elgato Key Light Air](/../screenshots/Key_Light_Air_Box_Shot_01.jpg?raw=true "Elgato Key Light Air Box")


`@nextcart/homebridge-key-light` is a [Homebridge](https://github.com/nfarina/homebridge) plugin to, with zero configuration, discover and control Elgato's Key Light and Key Light Air lights. Power status, brightness and color temperature can be controlled.

## Installation

First of all you need to have [Homebridge](https://github.com/nfarina/homebridge) installed. Refer to the repo for 
instructions.  
Then run the following command to install `@nextcart/homebridge-key-light`

```
sudo npm install -g @nextcart/homebridge-key-light
```

Alternatively, if you are a user of [`homebridge-config-ui-x`](https://github.com/oznu/homebridge-config-ui-x), navigate to the "Plugins" tab and search for "@nextcart/homebridge-key-light".
![homebridge-config-ui-x](/../screenshots/homebridge-config-ui-x.png?raw=true "Homebridge UI")

Then, **add** the platform to your `config.json`:

```json
{
    "platforms": [
        {
            "name": "Key Lights",
            "platform": "key-light"
        },
    ]
}
```
