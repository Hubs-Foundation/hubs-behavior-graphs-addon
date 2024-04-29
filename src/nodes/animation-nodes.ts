import {
  AsyncNode,
  Engine,
  IGraphApi,
  makeFlowNodeDefinition,
  makeInNOutFunctionDesc,
  NodeDescription,
  NodeDescription2,
  Socket,
  ValueType,
  NodeConfiguration,
} from "@oveddan-behave-graph/core";
import {
  AdditiveAnimationBlendMode,
  AnimationAction,
  AnimationClip,
  LoopOnce,
  LoopRepeat,
  NormalAnimationBlendMode,
} from "three";
import { definitionListToMap } from "./utils";
import { addComponent, addEntity } from "bitecs";
import { action2Component, eid2action } from "../systems/animation-system";
import {
  EntityID,
  HubsWorld,
  setInitialNetworkedData,
  takeOwnership,
  MixerAnimatableData,
  Networked,
} from "hubs";
import { BitAnimationAction, NetworkedAnimationAction } from "../components";
import { ObjectAnimationActionData } from "../inflators/networked-animation";

export const ANIMATION_FLAGS = {
  RUNNING: 1 << 0,
  PAUSED: 1 << 1,
  LOOP: 1 << 2,
  CLAMP_WHEN_FINISHED: 1 << 3,
  ADDITIVE_BLENDING: 1 << 4,
  RESET: 1 << 5,
  FINISHED: 1 << 6,
};

export const animationValueDefs = {
  animationAction: new ValueType(
    "animationAction",
    () => null as any,
    (value: AnimationAction) => value,
    (value: AnimationAction) => value,
    (start: AnimationAction, _end: AnimationAction, _t: number) => start
  ),
};

const createAnimationActionDef = makeFlowNodeDefinition({
  typeName: "animation/createAnimationAction",
  category: "Animation" as any,
  label: "Create AnimationAction",
  in: () => [
    { key: "flow", valueType: "flow" },
    { key: "clipName", valueType: "string" },
    { key: "loop", valueType: "boolean", defaultValue: true },
    { key: "clampWhenFinished", valueType: "boolean", defaultValue: false },
    { key: "weight", valueType: "float", defaultValue: 1 },
    { key: "timeScale", valueType: "float", defaultValue: 1 },
    { key: "additiveBlending", valueType: "boolean", defaultValue: false },
    { key: "entity", valueType: "entity" },
  ],
  initialState: undefined,
  out: { flow: "flow", action: "animationAction" },
  configuration: {
    networked: { valueType: "boolean" },
  },
  triggered: ({ read, write, commit, graph, configuration }) => {
    const clipName = read("clipName") as string;
    const loop = read("loop") as boolean;
    const clampWhenFinished = read("clampWhenFinished") as boolean;
    const weight = read("weight") as number;
    const timeScale = read("timeScale") as number;
    const additiveBlending = read("additiveBlending") as boolean;
    const targetEid = read("entity") as EntityID;

    const rootEid = graph.getDependency<EntityID>("rootEntity")!;
    const world = graph.getDependency<HubsWorld>("world")!;
    const obj = world.eid2obj.get(rootEid)!;
    const targetObj = world.eid2obj.get(targetEid)!;
    const mixer = MixerAnimatableData.get(rootEid)!;

    const blendMode = additiveBlending
      ? AdditiveAnimationBlendMode
      : NormalAnimationBlendMode;
    const action = mixer.clipAction(
      AnimationClip.findByName(obj.animations, clipName),
      targetObj,
      blendMode
    );
    action.setLoop(loop ? LoopRepeat : LoopOnce, Infinity);
    action.clampWhenFinished = clampWhenFinished;
    action.weight = weight;
    action.timeScale = timeScale;

    const actionEid = addEntity(world);

    eid2action.set(actionEid, action);
    if (!ObjectAnimationActionData.has(targetEid)) {
      ObjectAnimationActionData.set(targetEid, new Set());
    }
    const actionEids = ObjectAnimationActionData.get(targetEid);
    const index = actionEids?.size;
    actionEids?.add(actionEid);

    action.eid = actionEid;
    addComponent(world, BitAnimationAction, actionEid);
    if (configuration.networked) {
      addComponent(world, Networked, actionEid);
      const rootNid = APP.getString(Networked.id[targetEid])!;
      setInitialNetworkedData(actionEid, `${rootNid}.action.${index}`, rootNid);
      addComponent(world, NetworkedAnimationAction, actionEid);
      action2Component(world, actionEid, action);
    }

    write("action", actionEid);
    commit("flow");
  },
});

type ActionEventListener = (e: { action: AnimationAction }) => void;
export class PlayAnimationNode extends AsyncNode {
  public static Description = new NodeDescription2({
    typeName: "animation/play",
    otherTypeNames: ["flow/delay"],
    category: "Animation",
    label: "Play Animation",
    configuration: {
      networked: { valueType: "boolean" },
    },
    factory: (description, graph, config) =>
      new PlayAnimationNode(description, graph, config),
  });

  constructor(
    description: NodeDescription,
    graph: IGraphApi,
    config: NodeConfiguration
  ) {
    super(
      description,
      graph,
      [
        new Socket("flow", "flow"), //
        new Socket("animationAction", "action"),
        new Socket("boolean", "reset", true),
      ],
      [
        new Socket("flow", "flow"), //
        new Socket("flow", "finished"),
        new Socket("flow", "loop"),
        new Socket("flow", "stopped"),
      ],
      config
    );
  }

  private state: {
    action?: AnimationAction;
    onLoop?: ActionEventListener;
    onFinished?: ActionEventListener;
    onStop?: ActionEventListener;
  } = {};

  clearState() {
    if (this.state.action) {
      this.state.action
        .getMixer()
        .removeEventListener("finished", this.state.onFinished as any);
      this.state.action
        .getMixer()
        .removeEventListener("loop", this.state.onLoop as any);
      this.state.action
        .getMixer()
        .removeEventListener("hubs_stopped", this.state.onLoop as any);
      this.state = {};
    }
  }

  triggered(
    engine: Engine,
    _triggeringSocketName: string,
    finished: () => void
  ) {
    if (this.state.action) {
      console.warn("already playing", this.state.action);
      this.clearState();
    }

    const actionEid = this.readInput("action") as number;
    const reset = this.readInput("reset") as boolean;

    const action = eid2action.get(actionEid)!;

    this.state.action = action;
    this.state.onFinished = (e: { action: AnimationAction }) => {
      if (e.action != this.state.action) return;

      if (this.configuration.networked) {
        BitAnimationAction.flags[actionEid] |= ANIMATION_FLAGS.FINISHED;
        NetworkedAnimationAction.flags[actionEid] |= ANIMATION_FLAGS.FINISHED;
      }

      console.log("FINISH", e.action.getClip().name, APP.world.time.tick);
      // TODO HACK when transitioning to another animation in this event, even on the same frame, the object seems to reset to its base position momentarily without this
      e.action.enabled = true;

      this.clearState();
      engine.commitToNewFiber(this, "finished");
    };
    this.state.onLoop = (e: { action: AnimationAction }) => {
      if (e.action != this.state.action) return;
      engine.commitToNewFiber(this, "loop");
    };
    this.state.onStop = (e: { action: AnimationAction }) => {
      if (e.action != this.state.action) return;

      if (this.configuration.networked) {
        action2Component(world, this.state.action.eid!, this.state.action);
        BitAnimationAction.flags[actionEid] |= ANIMATION_FLAGS.FINISHED;
        NetworkedAnimationAction.flags[actionEid] |= ANIMATION_FLAGS.FINISHED;
      }

      this.clearState();
      engine.commitToNewFiber(this, "stopped");
    };

    action
      .getMixer()
      .addEventListener("finished", this.state.onFinished as any);
    action.getMixer().addEventListener("loop", this.state.onLoop as any);
    action
      .getMixer()
      .addEventListener("hubs_stopped", this.state.onStop as any);

    if (reset) action.reset();
    action.paused = false;
    action.play();
    console.log("PLAY", action.getClip().name, APP.world.time.tick);

    const world = this.graph.getDependency("world") as HubsWorld;
    if (this.configuration.networked) {
      action2Component(world, actionEid, action);
      if (reset) {
        BitAnimationAction.flags[actionEid] |= ANIMATION_FLAGS.RESET;
        NetworkedAnimationAction.flags[actionEid] |= ANIMATION_FLAGS.RESET;
      } else {
        BitAnimationAction.flags[actionEid] &= ~ANIMATION_FLAGS.RESET;
        NetworkedAnimationAction.flags[actionEid] &= ~ANIMATION_FLAGS.RESET;
      }
      BitAnimationAction.flags[actionEid] &= ~ANIMATION_FLAGS.FINISHED;
      NetworkedAnimationAction.flags[actionEid] &= ~ANIMATION_FLAGS.FINISHED;
      takeOwnership(world, actionEid);
    }

    engine.commitToNewFiber(this, "flow");
    finished();
  }

  // NOTE this does not get called if the AsyncNode has finished()
  dispose() {
    this.clearState();
  }
}

export const AnimationNodes = definitionListToMap([
  createAnimationActionDef,
  PlayAnimationNode.Description,
  makeFlowNodeDefinition({
    typeName: "animation/stop",
    category: "Animation" as any,
    label: "Stop Animation",
    in: () => [
      { key: "flow", valueType: "flow" },
      { key: "action", valueType: "animationAction" },
    ],
    initialState: undefined,
    out: { flow: "flow" },
    configuration: {
      networked: { valueType: "boolean" },
    },
    triggered: ({ read, commit, graph, configuration }) => {
      const actionEid = read("action") as number;

      const action = eid2action.get(actionEid)!;
      action.stop();

      const world = graph.getDependency("world") as HubsWorld;
      if (configuration.networked) {
        action2Component(world, actionEid, action);
        takeOwnership(world, actionEid);
      }

      console.log("STOP", action.getClip().name, APP.world.time.tick);
      action.getMixer().dispatchEvent({ type: "hubs_stopped", action });
      commit("flow");
    },
  }),
  makeFlowNodeDefinition({
    typeName: "animation/crossfadeTo",
    category: "Animation" as any,
    label: "Crossfade To Animation",
    in: () => [
      { key: "flow", valueType: "flow" },
      { key: "action", valueType: "animationAction" },
      { key: "toAction", valueType: "animationAction" },
      { key: "duration", valueType: "float" },
      { key: "warp", valueType: "boolean" },
    ],
    initialState: undefined,
    out: { flow: "flow" },
    configuration: {
      networked: { valueType: "boolean" },
    },
    triggered: ({ read, commit }) => {
      const actionEid = read("action") as number;
      const toActionId = read("toAction") as number;
      const duration = read("duration") as number;
      const warp = read("warp") as boolean;

      const action = eid2action.get(actionEid)!;
      const toAction = eid2action.get(toActionId)!;

      action.crossFadeTo(toAction, duration, warp);

      // TODO Network this node

      commit("flow");
    },
  }),
  makeFlowNodeDefinition({
    typeName: "three/animation/setTimescale",
    category: "Animation" as any,
    label: "Set timeScale",
    in: () => [
      { key: "flow", valueType: "flow" },
      { key: "action", valueType: "animationAction" },
      { key: "timeScale", valueType: "float" },
    ],
    initialState: undefined,
    out: { flow: "flow" },
    configuration: {
      networked: { valueType: "boolean" },
    },
    triggered: ({ read, commit, graph, configuration }) => {
      const actionEid = read("action") as number;
      const timeScale = read("timeScale") as number;

      const action = eid2action.get(actionEid)!;
      action.timeScale = timeScale;

      const world = graph.getDependency("world") as HubsWorld;
      BitAnimationAction.timeScale[actionEid] = timeScale;
      if (configuration.networked) {
        NetworkedAnimationAction.timeScale[actionEid] = timeScale;
        takeOwnership(world, actionEid);
      }

      commit("flow");
    },
  }),
  makeInNOutFunctionDesc({
    name: "animation/isRunning",
    label: "Is Animation Running?",
    category: "Animation" as any,
    in: [{ action: "animationAction" }],
    out: "boolean",
    exec: (action: number) => {
      const _action = eid2action.get(action)!;
      return _action.isRunning();
    },
  }),
]);
