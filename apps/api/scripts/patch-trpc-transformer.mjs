import { readFile, writeFile } from "node:fs/promises"

const generatedUrl = new URL("../src/trpc/generated/server.ts", import.meta.url)
let source = await readFile(generatedUrl, "utf8")

if (!source.includes('from "@workspace/shared"')) {
  source = source.replace(
    'import { initTRPC } from "@trpc/server";\n',
    [
      'import { initTRPC } from "@trpc/server";',
      'import { dateTransformer } from "@workspace/shared";',
      "",
    ].join("\n"),
  )
}

source = source.replace(
  "const t = initTRPC.create();",
  [
    "// Keep the generated AppRouter transformer metadata aligned with the",
    "// runtime TRPCModule configuration so clients deserialize Date values.",
    "const t = initTRPC.create({ transformer: dateTransformer });",
  ].join("\n"),
)

if (!source.includes("transformer: dateTransformer")) {
  throw new Error("Could not patch the generated tRPC transformer metadata")
}

await writeFile(generatedUrl, source)
