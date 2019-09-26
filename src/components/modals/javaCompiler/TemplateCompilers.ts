import { isVisibleComponent, SIMPLE_COMPONENTS } from '@/lib/appinventor-sources/SimpleComponents';
import { LvgItemLayout, LvgProjectObject } from '@/typings/lvg';
import StringUtils from '@/utils/StringUtils';
import { Json, JsonArray, JsonObject, JsonUtil } from 'json-to-java/bin/utils/json';
import Lodash from 'lodash';
import { insertConstants, MATCHER_SCOPED } from './InsertGlobalConstant';

export const TEMPLATE_PATTERN = '___templateName';
export const TEMPLATE_IF_PATTERN = '___templateIf';

const PROPERTY_DEFAULT_NAME_PREFIX = 'PROPERTY_DEFAULT_';
const PROPERTY_PRIVATE_NAME_PREFIX = 'PROPERTY_';

interface CompileDataProviders {
  [providerName: string]: () => JsonObject[];
}

export function compileTemplates (json: Json, pattern: string, compileDataProvider: CompileDataProviders): Json {
  if (!JsonUtil.isJsonArray(json) && !JsonUtil.isJsonObject(json)) {
    return json;
  }
  if (JsonUtil.isJsonObject(json)) {
    return Lodash.mapValues(json as JsonObject, value => compileTemplates(value, pattern, compileDataProvider));
  }
  // json: JsonArray
  const result = [] as JsonArray;
  (json as JsonArray).forEach(subJson => {
    if (JsonUtil.isJsonArray(subJson)) {
      // JsonArray
      subJson = subJson as JsonArray;
      if (subJson.length > 0 && typeof subJson[0] === 'string' && subJson[0].startsWith(`${pattern}:`)) {
        const templateName = subJson[0].slice(pattern.length + 1);
        if (!(templateName in compileDataProvider)) {
          throw new Error(`There is no compiler for template '${templateName}'`);
        }
        const templateToCompile = subJson.concat();
        templateToCompile.shift();
        result.push(
            ...Lodash.flatten(
              compileDataProvider[templateName]()
              .map(data => insertConstants(templateToCompile, MATCHER_SCOPED, data))));
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
        if (!(templateName in compileDataProvider)) {
          throw new Error(`There is no compiler for template '${templateName}'`);
        }
        const templateToCompile = Lodash.cloneDeep(subJson);
        delete templateToCompile[pattern];
        result.push(
            ...compileDataProvider[templateName]()
            .map(data => insertConstants(templateToCompile, MATCHER_SCOPED, data)));
        return;
      }
    }
    result.push(compileTemplates(subJson, pattern, compileDataProvider));
  });
  return result;
}

export function getCompileDataProvider (projectObject: LvgProjectObject): CompileDataProviders {
  const properties = projectObject.properties;
  return {
    propertyDefaultValue () {
      return Lodash.values(properties).map(property => ({
        type: property.javaType,
        name: property.name,
        defaultName: Lodash.snakeCase(PROPERTY_DEFAULT_NAME_PREFIX + property.name).toUpperCase(),
        defaultValue: property.defaultValue,
      }));
    },
    propertyField () {
      return Lodash.values(properties).map(property => ({
        type: property.javaType,
        privateName: Lodash.camelCase(PROPERTY_PRIVATE_NAME_PREFIX + property.name),
        defaultName: Lodash.snakeCase(PROPERTY_DEFAULT_NAME_PREFIX + property.name).toUpperCase(),
      }));
    },
    eventImplement () {
      return [{
        name: 'TODO_EVENT_NAME',
      }];
    },
    getElementAsObject_DefineObject () {
      return [{
        resultLength: '/* TODO_RESULT_LENGTH */ 3',
      }];
    },
    getElementAsObject_AssignValue () {
      // TODO: implement this
      return [
        { numberOfItem: 0 },
        { numberOfItem: 1 },
        { numberOfItem: 2 },
      ];
    },
    event () {
      return [{
        description: 'TODO_EVENT_DESCRIPTION',
        name: 'TODO_EVENT_NAME',
      }];
    },
    propertySetter () {
      return Lodash.values(properties).map(property => ({
        description: property.description,
        category: property.category.toUpperCase(),
        setterVisible: String(property.setterVisible),
        editorType: property.editorType,
        name: property.name,
        privateName: Lodash.camelCase(PROPERTY_PRIVATE_NAME_PREFIX + property.name),
        defaultName: Lodash.snakeCase(PROPERTY_DEFAULT_NAME_PREFIX + property.name).toUpperCase(),
        args: `{"${property.args.map(arg => `"${arg}"`).join(', ')}"}`,
        type: property.javaType,
        designerVisible: property.designerVisible,
      }));
    },
    propertyGetter () {
      return Lodash.values(properties).map(property => ({
        description: property.description,
        category: property.category.toUpperCase(),
        getterVisible: String(property.getterVisible),
        type: property.javaType,
        name: property.name,
        privateName: Lodash.camelCase(PROPERTY_PRIVATE_NAME_PREFIX + property.name),
      }));
    },
    elementComponent () {
      const itemsToCompile = [] as Array<{
        type: string,
        name: string,
      }>;
      if (projectObject.itemLayout) {
        function traverseComponentContainer (compProps: LvgItemLayout) {
          Lodash.defaultTo(compProps.$Components, []).forEach(child => {
            itemsToCompile.push({
              type: child.$Type,
              name: StringUtils.ensureComponentNameValid(child.$Name),
            });
            traverseComponentContainer(child);
          });
        }
        traverseComponentContainer(projectObject.itemLayout.Properties);
      }
      return itemsToCompile;
    },
    elementEvent () {
      return [{
        name: 'TODO_EVENT_NAME',
      }];
    },
    elementCreate () {
      const itemsToCompile = [] as Array<{
        type: string,
        name: string,
        container: string,
      }>;
      if (projectObject.itemLayout) {
        const formProp = projectObject.itemLayout.Properties;
        function traverseComponentContainer (compProps: LvgItemLayout) {
          Lodash.defaultTo(compProps.$Components, []).forEach(child => {
            itemsToCompile.push({
              type: child.$Type,
              name: StringUtils.ensureComponentNameValid(child.$Name),
              container: compProps.$Name === formProp.$Name
                  ? 'container' : StringUtils.ensureComponentNameValid(compProps.$Name),
            });
            traverseComponentContainer(child);
          });
        }
        traverseComponentContainer(formProp);
      }
      return itemsToCompile;
    },
    elementSetDefaultProperty () {
      const itemsToCompile = [] as Array<{
        name: string,
        propName: string,
        propValue: string,
      }>;
      if (projectObject.itemLayout) {
        const formProp = projectObject.itemLayout.Properties;
        function traverseComponentContainer (compProps: LvgItemLayout) {
          Lodash.defaultTo(compProps.$Components, []).forEach(child => {
            if (child.$Type in SIMPLE_COMPONENTS) {
              Lodash.forOwn(SIMPLE_COMPONENTS[child.$Type].properties, property => {
                itemsToCompile.push({
                  name: StringUtils.ensureComponentNameValid(child.$Name),
                  propName: property.name,
                  propValue: Lodash.defaultTo(child[property.name], property.defaultValue),
                });
              });
            } else {
              throw Error('Can not recognize component type ' + child.$Type);
            }
            traverseComponentContainer(child);
          });
        }
        traverseComponentContainer(formProp);
      }
      return itemsToCompile;
    },
    elementRefreshProperties () {
      return Lodash.values(properties).map(property => ({
        compName: StringUtils.ensureComponentNameValid(property.bindedProperty.compName),
        propName: property.bindedProperty.propName,
        privateName: Lodash.camelCase(PROPERTY_PRIVATE_NAME_PREFIX + property.name),
      }));
    },
    elementShow () {
      return Lodash.defaultTo(Lodash.get(projectObject, 'itemLayout.Properties.$Components') as LvgItemLayout[], [])
          .map(child => {
            if (isVisibleComponent(child.$Type)) {
              throw new Error('component type does not exist or is a non-visible component: ' + child.$Type);
            }
            return { name: StringUtils.ensureComponentNameValid(child.$Name) };
          });
    },
    elementHide () {
      return Lodash.defaultTo(Lodash.get(projectObject, 'itemLayout.Properties.$Components') as LvgItemLayout[], [])
          .map(child => ({ name: StringUtils.ensureComponentNameValid(child.$Name) }));
    },
    elementSet () {
      // TODO: implement this
      return [];
    },
  };
}
