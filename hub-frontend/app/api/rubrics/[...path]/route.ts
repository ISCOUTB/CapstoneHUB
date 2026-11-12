import { createProxyRouteHandlers } from "@/app/api/proxy-route";

const handlers = createProxyRouteHandlers({ backendPrefix: "/rubrics" });

export const { GET, POST, PATCH, DELETE } = handlers;
