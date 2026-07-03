import { RPCApiHandler } from "@zenstackhq/server/api";
import { createEventHandler } from "@zenstackhq/server/nuxt";
import { schema } from "../../../zenstack/schema";
import { getUserDb } from "../../lib/zenstack";

const apiHandler = new RPCApiHandler({
  schema,
  queryOptions: {
    slicing: {
      includedModels: ["Project", "ProjectMember"],
    },
  },
});

export default createEventHandler({
  apiHandler,
  getClient: (event) => getUserDb(event),
});
