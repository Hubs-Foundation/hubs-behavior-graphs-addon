import { defineQuery, hasComponent } from "bitecs";
import { App, Owned } from "hubs";
import { NetworkedVisible, Visible } from "../components";

const networkedVisibleQuery = defineQuery([Visible, NetworkedVisible]);
export function visibilitySystem(app: App) {
  const world = app.world;
  networkedVisibleQuery(world).forEach((eid) => {
    if (!hasComponent(world, Owned, eid)) {
      const obj = world.eid2obj.get(eid)!;
      if (Number(obj.visible) !== NetworkedVisible.visible[eid]) {
        Visible.visible[eid] = NetworkedVisible.visible[eid];
        obj.visible = Boolean(NetworkedVisible.visible[eid]);
      }
    }
  });
}
