import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { playerEmitters } from "../nodes/player-nodes";
import { EntityID, ClientID, RemoteAvatar, App } from "hubs";
import { BehaviorGraph } from "../components";
import { clientIdForEntity } from "../utils";

const entityIdToClientId = new Map<EntityID, ClientID>();

const behaviorGraphsQuery = defineQuery([BehaviorGraph]);
const behaviorGraphEnterQuery = enterQuery(behaviorGraphsQuery);
const playerQuery = defineQuery([RemoteAvatar]);
const playerJoinedQuery = enterQuery(playerQuery);
const playerLeftQuery = exitQuery(playerQuery);
export function playersSystem(app: App) {
  const world = app.world;
  behaviorGraphEnterQuery(world).forEach((eid) => {
    const playerInfos = APP.componentRegistry["player-info"];
    playerInfos.forEach((playerInfo) => {
      const clientId = clientIdForEntity(world, playerInfo.el.eid);
      entityIdToClientId.set(eid, clientId);
      playerEmitters.onPlayerJoined.emit(clientId);
    });
  });

  playerJoinedQuery(world).forEach((eid) => {
    const clientId = clientIdForEntity(world, eid);
    entityIdToClientId.set(eid, clientId);
    playerEmitters.onPlayerJoined.emit(clientId);
  });

  playerLeftQuery(world).forEach((eid) => {
    const clientId = entityIdToClientId.get(eid);
    if (clientId) {
      playerEmitters.onPlayerLeft.emit(clientId);
      entityIdToClientId.delete(eid);
    }
  });
}
