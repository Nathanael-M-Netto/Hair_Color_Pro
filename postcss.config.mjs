// Tailwind v4 usa exclusivamente o plugin PostCSS @tailwindcss/postcss.
// Não há mais tailwind.config.{js,ts} — toda configuração vive em globals.css via @theme.
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
