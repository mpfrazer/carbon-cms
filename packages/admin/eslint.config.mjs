import nextConfig from "eslint-config-next";

export default [
  ...nextConfig,
  {
    rules: {
      // Async data fetching via useEffect is the standard pattern in this admin UI
      "react-hooks/set-state-in-effect": "off",
    },
  },
  { ignores: [".next/**", "node_modules/**"] },
];
