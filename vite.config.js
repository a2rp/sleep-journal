import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    base: "/sleep-journal/",
    build: { sourcemap: false },
    plugins: [react()],
});