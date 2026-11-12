import { createProxyRouteHandlers } from "@/app/api/proxy-route";

const handlers = createProxyRouteHandlers({
  backendPrefix: "/guides",
  includeSearch: true,
  isStreamPath: (path) =>
    path.length === 3 && path[0] === "documents" && path[2] === "download",
  isMultipartUpload: (path) =>
    path.length === 3 && path[0] === "documents" && path[2] === "file",
});

export const { GET, POST, PATCH, DELETE } = handlers;
