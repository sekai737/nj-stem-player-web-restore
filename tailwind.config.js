/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        /* Legacy / home pages */
        sans: ["DM Sans", "system-ui", "sans-serif"],
        /* Figma stem player — one family per licensed face (see typography.css) */
        jersey: ['"Jersey 10"', "sans-serif"],
        swiss721: ["Swiss721Regular", "sans-serif"],
        "swiss721-medium": ["Swiss721Medium", "sans-serif"],
        "swiss721-light": ["Swiss721Light", "sans-serif"],
      },
      colors: {
        stroke: {
          primary: "var(--stroke-primary)",
        },
        surface: {
          primary: "var(--main-container-primary)",
        },
        /* `content` — semantic text colors (avoid `text` key; conflicts with text-* utilities) */
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          inverse: "var(--text-inverse)",
        },
        stem: {
          primary: "var(--stem-container-primary)",
          secondary: "var(--stem-container-secondary)",
          waveform: "var(--stem-waveform-container)",
          solo: "var(--stem-solo-primary)",
          mute: "var(--stem-mute-primary)",
        },
        bg: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
        },
        member: {
          primary: "var(--member-lyric-box-primary)",
          secondary: "var(--member-lyric-box-secondary)",
        },
        language: {
          selected: "var(--language-box-selected-primary)",
          "selected-secondary": "var(--language-box-selected-secondary)",
          pill: "var(--language-options-pill-primary)",
        },
        slider: {
          primary: "var(--slider-primary)",
          secondary: "var(--slider-secondary)",
          circle: "var(--slider-circle-primary)",
        },
        /* Legacy aliases — other pages until migrated */
        "nj-pink": "#ff6eb4",
        "nj-pink-dark": "#e84d9a",
        "nj-ink": "var(--text-primary)",
        "nj-muted": "var(--text-secondary)",
        "nj-cream": "#fff8f2",
        "nj-solo": "var(--stem-solo-primary)",
        "nj-mute": "var(--stem-mute-primary)",
      },
      spacing: {
        "sp-2": "var(--spacing-sp-2)",
        "sp-4": "var(--spacing-sp-4)",
        "sp-8": "var(--spacing-sp-8)",
        "sp-16": "var(--spacing-sp-16)",
        "sp-24": "var(--spacing-sp-24)",
        "sp-32": "var(--spacing-sp-32)",
        "sp-48": "var(--spacing-sp-48)",
      },
      borderRadius: {
        cr: "var(--radius-cr-16)",
        pill: "95px",
        transport: "50px",
        volume: "24px",
        language: "36px",
        "member-pill": "60px",
        "lang-pill": "25px",
      },
      borderWidth: {
        st: "var(--stroke-st-2)",
        "st-1": "var(--stroke-st-1)",
      },
      boxShadow: {
        "pop-4": "var(--shadow-pop-4)",
        "pop-2": "var(--shadow-pop-2)",
        "nj-card": "0 18px 45px rgba(0, 0, 0, 0.12)",
      },
      backgroundImage: {
        "figma-page": "var(--gradient-page)",
        "figma-stem": "var(--gradient-stem)",
        "figma-member": "var(--gradient-member)",
        "figma-language": "var(--gradient-language-selected)",
      },
      maxWidth: {
        player: "1800px",
      },
    },
  },
  plugins: [],
};
