import { Json, JsonArray, JsonObject, JsonUtil } from 'json-to-java/bin/utils/json'

export const MATCHER_SCOPED = /\${_([a-zA-Z0-9]*)_}/
export const MATCHER_GLOBAL = /\${__([a-zA-Z0-9]*)__}/

export function insertConstants (
  json: Json,
  matcher: RegExp,
  constants: { [key: string]: any }
): Json {
  if (typeof json === 'string') {
    let match = matcher.exec(json)
    while (match !== null && match.length > 0) {
      if (!(match[1] in constants)) {
        throw new Error(`Error occured while inserting const into json: ${json}`)
      }
      json = json.replace(match[0], constants[match[1]])
      match = matcher.exec(json)
    }
    return json
  } else if (JsonUtil.isJsonArray(json)) {
    return (json as JsonArray).map(subJson => insertConstants(subJson, matcher, constants))
  } else if (JsonUtil.isJsonObject(json)) {
    const result = {} as JsonObject
    Object.keys(json as JsonObject).map(key => {
      result[key] = insertConstants((json as JsonObject)[key], matcher, constants)
    })
    return result
  } else {
    return json
  }
}
