// React Server Components entry: render a streamed response on the server. Client views that
// read bound values import `useGenUIValue` from `@comp0/genui/rsc/client`.
export { GenUISurface, type GenUISurfaceProps } from "./surface.js";
export { readResponse, type ResponseStream } from "./stream.js";
export { serverCatalog, slotProps } from "./catalog.js";
