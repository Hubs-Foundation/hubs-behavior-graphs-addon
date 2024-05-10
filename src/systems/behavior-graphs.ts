import {
  DefaultLogger,
  Engine,
  getCoreNodeDefinitions,
  getCoreValueTypes,
  GraphJSON,
  IRegistry,
  Logger,
  makeCoreDependencies,
  ManualLifecycleEventEmitter,
  readGraphFromJSON,
  validateGraph,
  validateRegistry,
  writeNodeSpecsToJSON,
} from "@oveddan-behave-graph/core";
import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { EntityID, anyEntityWith, SceneLoader, App } from "hubs";
import { BehaviorGraph } from "../components";
import { AnimationNodes, animationValueDefs } from "../nodes/animation-nodes";
import { ElementNodes } from "../nodes/elements-nodes";
import { EulerNodes, eulerValueDefs } from "../nodes/euler-nodes";
import { MaterialNodes } from "../nodes/material-nodes";
import { MediaNodes } from "../nodes/media-nodes";
import { NetworkingNodes } from "../nodes/networking-nodes";
import { PhysicsNodes } from "../nodes/physics-nodes";
import { PlayerNodes, playerValueDefs } from "../nodes/player-nodes";
import { TimerNodes } from "../nodes/time-nodes";
import { MiscNodes } from "../nodes/misc-nodes";
import { cleanupNodespac } from "../nodes/utils";
import {
  EntityNodes,
  EntityValue as entityValueDefs,
} from "../nodes/entity-nodes";
import {
  Vector3Nodes,
  Vector3Value as vec3ValueDefs,
} from "../nodes/vec3-nodes";

type EngineState = {
  engine: Engine;
  lifecycleEmitter: ManualLifecycleEventEmitter;
};

export let gltf_yup = false;

let registry: IRegistry | null = null;
export function initEngine(app: App, config?: JSON) {
  const coreValues = getCoreValueTypes();
  registry = {
    nodes: {
      ...getCoreNodeDefinitions(coreValues),
      ...EntityNodes,
      ...Vector3Nodes,
      ...EulerNodes,
      ...AnimationNodes,
      ...NetworkingNodes,
      ...PlayerNodes,
      ...MediaNodes,
      ...ElementNodes,
      ...PhysicsNodes,
      ...MaterialNodes,
      ...TimerNodes,
      ...MiscNodes,
    },
    values: {
      ...coreValues,
      ...vec3ValueDefs,
      ...entityValueDefs,
      ...eulerValueDefs,
      ...animationValueDefs,
      ...playerValueDefs,
    },
  };

  const easingNode = registry.nodes["math/easing"] as any;
  easingNode.in.easingMode.choices = easingNode.in.easingMode.options.map(
    (v: any) => ({ text: v, value: v })
  );
  easingNode.in.easingFunction.choices =
    easingNode.in.easingFunction.options.map((v: any) => ({
      text: v,
      value: v,
    }));

  const orders = ["XYZ", "YXZ", "ZXY", "ZYX", "YZX", "XZY"].map((v) => ({
    text: v,
    value: v,
  }));
  const eulerCombineNode = registry.nodes["math/euler/combine"] as any;
  eulerCombineNode.in()[3].choices = orders;
  eulerCombineNode.in()[3].defaultValue = orders[0].value;

  const nodeSpec = cleanupNodespac(
    writeNodeSpecsToJSON({ ...registry, dependencies: {} })
  );
  console.log("registry", registry, nodeSpec);
  console.log(JSON.stringify(nodeSpec, null, 2));
}

const logger = new DefaultLogger();

export const engines = new Map<EntityID, EngineState>();
const behaviorGraphsQuery = defineQuery([BehaviorGraph]);
const behaviorGraphEnterQuery = enterQuery(behaviorGraphsQuery);
const behaviorGraphExitQuery = exitQuery(behaviorGraphsQuery);

export function behaviorGraphSystem(app: App) {
  const world = app.world;
  behaviorGraphEnterQuery(world).forEach(function (eid) {
    if (!registry) {
      throw new Error("Registry not initialized. Halting.");
    }

    const obj = world.eid2obj.get(eid)!;
    const graphJson = obj.userData.behaviorGraph as GraphJSON;

    const lifecycleEmitter = new ManualLifecycleEventEmitter();
    const dependencies = {
      app,
      world,
      rootEntity: eid,
      ...makeCoreDependencies({
        lifecyleEmitter: lifecycleEmitter,
        logger,
      }),
    };

    const graph = readGraphFromJSON({
      graphJson,
      nodes: registry.nodes,
      values: registry.values,
      dependencies,
    });
    graph.name = `Behavior Graph (${eid})`;

    graph.name = `Test ${eid}`;

    console.log("Loaded graph", graph);
    const registryErrors = validateRegistry(registry);
    registryErrors.forEach((e) => {
      console.error("Graph Registry Error", e);
    });
    const graphErrors = validateGraph(graph);
    graphErrors.forEach((e) => {
      console.error("Graph Validation Error", e);
    });

    const engine = new Engine(graph.nodes);
    engines.set(eid, { engine, lifecycleEmitter });

    Logger.verbose("initialize graph");
    engine.executeAllSync();

    if (lifecycleEmitter.startEvent.listenerCount > 0) {
      lifecycleEmitter.startEvent.emit();
    }
  });

  behaviorGraphExitQuery(world).forEach(function (eid) {
    const { engine, lifecycleEmitter } = engines.get(eid)!;
    engine.dispose();
    // TODO probably a noop
    lifecycleEmitter.startEvent.clear();
    lifecycleEmitter.tickEvent.clear();
    lifecycleEmitter.endEvent.clear();

    engines.delete(eid);
    console.log("cleaned up engine", engine);
  });

  behaviorGraphsQuery(world).forEach(function (eid) {
    // Wait for the scene to be completely loaded before start ticking
    const isSceneLoading = anyEntityWith(APP.world, SceneLoader);
    if (!isSceneLoading) {
      const { engine, lifecycleEmitter } = engines.get(eid)!;
      lifecycleEmitter.tickEvent.emit();
      engine.executeAllSync(0.1, 100);
    }
  });
}
