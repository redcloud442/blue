import { Hono } from "hono";

import {
  packageGetController,
  packagePostController,
  packagesClaimPostController,
  packagesCreatePostController,
  packagesGetAdminController,
  packagesListPostController,
  packagesReinvestPostController,
  packagesUpdatePutController,
} from "./package.controller.js";
import {
  packageCreatePostMiddleware,
  packageGetMiddleware,
  packagePostMiddleware,
  packagesClaimPostMiddleware,
  packagesGetListMiddleware,
  packagesReinvestPostMiddleware,
  packageUpdatePutMiddleware,
} from "./package.middleware.js";

const packages = new Hono();

packages.post("/", packagePostMiddleware, packagePostController);

packages.get("/", packageGetMiddleware, packageGetController);

packages.put("/:id", packageUpdatePutMiddleware, packagesUpdatePutController);

packages.post("/list", packageGetMiddleware, packagesListPostController);

packages.get("/list", packagesGetListMiddleware, packagesGetAdminController);

packages.post(
  "/create",
  packageCreatePostMiddleware,
  packagesCreatePostController
);

packages.post(
  "/claim",
  packagesClaimPostMiddleware,
  packagesClaimPostController
);

packages.post(
  "/reinvest",
  packagesReinvestPostMiddleware,
  packagesReinvestPostController
);
export default packages;
