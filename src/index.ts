import { ADDON_ID } from "./consts";
import {
  App,
  SystemOrderE,
  registerAddon,
  registerECSSidebarSection,
  registerGLTFLinkResolver,
  registerGLTFLoaderPlugin,
} from "hubs";
import { GLTFParser } from "three/examples/jsm/loaders/GLTFLoader";
import { GLTFMozBehaviorExtension, resolveBG } from "./gltf-plugin";
import { behaviorGraphSystem } from "./systems/behavior-graphs";
import { visibilitySystem } from "./systems/visibility-system";
import { materialSystem } from "./systems/material-system";
import { objectMaterialSystem } from "./systems/object-material-system";
import { playersSystem } from "./systems/player-system";
import { animationSystem } from "./systems/animation-system";
import { mediaSystem } from "./systems/media-system";
import { customTagsSystem } from "./systems/custom-tags";
import { inflateCustomTags } from "./inflators/custom-tags";
import { inflateNetworkedAnimation } from "./inflators/networked-animation";
import { inflateNetworkedBehavior } from "./inflators/networked-behavior";
import { inflateNetworkedMaterial } from "./inflators/networked-material";
import { inflateNetworkedObjectMaterial } from "./inflators/networked-object-material";
import { inflateNetworkedObjectProperties } from "./inflators/networked-object-properties";
import { inflateVisible } from "./inflators/visible";
import {
  NetworkedAnimationAction,
  NetworkedBehavior,
  NetworkedMaterial,
  NetworkedObjectMaterial,
  NetworkedVisible,
} from "./components";
import { NetworkedAnimationActionSchema } from "./network-schemas.ts/networked-animation-action";
import { NetworkedBehaviorSchema } from "./network-schemas.ts/networked-behavior";
import { NetworkedMaterialSchema } from "./network-schemas.ts/networked-material";
import { NetworkedObject3DMaterialSchema } from "./network-schemas.ts/networked-object-material";
import { NetworkedVisibleSchema } from "./network-schemas.ts/networked-visible";
import { physicsSystem } from "./systems/physics-system";
import { actionsSection, networkedMaterialSection } from "./ecsSideBarSections";
import { removeSystem } from "./systems/remove-system";

function onReady(app: App, config?: JSON) {
  console.log("Template add-on ready", JSON.stringify(config));
  // TODO remove and use MOZ_behavior until spec is finalized
  registerGLTFLoaderPlugin(
    (parser: GLTFParser) => new GLTFMozBehaviorExtension("KHR_behavior")
  );
  registerGLTFLoaderPlugin(
    (parser: GLTFParser) => new GLTFMozBehaviorExtension()
  );
  registerGLTFLinkResolver(resolveBG);
  registerECSSidebarSection(actionsSection);
  registerECSSidebarSection(networkedMaterialSection);
}

registerAddon(ADDON_ID, {
  name: "Hubs Behavior Graphs Add-on",
  description: "Behavior Graphs add-on for Hubs",
  onReady,
  system: [
    {
      system: customTagsSystem,
      order: SystemOrderE.MatricesUpdate,
    },
    {
      system: physicsSystem,
      order: SystemOrderE.MatricesUpdate,
    },
    {
      system: visibilitySystem,
      order: SystemOrderE.MatricesUpdate,
    },
    {
      system: materialSystem,
      order: SystemOrderE.MatricesUpdate,
    },
    {
      system: objectMaterialSystem,
      order: SystemOrderE.MatricesUpdate,
    },
    {
      system: playersSystem,
      order: SystemOrderE.MatricesUpdate,
    },
    {
      system: animationSystem,
      order: SystemOrderE.MatricesUpdate,
    },
    {
      system: mediaSystem,
      order: SystemOrderE.MatricesUpdate,
    },
    {
      system: behaviorGraphSystem,
      order: SystemOrderE.MatricesUpdate,
    },
    {
      system: removeSystem,
      order: SystemOrderE.MatricesUpdate,
    },
  ],
  inflator: [
    {
      gltf: { id: "customTags", inflator: inflateCustomTags },
    },
    {
      gltf: { id: "networkedAnimation", inflator: inflateNetworkedAnimation },
    },
    {
      gltf: { id: "networkedBehavior", inflator: inflateNetworkedBehavior },
    },
    {
      gltf: { id: "networkedMaterial", inflator: inflateNetworkedMaterial },
    },
    {
      gltf: {
        id: "networkedObjectMaterial",
        inflator: inflateNetworkedObjectMaterial,
      },
    },
    {
      gltf: {
        id: "networkedObjectProperties",
        inflator: inflateNetworkedObjectProperties,
      },
    },
    {
      gltf: { id: "visible", inflator: inflateVisible },
    },
  ],
  networkSchema: [
    {
      component: NetworkedAnimationAction,
      schema: NetworkedAnimationActionSchema,
    },
    {
      component: NetworkedBehavior,
      schema: NetworkedBehaviorSchema,
    },
    {
      component: NetworkedMaterial,
      schema: NetworkedMaterialSchema,
    },
    {
      component: NetworkedObjectMaterial,
      schema: NetworkedObject3DMaterialSchema,
    },
    {
      component: NetworkedVisible,
      schema: NetworkedVisibleSchema,
    },
  ],
});
