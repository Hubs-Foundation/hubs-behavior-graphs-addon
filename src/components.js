import { Types, defineComponent } from "bitecs";
import { $isStringType } from "hubs";

export const NetworkedObjectMaterial = defineComponent({
  matNid: Types.ui8,
});
NetworkedObjectMaterial.matNid[$isStringType] = true;
export const NetworkedMaterial = defineComponent({
  color: Types.ui32,
  mapNid: Types.ui8,
  flags: Types.ui8,
  opacity: Types.f32,
  alphaMapNid: Types.ui8,
  emissive: Types.f32,
  emissiveMapNid: Types.ui8,
  emissiveIntensity: Types.f32,
  roughnessMapNid: Types.ui8,
  roughness: Types.f32,
  metalnessMapNid: Types.ui8,
  metalness: Types.f32,
  lightMapNid: Types.ui8,
  lightMapIntensity: Types.f32,
  aoMapNid: Types.ui8,
  aoMapIntensity: Types.f32,
  normalMapNid: Types.ui8,
  alphaTest: Types.f32,
});
NetworkedMaterial.mapNid[$isStringType] = true;
NetworkedMaterial.alphaMapNid[$isStringType] = true;
NetworkedMaterial.emissiveMapNid[$isStringType] = true;
NetworkedMaterial.roughnessMapNid[$isStringType] = true;
NetworkedMaterial.metalnessMapNid[$isStringType] = true;
NetworkedMaterial.lightMapNid[$isStringType] = true;
NetworkedMaterial.aoMapNid[$isStringType] = true;
NetworkedMaterial.normalMapNid[$isStringType] = true;
export const BehaviorGraph = defineComponent();

export const CustomTags = defineComponent();
export const NetworkedAnimation = defineComponent();
export const NetworkedBehavior = defineComponent({
  timestamp: Types.ui32,
});
export const InteractableObject = defineComponent();
export const Visible = defineComponent({
  visible: Types.ui8,
});
export const NetworkedVisible = defineComponent({
  visible: Types.ui8,
});
export const NetworkedAnimationAction = defineComponent({
  time: Types.f32,
  timeScale: Types.f32,
  weight: Types.f32,
  flags: Types.ui8,
});
export const BitAnimationAction = defineComponent({
  time: Types.f32,
  timeScale: Types.f32,
  weight: Types.f32,
  flags: Types.ui8
});