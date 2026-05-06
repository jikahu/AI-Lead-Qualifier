import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "proj_lrrhztsdmeevmcvfpmsr",
  runtime: "node",
  logLevel: "log",
  maxDuration: 300,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      factor: 2,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      randomize: true,
    },
  },
  dirs: ["./workflows"],
});
