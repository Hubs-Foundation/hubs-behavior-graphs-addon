import { defineQuery, hasComponent, entityExists } from "bitecs";
import {
  App,
  EntityID,
  Interacted,
  PhysicsSystem,
  Rigidbody,
  SystemsE,
  findAncestorEntity,
} from "hubs";
import { entityEvents } from "../nodes/entity-nodes";
import { isPlayerEntity, clientIdForEntity } from "../utils";

const interactedQuery = defineQuery([Interacted]);
export function physicsSystem(app: App) {
  const world = app.world;
  interactedQuery(world).forEach(function (eid) {
    entityEvents.get(eid)?.emitters.onInteract.emit(eid);
  });

  // TODO allocations
  const collisionCheckEntities = entityEvents.keys();
  // TODO lots of traversal and can probably be simplified a good deal
  for (const eid of collisionCheckEntities) {
    const triggerState = entityEvents.get(eid)!;

    const physicsSystem = app.getSystem(
      SystemsE.PhysicsSystem
    ) as PhysicsSystem;
    if (!hasComponent(world, Rigidbody, eid)) {
      continue;
    }
    const triggerBody = Rigidbody.bodyId[eid];
    if (!physicsSystem.bodyUuidToData.has(triggerBody)) {
      continue;
    }

    for (let entity of triggerState.collidingEntities) {
      if (!entityExists(world, entity)) {
        triggerState.collidingEntities.delete(entity);
      }
    }

    triggerState.collidingEntities.forEach(function (collidingEid) {
      const collidingBody = Rigidbody.bodyId[collidingEid];
      const collisions = physicsSystem.getCollisions(
        collidingBody
      ) as EntityID[];
      if (!collisions.length || !collisions.includes(triggerBody)) {
        triggerState.collidingEntities.delete(collidingEid);
        const playerEid = findAncestorEntity(
          world,
          collidingEid,
          isPlayerEntity
        );
        console.log("firingOnCollisionExit on", eid, "with", collidingEid);
        if (playerEid) {
          triggerState.emitters.onPlayerCollisionExit.emit(
            clientIdForEntity(world, playerEid)
          );
        } else {
          triggerState.emitters.onCollisionExit.emit(collidingEid);
        }
      }
    });

    const collisionBodies = physicsSystem.getCollisions(
      Rigidbody.bodyId[eid]
    ) as number[];
    if (collisionBodies.length) {
      for (let i = 0; i < collisionBodies.length; i++) {
        const collidingEid = physicsSystem.bodyUuidToData.get(
          collisionBodies[i]
        ).object3D.eid as EntityID;
        const playerEid = findAncestorEntity(
          world,
          collidingEid,
          isPlayerEntity
        );
        if (triggerState.collidingEntities.has(collidingEid)) {
          if (playerEid) {
            triggerState.emitters.onPlayerCollisionStay.emit(
              clientIdForEntity(world, playerEid)
            );
          } else {
            triggerState.emitters.onCollisionStay.emit(collidingEid);
          }
        } else {
          triggerState.collidingEntities.add(collidingEid);
          console.log("firingOnCollisionEnter on", eid, "with", collidingEid);
          if (playerEid) {
            triggerState.emitters.onPlayerCollisionEnter.emit(
              clientIdForEntity(world, playerEid)
            );
          } else {
            triggerState.emitters.onCollisionEnter.emit(collidingEid);
          }
        }
      }
    }
  }
}
