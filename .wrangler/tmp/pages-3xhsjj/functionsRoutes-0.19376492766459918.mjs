import { onRequest as __api_himalayas_js_onRequest } from "/Users/ayagul/tc/remotedevelopers.work/functions/api/himalayas.js"

export const routes = [
    {
      routePath: "/api/himalayas",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_himalayas_js_onRequest],
    },
  ]