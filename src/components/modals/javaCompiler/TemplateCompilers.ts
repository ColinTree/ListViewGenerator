import { LvgItemLayout, LvgProjectObject } from '@/typings/lvg';
import StringUtils from '@/utils/StringUtils';
import { Json, JsonArray, JsonObject, JsonUtil } from 'json-to-java/bin/utils/json';
import Lodash from 'lodash';
import { insertConstants, MATCHER_SCOPED } from './InsertGlobalConstant';

export const TEMPLATE_PATTERN = '___templateName';
export const TEMPLATE_IF_PATTERN = '___templateIf';

type JsonObjectTemplateCompiler = (templateToCompile: JsonObject) => Json[];
type JsonArrayTemplateCompiler = (templateToCompile: JsonArray) => Json[];

export function compileTemplates (
  json: Json,
  pattern: string,
  jsonArrayTemplateCompilers: { [key: string]: JsonArrayTemplateCompiler },
  jsonObjectTemplateCompilers: { [key: string]: JsonObjectTemplateCompiler },
): Json {
  if (!JsonUtil.isJsonArray(json) && !JsonUtil.isJsonObject(json)) {
    return json;
  }
  if (JsonUtil.isJsonObject(json)) {
    const rst = {} as JsonObject;
    Lodash.forOwn(json as JsonObject, (value, key) => {
      rst[key] = compileTemplates(value, pattern, jsonArrayTemplateCompilers, jsonObjectTemplateCompilers);
    });
    return rst;
  }
  // json: JsonArray
  const result = [] as JsonArray;
  (json as JsonArray).forEach(subJson => {
    if (JsonUtil.isJsonArray(subJson)) {
      // JsonArray
      subJson = subJson as JsonArray;
      if (subJson.length > 0 && typeof subJson[0] === 'string' &&
          (subJson[0] as string).startsWith(`${pattern}:`)) {
        const templateName = (subJson[0] as string).slice(pattern.length + 1);
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
      subJson = subJson as JsonObject;
      if (pattern in subJson) {
        const templateName = subJson[pattern];
        if (typeof templateName !== 'string') {
          throw new Error(`${pattern} should be a string rather than ${JSON.stringify(templateName)}`);
        }
        if (!(templateName in jsonObjectTemplateCompilers)) {
          throw new Error(`There is no compiler for template '${templateName}'`);
        }
        const templateToCompile = Lodash.cloneDeep(subJson);
        delete templateToCompile[pattern];
        result.push(...jsonObjectTemplateCompilers[templateName](templateToCompile));
        return;
      }
    }
    result.push(compileTemplates(subJson, pattern, jsonArrayTemplateCompilers, jsonObjectTemplateCompilers));
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
      Lodash.forOwn(properties, (property, name) => {
        result.push(insertConstants(templateToCompile, MATCHER_SCOPED, {
          type: property.javaType,
          name,
          defaultName: (Lodash.snakeCase(name)).toUpperCase(),
          defaultValue: property.defaultValue,
        }));
      });
      return result;
    },
    propertyField (templateToCompile: JsonObject) {
      const result: Json[] = [];
      Lodash.forOwn(properties, (property, name) => {
        result.push(insertConstants(templateToCompile, MATCHER_SCOPED, {
          type: property.javaType,
          name,
          defaultName: (Lodash.snakeCase(name)).toUpperCase(),
        }));
      });
      return result;
    },
    propertyGetter (templateToCompile: JsonObject) {
      const result: Json[] = [];
      Lodash.forOwn(properties, (property, name) => {
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
      Lodash.forOwn(properties, (property, name) => {
        result.push(compileTemplates(
          insertConstants(templateToCompile, MATCHER_SCOPED, {
            description: property.description,
            category: property.category,
            setterVisible: String(property.setterVisible),
            editorType: property.editorType,
            name,
            defaultName: (Lodash.snakeCase(name)).toUpperCase(),
            args: property.args.length === 0 ? '{}' : ('{"' + property.args.join('", "') + '"}'),
            type: property.javaType,
          }),
          TEMPLATE_IF_PATTERN,
          {},
          { designerVisible: (content: JsonObject) => property.designerVisible ? [ content ] : [] },
        ));
      });
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
      if (projectObject.itemLayout) {
        const formProp = projectObject.itemLayout.Properties;
        function traverseComponentContainer (compProps: LvgItemLayout) {
          if (compProps.$Components !== undefined) {
            compProps.$Components.forEach(child => {
              result.push(...insertConstants(templateToCompile, MATCHER_SCOPED, {
                type: child.$Type,
                name: StringUtils.ensureComponentNameValid(child.$Name),
                container: compProps.$Name === formProp.$Name
                            ? 'container' : StringUtils.ensureComponentNameValid(compProps.$Name),
              }) as JsonArray);
              traverseComponentContainer(child);
            });
          }
        }
        traverseComponentContainer(formProp);
      }
      return result;
    },
    elementSetDefaultProperty (templateToCompile: JsonArray) {
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
      const result = [];
      if (projectObject.itemLayout) {
        const formProp = projectObject.itemLayout.Properties;
        if (formProp.$Components) {
          formProp.$Components.forEach(child => {
            result.push(...insertConstants(templateToCompile, MATCHER_SCOPED, {
              name: StringUtils.ensureComponentNameValid(child.$Name),
            }) as JsonArray);
          });
        }
      }
      return templateToCompile;
    },
    elementHide (templateToCompile: JsonArray) {
      const result = [];
      if (projectObject.itemLayout) {
        const formProp = projectObject.itemLayout.Properties;
        if (formProp.$Components) {
          formProp.$Components.forEach(child => {
            result.push(...insertConstants(templateToCompile, MATCHER_SCOPED, {
              name: StringUtils.ensureComponentNameValid(child.$Name),
            }) as JsonArray);
          });
        }
      }
      return templateToCompile;
    },
    elementSet (templateToCompile: JsonArray) {
      // TODO: implement this
      return templateToCompile;
    },
  };
}
