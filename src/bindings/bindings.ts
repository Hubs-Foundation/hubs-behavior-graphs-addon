import { ComponentType } from "bitecs";
import { getVideo, setVideo } from "./video";
import { getRigidBody, setRigidBody } from "./rigid-body";
import { getMediaFrame, setMediaFrame } from "./media-frame";
import { getText, setText } from "./text";
import { getVisible, setVisible } from "./visible";
import { getMaterial, setMaterial } from "./material";
import { getObjectMaterial, setObjectMaterial } from "./object-material";
import {
  EntityID,
  MediaVideo,
  TextTag,
  MediaFrame,
  Rigidbody,
  NetworkedTransform,
  camelCase,
  PhysicsShape,
  ComponentDataT,
  App,
} from "hubs";
import {
  NetworkedAnimation,
  NetworkedBehavior,
  Visible,
  NetworkedMaterial,
  NetworkedObjectMaterial,
} from "../components";

type GetFunctionT = (app: App, eid: EntityID) => any;
type SetFunctionT = (app: App, eid: EntityID, params: any) => void;
export type ComponentKeyType = keyof ComponentDataT;
type ComponentBindingType = {
  [K in ComponentKeyType]?: {
    component: ComponentType<any>;
    get?: GetFunctionT;
    set?: SetFunctionT;
  };
};

// This is a temporary place for all the component to get/set props methods to avoid polluting jsx-entity until we find a better home for it
// Ideally we should have a good API to add components in a self contained way. An add-ons API would be the ideal way.
const ComponentBindings = {
  video: {
    component: MediaVideo,
    get: getVideo,
    set: setVideo,
  },
  audio: {
    component: MediaVideo,
    get: getVideo,
    set: setVideo,
  },
  text: {
    component: TextTag,
    get: getText,
    set: setText,
  },
  mediaFrame: {
    component: MediaFrame,
    get: getMediaFrame,
    set: setMediaFrame,
  },
  networkedAnimation: {
    component: NetworkedAnimation,
  },
  rigidbody: {
    component: Rigidbody,
    get: getRigidBody,
    set: setRigidBody,
  },
  physicsShape: {
    component: PhysicsShape,
  },
  networkedTransform: {
    component: NetworkedTransform,
  },
  networkedBehavior: {
    component: NetworkedBehavior,
  },
  visible: {
    component: Visible,
    get: getVisible,
    set: setVisible,
  },
  material: {
    component: NetworkedMaterial,
    get: getMaterial,
    set: setMaterial,
  },
  objectMaterial: {
    component: NetworkedObjectMaterial,
    get: getObjectMaterial,
    set: setObjectMaterial,
  },
} as ComponentBindingType;

export function getComponentBindings(componentName: string) {
  return ComponentBindings[camelCase(componentName) as string]!;
}
