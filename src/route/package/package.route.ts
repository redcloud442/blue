import { Hono } from "hono";
import {
  packageGetController,
  packagePostController,
  packagesClaimPostController,
  packagesCreatePostController,
  packagesListPostController,
  packagesUpdatePutController,
} from "./package.controller.js";
import {
  packageCreatePostMiddleware,
  packageGetMiddleware,
  packagePostMiddleware,
  packagesClaimPostMiddleware,
  packageUpdatePutMiddleware,
} from "./package.middleware.js";

const packages = new Hono();

packages.post("/", packagePostMiddleware, packagePostController);

packages.get("/", packageGetMiddleware, packageGetController);

packages.put("/:id", packageUpdatePutMiddleware, packagesUpdatePutController);

packages.post("/list", packageGetMiddleware, packagesListPostController);

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

export default packages;
