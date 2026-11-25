import { createProxyRouteHandlers } from "@/app/api/proxy-route";

const handlers = createProxyRouteHandlers({
  backendPrefix: "/projects",
  isStreamPath: (path) => {
    const last = path[path.length - 1];

    if (last === "download" || last === "stream") {
      return true;
    }

    if (path.length === 2 && path[0] === "export" && path[1] === "excel") {
      return true;
    }

    if (path.length === 3 && path[1] === "export" && path[2] === "pdf") {
      return true;
    }

    return (
      path.length === 4 &&
      path[1] === "export" &&
      path[2] === "milestones" &&
      path[3] === "pdf"
    );
  },
  isMultipartUpload: (path) =>
    (path.length === 2 && path[1] === "attachments") ||
    (path.length === 5 &&
      path[1] === "reports" &&
      path[3] === "contents" &&
      path[4] === "files"),
});

export const { GET, POST, PUT, PATCH, DELETE } = handlers;
