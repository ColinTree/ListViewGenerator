export type LvgPropertyEditorType =
  'asset' | 'boolean' | 'color' | 'component' | 'float' | 'integer' | 'non_negative_float' |
  'non_negative_integer' | 'text' | 'textArea' | 'textalignment' | 'visibility';

export type LvgPropertyCategory =
  'unset' | 'appearance' | 'behaviour' | 'deprecated';

export type LvgPropertyJavaType =
  'boolean' | 'Component' | 'double' | 'float' | 'int' | 'long' | 'String' | 'YailList' | string;

export interface LvgProperty {
  name: string;
  designerVisible: boolean;
  editorType: LvgPropertyEditorType;
  setterVisible: boolean;
  getterVisible: boolean;
  category: LvgPropertyCategory;
  description: string;
  javaType: LvgPropertyJavaType;
  args: string[];
  defaultValue: string;
  bindedProperty: {
    compName: string,
    propName: string,
  };
}
export function EmptyLvgProperty (): LvgProperty {
  return {
    name: '',
    designerVisible: true,
    editorType: 'text',
    setterVisible: true,
    getterVisible: true,
    category: 'unset',
    description: '',
    javaType: '',
    defaultValue: '',
    bindedProperty: {
      compName: '',
      propName: '',
    },
    args: [],
  };
}

export interface LvgItemLayout {
  $Name: string;
  $Type: string;
  $Version: string;
  Uuid: string;
  [key: string]: any;
  $Components?: LvgItemLayout[];
}
export interface LvgPlainItemLayout {
  $Name: string;
  $Type: string;
  $Version: string;
  Uuid: string;
  [key: string]: any;
  $Components?: string[];
}
export interface AiaScmFile {
  authURL: string[];
  YaVersion: string;
  Source: string;
  Properties: LvgItemLayout;
}
export function EmptyAiaScmFile (): AiaScmFile {
  return {
    authURL: [],
    YaVersion: '0',
    Source: 'Form',
    Properties: { $Name: '', $Type: '', $Version: '', Uuid: '' },
  };
}

export interface LvgProjectObject {
  fullPackage: string;
  componentName: string;
  description: string;
  version: number;
  properties: { [key: string]: LvgProperty };
  itemLayout?: AiaScmFile;
}

export interface LvgProjectZipInfo {
  packageName: string;
  componentName: string;
  joinCompNameToPackage: boolean;
  description: string;
  version: number;
  properties: { [key: string]: LvgProperty };
  itemLayoutFileName: string;
}
