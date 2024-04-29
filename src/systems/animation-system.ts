import {
  defineQuery,
  enterQuery,
  exitQuery,
  hasComponent,
  removeEntity,
} from "bitecs";
import {
  AdditiveAnimationBlendMode,
  LoopOnce,
  NormalAnimationBlendMode,
  AnimationAction,
  LoopRepeat,
} from "three";
import { ANIMATION_FLAGS } from "../nodes/animation-nodes";
import { HubsWorld, EntityID, Networked, Owned, App } from "hubs";
import {
  BehaviorGraph,
  BitAnimationAction,
  NetworkedAnimation,
  NetworkedAnimationAction,
} from "../components";
import { ObjectAnimationActionData } from "../inflators/networked-animation";

export const eid2action = new Map<EntityID, AnimationAction>();

export function action2Component(
  world: HubsWorld,
  eid: EntityID,
  action: AnimationAction
) {
  let flags = 0;
  if (action.clampWhenFinished) flags |= ANIMATION_FLAGS.CLAMP_WHEN_FINISHED;
  if (action.blendMode === AdditiveAnimationBlendMode)
    flags |= ANIMATION_FLAGS.ADDITIVE_BLENDING;
  if (action.loop === LoopRepeat) flags |= ANIMATION_FLAGS.LOOP;
  if (action.isRunning()) flags |= ANIMATION_FLAGS.RUNNING;
  if (action.paused) flags |= ANIMATION_FLAGS.PAUSED;

  BitAnimationAction.flags[eid] = flags;
  BitAnimationAction.time[eid] = action.time;
  BitAnimationAction.timeScale[eid] = action.timeScale;
  BitAnimationAction.weight[eid] = action.weight;

  NetworkedAnimationAction.flags[eid] = flags;
  NetworkedAnimationAction.time[eid] = action.time;
  NetworkedAnimationAction.timeScale[eid] = action.timeScale;
  NetworkedAnimationAction.weight[eid] = action.weight;
}

function component2Action(
  world: HubsWorld,
  eid: EntityID,
  action: AnimationAction
) {
  if (
    BitAnimationAction.timeScale[eid] !==
    NetworkedAnimationAction.timeScale[eid]
  ) {
    BitAnimationAction.timeScale[eid] = NetworkedAnimationAction.timeScale[eid];
    action.timeScale = NetworkedAnimationAction.timeScale[eid];
  }

  if (BitAnimationAction.weight[eid] !== NetworkedAnimationAction.weight[eid]) {
    BitAnimationAction.weight[eid] = NetworkedAnimationAction.weight[eid];
    action.weight = NetworkedAnimationAction.weight[eid];
  }
  if (BitAnimationAction.time[eid] !== NetworkedAnimationAction.time[eid]) {
    BitAnimationAction.time[eid] = NetworkedAnimationAction.time[eid];
    action.time = NetworkedAnimationAction.time[eid];
  }
  if (BitAnimationAction.flags[eid] !== NetworkedAnimationAction.flags[eid]) {
    if (
      (BitAnimationAction.flags[eid] & ANIMATION_FLAGS.CLAMP_WHEN_FINISHED) !==
      (NetworkedAnimationAction.flags[eid] &
        ANIMATION_FLAGS.CLAMP_WHEN_FINISHED)
    ) {
      const clampWhenFinished =
        NetworkedAnimationAction.flags[eid] &
        ANIMATION_FLAGS.CLAMP_WHEN_FINISHED
          ? true
          : false;
      action.clampWhenFinished = clampWhenFinished;
    }
    if (
      (BitAnimationAction.flags[eid] & ANIMATION_FLAGS.LOOP) !==
      (NetworkedAnimationAction.flags[eid] & ANIMATION_FLAGS.LOOP)
    ) {
      const loop =
        NetworkedAnimationAction.flags[eid] & ANIMATION_FLAGS.LOOP
          ? LoopRepeat
          : LoopOnce;
      action.setLoop(loop, Infinity);
    }
    if (
      (BitAnimationAction.flags[eid] & ANIMATION_FLAGS.ADDITIVE_BLENDING) !==
      (NetworkedAnimationAction.flags[eid] & ANIMATION_FLAGS.ADDITIVE_BLENDING)
    ) {
      const blendMode =
        NetworkedAnimationAction.flags[eid] & ANIMATION_FLAGS.ADDITIVE_BLENDING
          ? AdditiveAnimationBlendMode
          : NormalAnimationBlendMode;
      action.blendMode = blendMode;
    }
    if (
      (BitAnimationAction.flags[eid] & ANIMATION_FLAGS.PAUSED) !==
      (NetworkedAnimationAction.flags[eid] & ANIMATION_FLAGS.PAUSED)
    ) {
      const paused =
        NetworkedAnimationAction.flags[eid] & ANIMATION_FLAGS.PAUSED
          ? true
          : false;
      action.paused = paused;
      action.play();
    }
    if (
      (BitAnimationAction.flags[eid] & ANIMATION_FLAGS.RUNNING) !==
      (NetworkedAnimationAction.flags[eid] & ANIMATION_FLAGS.RUNNING)
    ) {
      const running =
        NetworkedAnimationAction.flags[eid] & ANIMATION_FLAGS.RUNNING
          ? true
          : false;
      if (running) {
        if (
          (BitAnimationAction.flags[eid] & ANIMATION_FLAGS.RESET) !==
          (NetworkedAnimationAction.flags[eid] & ANIMATION_FLAGS.RESET)
        ) {
          action.reset();
        }
        const finished =
          NetworkedAnimationAction.flags[eid] & ANIMATION_FLAGS.FINISHED
            ? true
            : false;
        if (!finished) {
          action.play();
        }
      } else {
        action.paused = true;
      }
    }
  }

  BitAnimationAction.flags[eid] = NetworkedAnimationAction.flags[eid];
  BitAnimationAction.timeScale[eid] = NetworkedAnimationAction.timeScale[eid];
  BitAnimationAction.weight[eid] = NetworkedAnimationAction.weight[eid];
  BitAnimationAction.time[eid] = NetworkedAnimationAction.time[eid];
}

const behaviorGraphsQuery = defineQuery([BehaviorGraph]);
const behaviorGraphExitQuery = exitQuery(behaviorGraphsQuery);
const networkedAnimationQuery = defineQuery([NetworkedAnimation]);
const networkedAnimationExitQuery = exitQuery(networkedAnimationQuery);
const networkedAnimationActionQuery = defineQuery([
  Networked,
  NetworkedAnimationAction,
]);
const networkedAnimationActionEnterQuery = enterQuery(
  networkedAnimationActionQuery
);
const networkedAnimationActionExitQuery = exitQuery(
  networkedAnimationActionQuery
);
export function animationSystem(app: App) {
  const world = app.world;
  behaviorGraphExitQuery(world).forEach((eid) => {
    eid2action.clear();
  });
  networkedAnimationExitQuery(world).forEach((eid) => {
    const actionEids = ObjectAnimationActionData.get(eid);
    actionEids?.forEach((actionEid) => removeEntity(world, actionEid));
  });
  networkedAnimationActionExitQuery(world).forEach((eid) => {
    eid2action.delete(eid);
  });
  networkedAnimationActionEnterQuery(world).forEach((eid) => {
    const action = eid2action.get(eid)!;
    action2Component(world, eid, action);
  });
  networkedAnimationActionQuery(world).forEach((eid) => {
    const action = eid2action.get(eid)!;
    if (!hasComponent(world, Owned, eid)) {
      component2Action(world, eid, action);
    } else {
      action2Component(world, eid, action);
    }
  });
}
