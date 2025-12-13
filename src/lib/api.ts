import { createRpcClient } from "typesafe-rpc/client";

import type { RpcSchema } from "../../server/rpc/handlers";

export const api = createRpcClient<RpcSchema>(
  import.meta.env.VITE_API_URL || "/rpc"
);
