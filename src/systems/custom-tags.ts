import { App } from "hubs";
import { CustomTagsData } from "../inflators/custom-tags";
import { defineQuery, exitQuery } from "bitecs";
import { CustomTags } from "../components";

const customTagsExitQuery = exitQuery(defineQuery([CustomTags]));
export function customTagsSystem(app: App) {
  customTagsExitQuery(app.world).forEach(function (eid) {
    CustomTagsData.delete(eid);
  });
}
