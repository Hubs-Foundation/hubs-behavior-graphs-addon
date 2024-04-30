import { defineQuery } from "bitecs";
import { HubsWorld } from "hubs";
import React from "react";
import { Object3D } from "three";
import { BitAnimationAction, NetworkedMaterial } from "./components";
import { eid2action } from "./systems/animation-system";

function NetworkedMaterialItem(props: any) {
  const { mat, setSelectedObj } = props;
  return (
    <div className="obj-item">
      <div
        className="obj-label"
        onContextMenu={e => {
          e.preventDefault();
          setSelectedObj(mat);
        }}
      >
        {mat}
        {` [${mat.eid}]`}
      </div>
    </div>
  );
}

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

const networkedMaterialQuery = defineQuery([NetworkedMaterial]);
export function networkedMaterialSection(world: HubsWorld, setSelectedObj: Object3D): React.JSX.Element {
  const networkedMaterials = networkedMaterialQuery(world).map(eid => world.eid2mat.get(eid));
  return <section>
    <span>Networked Materials</span>
    {networkedMaterials.map(m => m && <NetworkedMaterialItem mat={m} key={m.eid} setSelectedObj={setSelectedObj} />)}
  </section>;
}
const animationActionsQuery = defineQuery([BitAnimationAction]);
export function actionsSection(world: HubsWorld, setSelectedObj: Object3D): React.JSX.Element {
  const actions = animationActionsQuery(world).map(eid => eid2action.get(eid));
  return <section>
    <span>Networked Animations</span>
    {actions.map(a => a && <ActionItem action={a} key={a.eid} setSelectedObj={setSelectedObj} />)}
  </section>;
}