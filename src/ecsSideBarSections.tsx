import { defineQuery } from "bitecs";
import { HubsWorld } from "hubs";
import React from "react";
import { Object3D } from "three";
import { BitAnimationAction } from "./components";
import { eid2action } from "./systems/animation-system";

function ActionItem(props: any) {
  const { action, setSelectedObj } = props;
  const displayName = `${action.getClip().name} (AnimationAction)`;
  return (
    <div className="obj-item">
      <div
        className="obj-label"
        onContextMenu={e => {
          e.preventDefault();
          setSelectedObj(action);
        }}
      >
        {displayName}
        {` [${action.eid}]`}
      </div>
    </div>
  );
}

const animationActionsQuery = defineQuery([BitAnimationAction]);
export function actionsSection(world: HubsWorld, setSelectedObj: Object3D): React.JSX.Element {
  const actions = animationActionsQuery(world).map(eid => eid2action.get(eid));
  return <section>{actions.map(a => a && <ActionItem action={a} key={a.eid} setSelectedObj={setSelectedObj} />)}</section>;
}