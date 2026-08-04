/**
 * Jest module resolver for the API.
 *
 * The API compiles with `module === NodeNext`, so relative source imports use
 * the ESM `.js`-extension convention (`import { X } from "../x.dto.js"`). tsc
 * maps those to the sibling `.ts` files and the build is fine, but jest's
 * default resolver looks for a literal `.js` file and fails. This resolver
 * retries an unresolvable non-external `.js` request as the sibling `.ts`
 * source, so the whole source tree (including DTO barrels) resolves under
 * jest exactly as tsc compiles it.
 */
module.exports = function resolver(request, options) {
  try {
    return options.defaultResolver(request, options)
  } catch (error) {
    if (!request.includes("node_modules") && request.endsWith(".js")) {
      return options.defaultResolver(request.replace(/\.js$/, ".ts"), options)
    }
    throw error
  }
}
