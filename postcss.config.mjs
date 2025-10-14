/** @type {import('postcss-load-config').Config} */
export default {
  plugins: {
    "@tailwindcss/postcss": {},   // ← use this (not "tailwindcss")
    autoprefixer: {},
  },
};
