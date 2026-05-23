const tsConfigPaths = require("tsconfig-paths")

const baseUrl = __dirname

const cleanup = tsConfigPaths.register({
  baseUrl,
  paths: {
    "@/*": ["dist/src/*"],
    "@generated/*": ["dist/generated/*"],
  },
})

process.on("exit", () => {
  cleanup()
})
