import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  displayName: "markdowndb",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "(.+)\\.js$": "$1",
  },
  transform: {
    "^.+\\.ts?$": [
      "ts-jest",
      { useESM: true, tsconfig: "<rootDir>/tsconfig.spec.json" },
    ],
  },
};

export default jestConfig;
