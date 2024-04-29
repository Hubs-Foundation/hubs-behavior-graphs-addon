import { GraphJSON, ValueJSON } from "@oveddan-behave-graph/core";
import { addComponent, addEntity, hasComponent } from "bitecs";
import {
  EntityID,
  HubsWorld,
  addMaterialComponent,
  inflateComponents,
  mapMaterials,
  TextureTag,
} from "hubs";
import { Material, Object3D, Texture, sRGBEncoding } from "three";
import { GLTF, GLTFLoaderPlugin } from "three/examples/jsm/loaders/GLTFLoader";
import { BehaviorGraph } from "./components";

export class GLTFMozBehaviorExtension implements GLTFLoaderPlugin {
  name: string;

  constructor(name = "MOZ_behavior") {
    this.name = name;
  }

  // TODO we can probably actually create the behavior graph here but doing it later to keep
  // code localized to one spot for this spike
  afterRoot({ scenes, parser }: GLTF): any {
    const ext = parser.json.extensions?.[this.name];
    if (ext) {
      const deps = [];
      const graph = ext.behaviors[0];
      // TODO we can probably resolve __mhc_link_type in the whole GLTF file in 1 spot, we may also use JSON pointers instead
      for (const node of graph.nodes) {
        if (node.configuration) {
          for (const propName in node.configuration) {
            const value = node.configuration[propName];
            const type = value?.__mhc_link_type;
            if (type && value.index !== undefined) {
              deps.push(
                parser.getDependency(type, value.index).then((loadedDep) => {
                  if (
                    type === "texture" &&
                    !parser.json.textures[value.index].extensions
                      ?.MOZ_texture_rgbe
                  ) {
                    loadedDep.encoding = sRGBEncoding;
                  }
                  // Not associated materials don't get their components resolved in GLTFHubsComponentsExtension as they are not referenced by any object
                  if (
                    type === "material" &&
                    !loadedDep.userData.gltfExtensions
                  ) {
                    loadedDep.userData.gltfExtensions = Object.assign(
                      {},
                      parser.json.materials[value.index].extensions
                    );
                  }
                  value.dep = loadedDep;
                  return loadedDep;
                })
              );
            }
          }
        }
        if (node.parameters) {
          for (const propName in node.parameters) {
            const value = node.parameters[propName].value;
            const type = value?.__mhc_link_type;
            if (type && value.index !== undefined) {
              deps.push(
                parser.getDependency(type, value.index).then((loadedDep) => {
                  if (
                    type === "texture" &&
                    !parser.json.textures[value.index].extensions
                      ?.MOZ_texture_rgbe
                  ) {
                    loadedDep.encoding = sRGBEncoding;
                  }
                  // Not associated materials don't get their components resolved in GLTFHubsComponentsExtension as they are not referenced by any object
                  if (
                    type === "material" &&
                    !loadedDep.userData.gltfExtensions
                  ) {
                    loadedDep.userData.gltfExtensions = Object.assign(
                      {},
                      parser.json.materials[value.index].extensions
                    );
                  }
                  value.dep = loadedDep;
                  return loadedDep;
                })
              );
            }
          }
        }
      }
      if (graph.variables) {
        for (const variable of graph.variables) {
          const value = variable.valueTypeName.initialValue;
          const type = value?.__mhc_link_type;
          if (type && value.index !== undefined) {
            deps.push(
              parser.getDependency(type, value.index).then((loadedDep) => {
                if (
                  type === "texture" &&
                  !parser.json.textures[value.index].extensions
                    ?.MOZ_texture_rgbe
                ) {
                  loadedDep.encoding = sRGBEncoding;
                }
                // Not associated materials don't get their components resolved in GLTFHubsComponentsExtension as they are not referenced by any object
                if (type === "material" && !loadedDep.userData.gltfExtensions) {
                  loadedDep.userData.gltfExtensions = Object.assign(
                    {},
                    parser.json.materials[value.index].extensions
                  );
                }
                value.dep = loadedDep;
                return loadedDep;
              })
            );
          }
        }
      }

      scenes[0].userData.behaviorGraph = graph;
      return Promise.all(deps);
    }
  }
}

// TODO we are doing this in a bunch of different ways. It should all be able to be unified. For BG though this will likely be JSON paths
type MHCLink = {
  __mhc_link_type?: "node" | "material";
  index: number;
  dep: Material;
};
function resolveBGMHCLink(
  world: HubsWorld,
  value: MHCLink,
  idx2eid: Map<number, EntityID>,
  matIdx2eid: Map<number, EntityID>
): ValueJSON {
  const linkType = value?.__mhc_link_type;
  if (linkType) {
    if (linkType === "node") {
      return idx2eid.get(value.index)!;
    } else if (linkType === "material") {
      if (!matIdx2eid.has(value.index)) {
        const mat = value.dep;
        if (!mat.eid) {
          mat.eid = addEntity(world);
          addMaterialComponent(world, mat.eid, mat);

          for (const [_, value] of Object.entries(mat)) {
            if (value && value instanceof Texture) {
              const texEid = value.eid || addEntity(world);
              addTextureComponent(world, texEid, value);
            }
          }

          const components = mat.userData.gltfExtensions?.MOZ_hubs_components;
          if (components)
            inflateComponents(world, mat.eid, components, idx2eid);
        }
        matIdx2eid.set(mat.userData.gltfIndex, mat.eid);
      }
      return matIdx2eid.get(value.index)!;
    } else {
      throw new Error(`${linkType} links not supported`);
    }
  } else {
    return value as any;
  }
}

export function addTextureComponent(
  world: HubsWorld,
  eid: number,
  tex: Texture
) {
  if (hasComponent(world, TextureTag, eid)) {
    return eid;
  }
  addComponent(world, TextureTag, eid);
  world.eid2tex.set(eid, tex);
  tex.eid = eid;
  return eid;
}

export function resolveBG(
  world: HubsWorld,
  model: Object3D,
  rootEid: EntityID,
  idx2eid: Map<number, EntityID>
) {
  const matIdx2eid = new Map<number, number>();

  model.traverse((obj) => {
    const gltfIndex: number | undefined = obj.userData.gltfIndex;

    let eid: number;
    if (obj === model) {
      eid = rootEid;
    } else if (gltfIndex !== undefined && idx2eid.has(gltfIndex)) {
      eid = idx2eid.get(gltfIndex)!;
    } else {
      eid = addEntity(world);
    }

    if (gltfIndex !== undefined) idx2eid.set(gltfIndex, eid);

    const components = obj.userData.gltfExtensions?.MOZ_hubs_components;
    mapMaterials(obj, (mat: Material) => {
      const eid = mat.eid || addEntity(world);
      matIdx2eid.set(mat.userData.gltfIndex, eid);
      for (const [_, value] of Object.entries(mat)) {
        if (value && value instanceof Texture) {
          const texEid = value.eid || addEntity(world);
          addTextureComponent(world, texEid, value);
        }
      }
    });
  });

  if (model.userData.behaviorGraph) {
    const graph = model.userData.behaviorGraph as GraphJSON;
    if (graph.variables) {
      for (const variable of graph.variables) {
        variable.initialValue = resolveBGMHCLink(
          world,
          variable.initialValue as any,
          idx2eid,
          matIdx2eid
        );
      }
    }
    for (const node of graph.nodes!) {
      if (node.configuration) {
        for (const propName in node.configuration) {
          node.configuration[propName] = resolveBGMHCLink(
            world,
            node.configuration[propName] as any,
            idx2eid,
            matIdx2eid
          );
        }
      }
      if (node.parameters) {
        for (const propName in node.parameters) {
          const param = node.parameters[propName];
          if ("value" in param) {
            param.value = resolveBGMHCLink(
              world,
              param.value as any,
              idx2eid,
              matIdx2eid
            );
          }
        }
      }
    }
    addComponent(world, BehaviorGraph, rootEid);
  }
}
