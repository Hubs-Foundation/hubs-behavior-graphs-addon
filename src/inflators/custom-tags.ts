import { addComponent } from "bitecs";
import { ComponentDataT, EntityID, HubsWorld } from "hubs";
import { CustomTags } from "../components";

export const CustomTagsData = new Map<EntityID, string[]>();

export type CustomTagParams = { tags: string[] };
export function inflateCustomTags(
  world: HubsWorld,
  eid: EntityID,
  props?: ComponentDataT
): EntityID {
  addComponent(world, CustomTags, eid);
  if (props?.hasOwnProperty("tags")) {
    CustomTagsData.set(eid, props.tags || []);
  }

  return eid;
}
