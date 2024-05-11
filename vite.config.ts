import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/TandemApi": {
        target: "https://nprd-synapxechat.com",
        changeOrigin: true,
      },
    },
  },
});
