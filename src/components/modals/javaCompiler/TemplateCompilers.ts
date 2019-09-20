import { LvgItemLayout, LvgProjectObject } from '@/typings/lvg';
import StringUtils from '@/utils/StringUtils';
import { Json, JsonArray, JsonObject, JsonUtil } from 'json-to-java/bin/utils/json';
import { insertConstants, MATCHER_SCOPED } from './InsertGlobalConstant';

const TEMPLATE_PATTERN = '___templateName';

type JsonObjectTemplateCompiler = (templateToCompile: JsonObject) => Json[];
type JsonArrayTemplateCompiler = (templateToCompile: JsonArray) => Json[];

export function compileTemplates (
  json: Json,
  jsonArrayTemplateCompilers: { [key: string]: JsonArrayTemplateCompiler },
  jsonObjectTemplateCompilers: { [key: string]: JsonObjectTemplateCompiler },
): Json {
  if (!JsonUtil.isJsonArray(json) && !JsonUtil.isJsonObject(json)) {
    return json;
  }
  if (JsonUtil.isJsonObject(json)) {
    const rst = {} as JsonObject;
    Object.keys(json as JsonObject).forEach(key => {
      rst[key] = compileTemplates((json as JsonObject)[key], jsonArrayTemplateCompilers, jsonObjectTemplateCompilers);
    });
    return rst;
  }
  // json: JsonArray
  const result = [] as JsonArray;
  (json as JsonArray).forEach(subJson => {
    if (Array.isArray(subJson)) {
      // JsonArray
      if (subJson.length > 0 && typeof subJson[0] === 'string' &&
          (subJson[0] as string).startsWith(`${TEMPLATE_PATTERN}:`)) {
        const templateName = (subJson[0] as string).slice(TEMPLATE_PATTERN.length + 1);
        if (!(templateName in jsonArrayTemplateCompilers)) {
          throw new Error(`There is no compiler for template '${templateName}'`);
        }
        const templateToCompile = subJson.concat() as JsonArray;
        templateToCompile.shift();
        result.push(...jsonArrayTemplateCompilers[templateName](templateToCompile));
        return;
      }
    } else if (JsonUtil.isJsonObject(subJson)) {
      // JsonObject
      if (TEMPLATE_PATTERN in (subJson as JsonObject)) {
        const templateName = (subJson as JsonObject)[TEMPLATE_PATTERN];
        if (typeof templateName !== 'string') {
          throw new Error(`${TEMPLATE_PATTERN} should be a string rather than ${JSON.stringify(templateName)}`);
        }
        if (!(templateName in jsonObjectTemplateCompilers)) {
          throw new Error(`There is no compiler for template '${templateName}'`);
        }
        const templateToCompile = { ...(subJson as JsonObject) };
        delete templateToCompile[TEMPLATE_PATTERN];
        result.push(...jsonObjectTemplateCompilers[templateName](templateToCompile));
        return;
      }
    }
    result.push(compileTemplates(subJson, jsonArrayTemplateCompilers, jsonObjectTemplateCompilers));
  });
  return result;
}

export function getJsonObjectTemplateCompilers (
  projectObject: LvgProjectObject,
): { [key: string]: JsonObjectTemplateCompiler } {
  const properties = projectObject.properties;
  return {
    propertyDefaultValue (templateToCompile: JsonObject) {
      const result: Json[] = [];
      Object.keys(properties).forEach(name => {
        const property = properties[name];
        result.push(insertConstants(templateToCompile, MATCHER_SCOPED, {
          type: property.javaType,
          name,
          defaultValue: property.defaultValue,
        }));
      });
      return result;
    },
    propertyField (templateToCompile: JsonObject) {
      const result: Json[] = [];
      Object.keys(properties).forEach(name => {
        const property = properties[name];
        result.push(insertConstants(templateToCompile, MATCHER_SCOPED, {
          type: property.javaType,
          name,
        }));
      });
      return result;
    },
    propertyGetter (templateToCompile: JsonObject) {
      const result: Json[] = [];
      Object.keys(properties).forEach(name => {
        const property = properties[name];
        result.push(insertConstants(templateToCompile, MATCHER_SCOPED, {
          description: property.description,
          category: property.category,
          getterVisible: String(property.getterVisible),
          type: property.javaType,
          name,
        }));
      });
      return result;
    },
    propertySetter (templateToCompile: JsonObject) {
      const result: Json[] = [];
      Object.keys(properties).forEach(name => {
        const property = properties[name];
        result.push(insertConstants(templateToCompile, MATCHER_SCOPED, {
          description: property.description,
          category: property.category,
          setterVisible: String(property.setterVisible),
          editorType: property.editorType,
          name,
          args: property.args.length === 0 ? '{}' : ('{"' + property.args.join('", "') + '"}'),
          type: property.javaType,
        }));
      });
      // TODO: handle ___templateIf
      return result;
    },
    event (templateToCompile: JsonObject) {
      // TODO: implement this
      return [
        insertConstants(templateToCompile, MATCHER_SCOPED, {
          description: 'EVENT_DESCRIPTION',
          name: 'EVENT_NAME',
        }),
      ];
    },
    elementComponent (templateToCompile: JsonObject) {
      const result: JsonArray = [];
      function traverseComponentContainer (compProps: LvgItemLayout) {
        if (compProps.$Components !== undefined) {
          compProps.$Components.forEach(child => {
            result.push(insertConstants(templateToCompile, MATCHER_SCOPED, {
              type: child.$Type,
              name: StringUtils.ensureComponentNameValid(child.$Name),
            }));
            traverseComponentContainer(child);
          });
        }
      }
      if (projectObject.itemLayout) {
        traverseComponentContainer(projectObject.itemLayout.Properties);
      }
      return result;
    },
    elementEvent (templateToCompile: JsonObject) {
      // TODO: implement this
      return [
        insertConstants(templateToCompile, MATCHER_SCOPED, {
          name: 'EVENT_NAME',
        }),
      ];
    },
  };
}
export function getJsonArrayTemplateCompilers (
  projectObject: LvgProjectObject,
): { [key: string]: JsonArrayTemplateCompiler } {
  const properties = projectObject.properties;
  return {
    eventImplement (templateToCompile: JsonArray) {
      // TODO: implement this
      const itemsToCompile = [{
        name: 'EVENT_NAME',
      }];
      const result = [] as JsonArray;
      itemsToCompile.forEach(data => {
        result.push(...insertConstants(templateToCompile, MATCHER_SCOPED, data) as JsonArray);
      });
      return result;
    },
    getElementAsObject_DefineObject (templateToCompile: JsonArray) {
      // TODO: implement this
      const itemsToCompile = [{
        resultLength: '/* RESULT_LENGTH */ 3',
      }];
      const result = [] as JsonArray;
      itemsToCompile.forEach(data => {
        result.push(...insertConstants(templateToCompile, MATCHER_SCOPED, data) as JsonArray);
      });
      return result;
    },
    getElementAsObject_AssignValue (templateToCompile: JsonArray) {
      // TODO: implement this
      const result = [] as JsonArray;
      for (let i = 0; i < 3; i++) {
        const itemsToCompile = [{
          numberOfItem: i,
        }];
        itemsToCompile.forEach(data => {
          result.push(...insertConstants(templateToCompile, MATCHER_SCOPED, data) as JsonArray);
        });
      }
      return result;
    },
    elementCreate (templateToCompile: JsonArray) {
      const result: JsonArray = [];
      function traverseComponentContainer (compProps: LvgItemLayout) {
        if (compProps.$Components !== undefined) {
          compProps.$Components.forEach(child => {
            result.push(...insertConstants(templateToCompile, MATCHER_SCOPED, {
              type: child.$Type,
              name: StringUtils.ensureComponentNameValid(child.$Name),
              container: StringUtils.ensureComponentNameValid(compProps.$Name),
            }) as JsonArray);
            traverseComponentContainer(child);
          });
        }
      }
      if (projectObject.itemLayout) {
        traverseComponentContainer(projectObject.itemLayout.Properties);
      }
      return result;
    },
    elementSetDefaultProperty (templateToCompile: JsonArray) {
      // TODO: implement this
      const itemsToCompile = [{
        name: 'ELEMENT_NAME',
        propName: 'ELEMENT_PROP_NAME',
        propValue: 'ELEMENT_PROP_VALUE',
      }];
      const result = [] as JsonArray;
      itemsToCompile.forEach(data => {
        result.push(...insertConstants(templateToCompile, MATCHER_SCOPED, data) as JsonArray);
      });
      return result;
    },
    elementRefreshProperties (templateToCompile: JsonArray) {
      // TODO: implement this
      const itemsToCompile = [{
        name: 'ELEMENT_NAME',
        propName: 'ELEMENT_PROP_NAME',
        propValue: 'ELEMENT_PROP_VALUE',
      }];
      const result = [] as JsonArray;
      itemsToCompile.forEach(data => {
        result.push(...insertConstants(templateToCompile, MATCHER_SCOPED, data) as JsonArray);
      });
      return result;
    },
    elementShow (templateToCompile: JsonArray) {
      // TODO: implement this
      return templateToCompile;
    },
    elementHide (templateToCompile: JsonArray) {
      // TODO: implement this
      return templateToCompile;
    },
    elementSet (templateToCompile: JsonArray) {
      // TODO: implement this
      return templateToCompile;
    },
  };
}
