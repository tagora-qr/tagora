// Expo Metro config — pnpm monorepo desteği ile
// https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1) Expo'nun default watchFolders'ına workspace root'u EKLE (üzerine yazma!)
// expo-doctor: "watchFolders does not contain all entries from Expo's defaults"
config.watchFolders = [...(config.watchFolders ?? []), workspaceRoot];

// 2) node_modules çözümlemesi — yerel + workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
