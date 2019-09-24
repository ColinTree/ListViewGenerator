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
export interface SimpleComponent {
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

export const SIMPLE_COMPONENTS = (() => {
  const SIMPLE_COMP = {} as {
    [key: string]: {
      properties: { [key: string]: Property },
      blockProperties: { [key: string]: BlockProperty },
    },
  };
  (simpleComponents as SimpleComponent[]).forEach(simpleComponent => {
    const properties = {} as { [key: string]: Property };
    simpleComponent.properties.forEach(property => properties[property.name] = property);

    const blockProperties = {} as { [key: string]: BlockProperty };
    simpleComponent.blockProperties.forEach(property => blockProperties[property.name] = property);

    SIMPLE_COMP[simpleComponent.name] = {
      properties,
      blockProperties,
    };
  });
  return SIMPLE_COMP;
})();
