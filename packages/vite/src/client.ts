declare module "virtual:van-stack/routes" {
  const routes: readonly import("van-stack").RuntimeRouteDefinition[];
  // biome-ignore lint/style/useExportType: virtual modules expose value exports.
  export { routes };
  export default routes;
}
