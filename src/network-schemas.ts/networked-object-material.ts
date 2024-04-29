import {
  EntityID,
  StoredComponent,
  defineNetworkSchema,
  NetworkSchema,
  deserializerWithMigrations,
  MigrationFn,
  write,
  read,
} from "hubs";
import { NetworkedObjectMaterial } from "../components";

const migrations = new Map<number, MigrationFn>();

function apply(eid: EntityID, { version, data }: StoredComponent) {
  if (version !== 1) return false;

  const {
    matNid,
  }: {
    matNid: number;
  } = data;
  write(NetworkedObjectMaterial.matNid, eid, matNid);
  return true;
}

const runtimeSerde = defineNetworkSchema(NetworkedObjectMaterial);
export const NetworkedObject3DMaterialSchema: NetworkSchema = {
  componentName: "networked-object-material",
  serialize: runtimeSerde.serialize,
  deserialize: runtimeSerde.deserialize,
  serializeForStorage: function serializeForStorage(eid: EntityID) {
    return {
      version: 1,
      data: {
        matNid: read(NetworkedObjectMaterial.matNid, eid),
      },
    };
  },
  deserializeFromStorage: deserializerWithMigrations(migrations, apply),
};
