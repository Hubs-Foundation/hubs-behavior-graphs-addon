import { hasComponent } from "bitecs";
import {
  EntityID,
  HubsWorld,
  RemoteAvatar,
  LocalAvatar,
  ClientID,
  App,
} from "hubs";

export function isPlayerEntity(eid: EntityID, world: HubsWorld) {
  return (
    hasComponent(world, RemoteAvatar, eid) ||
    hasComponent(world, LocalAvatar, eid)
  );
}

export function clientIdForEntity(
  world: HubsWorld,
  playerEid: number
): ClientID {
  return world.eid2obj.get(playerEid)!.el!.components["player-info"]
    .playerSessionId;
}

export function isRoomOwner(app: App, clientId: string) {
  const presenceState = app.hubChannel?.presence.state[clientId];
  if (!presenceState) {
    console.warn(`isRoomOwner: Had no presence state for ${clientId}`);
    return false;
  }

  return !!presenceState.metas[0].roles.owner;
}

export function isRoomCreator(app: App, clientId: string) {
  const presenceState = app.hubChannel?.presence.state[clientId];
  if (!presenceState) {
    console.warn(`isRoomCreator: Had no presence state for ${clientId}`);
    return false;
  }

  return !!presenceState.metas[0].roles.isCreator;
}
