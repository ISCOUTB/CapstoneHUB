import { createProxyRouteHandlers } from "@/app/api/proxy-route";

const handlers = createProxyRouteHandlers({
  backendPrefix: "/projects",
  isStreamPath: (path) => {
    const last = path[path.length - 1];
    return last === "download" || last === "stream";
  },
  isMultipartUpload: (path) =>
    (path.length === 2 && path[1] === "attachments") ||
    (path.length === 5 &&
      path[1] === "reports" &&
      path[3] === "contents" &&
      path[4] === "files"),
});

export const { GET, POST, PUT, PATCH, DELETE } = handlers;
