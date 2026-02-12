import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/cli.tsx"],
    outDir: "dist",
    splitting: false,
    sourcemap: true,
    clean: true,
    minify: true,
    format: "esm",
    tsconfig: "tsconfig.json",
});
