import { defineConfig } from "vite-plus";

export default defineConfig({
  root: import.meta.dirname,
  base: `${process.env.PAGES_BASE_PATH ?? ""}/`,
});
