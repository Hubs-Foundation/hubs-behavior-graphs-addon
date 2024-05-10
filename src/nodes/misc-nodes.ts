import { makeFlowNodeDefinition } from "@oveddan-behave-graph/core";
import { definitionListToMap } from "./utils";

export const MiscNodes = definitionListToMap([
  makeFlowNodeDefinition({
    typeName: "hubs/displayMessage",
    category: "Misc" as any,
    label: "Display Notification Message",
    in: { flow: "flow", text: "string" },
    out: { flow: "flow" },
    initialState: undefined,
    triggered: ({ read, commit }) => {
      APP.messageDispatch?.receive({
        type: "script_message",
        msg: read<string>("text"),
      });
      commit("flow");
    },
  }),
]);
