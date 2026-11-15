import react from "@vitejs/plugin-react";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        // NestJS backend: node environment, SWC for emitDecoratorMetadata
        plugins: [
          swc.vite({
            module: { type: "es6" },
            jsc: {
              target: "es2022",
              parser: { syntax: "typescript", decorators: true },
              transform: { legacyDecorator: true, decoratorMetadata: true },
            },
          }),
        ],
        test: {
          name: "server",
          environment: "node",
          include: ["server/**/*.test.ts"],
          setupFiles: ["./test/server-setup.ts"],
          restoreMocks: true,
        },
      },
      {
        // React frontend: jsdom + Testing Library
        plugins: [react()],
        resolve: { tsconfigPaths: true },
        test: {
          name: "client",
          environment: "jsdom",
          include: ["src/**/*.test.{ts,tsx}"],
          setupFiles: ["./test/client-setup.ts"],
          restoreMocks: true,
        },
      },
    ],
  },
});
