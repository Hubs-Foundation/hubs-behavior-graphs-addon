import {
  AsyncNode,
  Engine,
  IGraphApi,
  NodeCategory,
  NodeDescription,
  NodeDescription2,
  Socket,
  SocketsList,
  makeFlowNodeDefinition,
  makeFunctionNodeDefinition,
  makeInNOutFunctionDesc,
} from "@oveddan-behave-graph/core";
import { definitionListToMap } from "./utils";
import { entityExists, hasComponent } from "bitecs";
import {
  HubsWorld,
  EntityID,
  takeSoftOwnership,
  Owned,
  takeOwnership,
  ClientID,
  Networked,
  findChildWithComponent,
} from "hubs";
import { NetworkedBehavior } from "../components";
import { NetworkedBehaviorData } from "../inflators/networked-behavior";

export class TakeSoftOwnership extends AsyncNode {
  public static Description = new NodeDescription2({
    typeName: "networking/takeSoftOwnership",
    category: "Networking",
    label: "Take Soft Ownership",
    factory: (description, graph) => new TakeSoftOwnership(description, graph),
  });

  constructor(description: NodeDescription, graph: IGraphApi) {
    super(
      description,
      graph,
      [new Socket("flow", "flow"), new Socket("entity", "entity")],
      [new Socket("flow", "success"), new Socket("flow", "error")]
    );
  }

  private callPending = false;

  triggered(
    engine: Engine,
    _triggeringSocketName: string,
    finished: () => void
  ) {
    if (this.callPending) {
      return;
    }

    this.callPending = true;

    const world = this.graph.getDependency("world") as HubsWorld;
    const entity = this.readInput("entity") as EntityID;

    takeSoftOwnership(world, entity);
    setTimeout(() => {
      if (!this.callPending) return;
      this.callPending = false;
      if (entityExists(world, entity) && hasComponent(world, Owned, entity)) {
        engine.commitToNewFiber(this, "success");
      } else {
        engine.commitToNewFiber(this, "error");
      }
      finished();
    }, 1000);
  }

  dispose() {
    this.callPending = false;
  }
}

export const NetworkingNodes = definitionListToMap([
  TakeSoftOwnership.Description,
  makeFlowNodeDefinition({
    typeName: "networking/takeOwnership",
    category: "Networking" as any,
    label: "Take Ownership",
    in: () => [
      { key: "flow", valueType: "flow" },
      { key: "entity", valueType: "entity" },
    ],
    initialState: undefined,
    out: { flow: "flow" },
    triggered: ({ read, commit, graph }) => {
      const entity = read("entity") as EntityID;
      const world = graph.getDependency("world") as HubsWorld;
      takeOwnership(world, entity);
      commit("flow");
    },
  }),
  makeInNOutFunctionDesc({
    name: "networking/isMine",
    label: "Is Entity Mine",
    category: "Networking" as NodeCategory,
    in: [{ entity: "entity" }],
    out: [{ result: "boolean" }],
    exec: (entity: EntityID) => {
      return hasComponent(APP.world, Owned, entity);
    },
  }),
  makeInNOutFunctionDesc({
    name: "networking/isOwner",
    label: "Is Entity Owner",
    category: "Networking" as NodeCategory,
    in: [{ player: "player" }, { entity: "entity" }],
    out: [{ result: "boolean" }],
    exec: (player: ClientID, entity: EntityID) => {
      return Networked.owner[entity] === APP.getSid(player);
    },
  }),
  makeInNOutFunctionDesc({
    name: "networking/isOwned",
    label: "Is Entity Owned",
    category: "Networking" as NodeCategory,
    in: [{ entity: "entity" }],
    out: [{ result: "boolean" }],
    exec: (entity: EntityID) => {
      return Networked.owner[entity] !== APP.getSid("reticulum");
    },
  }),
  makeInNOutFunctionDesc({
    name: "networking/getOwner",
    label: "Get Entity Owner",
    category: "Networking" as NodeCategory,
    in: [{ entity: "entity" }],
    out: [{ player: "player" }],
    exec: (entity: EntityID) => {
      const ownerSid = Networked.owner[entity];
      return APP.sid2str.get(ownerSid);
    },
  }),
  makeFlowNodeDefinition({
    typeName: "networkedVariable/set",
    category: "Components" as any,
    label: "Networked Variable Set",
    configuration: {
      variableId: {
        valueType: "number",
      },
      name: {
        valueType: "string",
      },
      valueTypeName: {
        valueType: "string",
      },
      networked: { valueType: "boolean" },
    },
    in: (configuration) => {
      const type = configuration.valueTypeName || "string";
      const name = configuration.name || "prop";

      const sockets: SocketsList = [
        {
          key: "flow",
          valueType: "flow",
        },
        {
          key: "entity",
          valueType: "entity",
        },
        {
          key: "value",
          valueType: type,
          label: name,
        },
      ];

      return sockets;
    },
    initialState: undefined,
    out: { flow: "flow" },
    triggered: ({ read, commit, configuration, graph }) => {
      const name = configuration.name as string;
      const type = configuration.valueTypeName as string;

      if (configuration.networked) {
        const entity = read("entity") as EntityID;
        const value = read("value");
        const data = NetworkedBehaviorData.get(entity) || new Map();
        data.set(name, value);
        NetworkedBehaviorData.set(entity, data);
        NetworkedBehavior.timestamp[entity] = performance.now();

        const world = graph.getDependency<HubsWorld>("world")!;
        const cmpEid = findChildWithComponent(world, NetworkedBehavior, entity);
        if (cmpEid) {
          takeOwnership(world, cmpEid);
        }
      } else {
        const variable = graph.variables[configuration.variableId];
        if (!variable) return;
        variable.set(read("value"));
      }

      commit("flow");
    },
  }),
  makeFunctionNodeDefinition({
    typeName: "networkedVariable/get",
    category: "Components" as any,
    label: "Get",
    configuration: {
      variableId: {
        valueType: "number",
      },
      name: {
        valueType: "string",
      },
      valueTypeName: {
        valueType: "string",
      },
      networked: { valueType: "boolean" },
    },
    in: () => {
      const sockets: SocketsList = [
        {
          key: "entity",
          valueType: "entity",
        },
      ];

      return sockets;
    },
    out: (configuration) => {
      const type = configuration.valueTypeName || "string";
      const name = configuration.name || "prop";

      const result: SocketsList = [
        {
          key: "value",
          valueType: type,
          label: name,
        },
      ];

      return result;
    },
    exec: ({ read, write, configuration, graph }) => {
      const name = configuration.name as string;
      const type = configuration.valueTypeName || "string";

      if (configuration.networked) {
        const entity = read("entity") as EntityID;
        if (NetworkedBehaviorData.has(entity)) {
          const data = NetworkedBehaviorData.get(entity)!;
          if (data.has(name)) {
            write("value", data.get(name));
          }
        }
      } else {
        const variable = graph.variables[configuration.variableId];
        if (!variable) return;
        write("value", variable.get());
      }
    },
  }),
]);
