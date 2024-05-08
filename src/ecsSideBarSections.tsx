import { defineQuery } from "bitecs";
import { HubsWorld } from "hubs";
import React from "react";
import { Object3D } from "three";
import { BitAnimationAction } from "./components";
import { eid2action } from "./systems/animation-system";

function ActionItem(props: any) {
  const { action, setSelectedObj } = props;
  return (
    <div className="obj-item">
      <div
        className="obj-label"
        onContextMenu={e => {
          e.preventDefault();
          setSelectedObj(action);
        }}
      >
        {action.getClip().name}
        {` [${action.eid}]`}
      </div>
    </div>
  );
}

const animationActionsQuery = defineQuery([BitAnimationAction]);
export function actionsSection(world: HubsWorld, setSelectedObj: Object3D): React.JSX.Element {
  const actions = animationActionsQuery(world).map(eid => eid2action.get(eid));
  return actions.length && (<section>
    <span>
      {"Networked Animations"}
    </span>
    {actions.map(a => a && <ActionItem action={a} key={a.eid} setSelectedObj={setSelectedObj} />)}
  </section>) || <></>;
}