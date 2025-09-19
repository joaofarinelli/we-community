import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Check if we're in a custom domain environment
  const isCustomDomain = !!process.env.VITE_CUSTOM_DOMAIN;
  
  // Only load componentTagger in true local development
  const shouldLoadTagger = mode === 'development' && 
                          !isCustomDomain && 
                          process.env.NODE_ENV !== 'production';

  console.log('Vite Config Debug:', {
    mode,
    isCustomDomain,
    shouldLoadTagger,
    VITE_CUSTOM_DOMAIN: process.env.VITE_CUSTOM_DOMAIN,
    NODE_ENV: process.env.NODE_ENV
  });

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      shouldLoadTagger && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
