import { hasComponent } from "bitecs";
import {
  BodyParams,
  Networked,
  takeOwnership,
  EntityID,
  getBodyFromRigidBody,
  App,
  SystemsE,
  PhysicsSystem,
  Rigidbody,
  NetworkedRigidBody,
} from "hubs";

// TODO: Fix the type conversion.
export function setRigidBody(
  app: App,
  eid: number,
  params: Partial<BodyParams>
) {
  const world = app.world;
  const physicsSystem = app.getSystem(SystemsE.PhysicsSystem) as PhysicsSystem;
  physicsSystem.updateRigidBody(eid, params);
  NetworkedRigidBody.prevType[eid] = Rigidbody.type[eid];
  if (hasComponent(world, Networked, eid)) {
    takeOwnership(world, eid);
  }
}
export function getRigidBody(app: App, eid: EntityID) {
  return getBodyFromRigidBody(eid);
}
