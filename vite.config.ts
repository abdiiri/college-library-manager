import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname for ESM (required by Vercel)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(async ({ mode }) => {
  let componentTaggerPlugin = null;

  // Only import abdiiri-tagger in development (local only)
  if (mode === "development") {
    const { componentTagger } = await import("abdiiri-tagger");
    componentTaggerPlugin = componentTagger();
  }

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },

    plugins: [
      react(),
      componentTaggerPlugin, // only added when mode=development
    ].filter(Boolean),

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },

    build: {
      outDir: "dist",
      sourcemap: true,
    },
  };
});