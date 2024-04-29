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
import { NetworkedVisible } from "../components";

const migrations = new Map<number, MigrationFn>();

function apply(eid: EntityID, { version, data }: StoredComponent) {
  if (version !== 1) return false;

  const { visible }: { visible: boolean } = data;
  write(NetworkedVisible.visible, eid, visible);
  return true;
}

const runtimeSerde = defineNetworkSchema(NetworkedVisible);
export const NetworkedVisibleSchema: NetworkSchema = {
  componentName: "networked-visible",
  serialize: runtimeSerde.serialize,
  deserialize: runtimeSerde.deserialize,
  serializeForStorage: function serializeForStorage(eid: EntityID) {
    return {
      version: 1,
      data: {
        visible: read(NetworkedVisible.visible, eid),
      },
    };
  },
  deserializeFromStorage: deserializerWithMigrations(migrations, apply),
};
