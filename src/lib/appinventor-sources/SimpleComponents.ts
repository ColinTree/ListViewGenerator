import Lodash, { Dictionary } from 'lodash';
import simpleComponents from './simple_components.json';

export interface Property {
  name: string;
  editorType: string;
  defaultValue: string;
  editorArgs: any[];
}
export interface BlockProperty {
  name: string;
  description: string;
  type: string;
  rw: 'read-write' | 'read-only' | 'write-only' | 'invisible';
  deprecated: 'true' | 'false';
}
interface SimpleComponentJsonForm {
  /**
   * full name with package name
   */
  type: string;
  /**
   * simple comopnent name
   */
  name: string;
  external: 'true' | 'false';
  version: string;
  /**
   * ALL CAPITALIZED
   */
  categoryString: string;
  helpString: string;
  helpUrl: string;
  /**
   * is component visible in component list of designer view?
   */
  showOnPalette: 'true' | 'false';
  /**
   * is component visible in the phone screen?
   */
  nonVisible: 'true' | 'false';
  /**
   * properties shown in designer view
   */
  properties: Property[];
  /**
   * properties that shown in block draw
   */
  blockProperties: BlockProperty[];
}

export class SimpleComponent {
  public readonly type: string;
  public readonly name: string;
  public readonly external: boolean;
  public readonly version: string;
  public readonly categoryString: string;
  public readonly helpString: string;
  public readonly helpUrl: string;
  public readonly showOnPalette: boolean;
  public readonly nonVisible: boolean;
  public readonly properties: Dictionary<Property>;
  public readonly blockProperties: Dictionary<BlockProperty>;
  public constructor (simpleComponent: SimpleComponentJsonForm) {
    this.type = simpleComponent.type;
    this.name = simpleComponent.name;
    this.external = simpleComponent.external === 'true';
    this.version = simpleComponent.version;
    this.categoryString = simpleComponent.categoryString;
    this.helpString = simpleComponent.helpString;
    this.helpUrl = simpleComponent.helpUrl;
    this.showOnPalette = simpleComponent.showOnPalette === 'true';
    this.nonVisible = simpleComponent.nonVisible === 'true';
    this.properties =
        Lodash.zipObject(simpleComponent.properties.map(prop => prop.name), simpleComponent.properties);
    this.blockProperties =
        Lodash.zipObject(simpleComponent.blockProperties.map(prop => prop.name), simpleComponent.blockProperties);
  }
}

export const SIMPLE_COMPONENTS = Lodash.zipObject(
    (simpleComponents as SimpleComponentJsonForm[]).map(simpleComponent => simpleComponent.name),
    (simpleComponents as SimpleComponentJsonForm[]).map(simpleComponent => new SimpleComponent(simpleComponent)));

export function isVisibleComponent (componentType: string) {
  return !Lodash.get(SIMPLE_COMPONENTS, [ componentType, 'nonVisible' ]);
}
export function getPropDefaultValue (componentType: string, propName: string) {
  return Lodash.get(SIMPLE_COMPONENTS, [ componentType, 'properties', propName, 'defaultValue' ]);
}
