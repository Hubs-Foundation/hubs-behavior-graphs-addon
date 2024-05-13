# Disclaimer
This add-on is in early Alpha state and continuously evolving so backwards compatibility won't be always a priority. Don't use this in production.

# Hubs Behavior Graphs Add-On
This add-on adds support for Behavior Graphs to [Mozilla Hubs](https://github.com/mozilla/hubs/). As of now add-ons are not yet part of the main Hubs branch, so you'll need to use the Hubs client [add-ons branch](https://github.com/mozilla/hubs/tree/addons) and install this add-on on it.

You will likely want to use the [Behavior Graphs Blender add-on](https://github.com/MozillaReality/blender-gltf-behavior-graph/) to create scenes in Blender with Behavior Graphs support.

## Install
1. Install this add-on:
```
> npm i https://github.com/MozillaReality/hubs-behavior-graphs-addon.git
```
2. Add the add-on to your Hubs client add-ons configuration file.

`addons.json`
```
{
  "addons": [
    ...
    "hubs-behavior-graphs-addon", 
    ...
  ]
}

```
2. Create room in your Hubs instance.
3. Enable the add-on in the room configuration.
