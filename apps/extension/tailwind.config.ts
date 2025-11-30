import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "./popup.html",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
} satisfies Config;
