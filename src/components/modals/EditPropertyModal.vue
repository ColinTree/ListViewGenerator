<template>
  <b-modal
      ref="modal"
      size="lg"
      centered
      :ok-variant="needSwitchMode ? 'danger' : 'primary'"
      cancel-variant="outline-secondary"
      hide-header-close
      no-close-on-backdrop
      no-close-on-esc
      @ok="needSwitchMode ? switchMode($event) : onOk($event)"
      @shown="onShown">
    <span slot="modal-title" v-if="isNewProperty" v-t="'modal.editProperty.titleAdd'" />
    <span slot="modal-title" v-else v-t="'modal.editProperty.titleEdit'" />
    <span slot="modal-ok" v-if="needSwitchMode" v-t="'modal.editProperty.switchMode'" />
    <span slot="modal-ok" v-else v-t="'button.applyAndClose'" />
    <span slot="modal-cancel" v-t="'button.cancel'" />

    <!-- NAME -->
    <b-form-group :label-cols="LABEL_COLS" :state="nameState">
      <span slot="label" v-t="'modal.editProperty.name'" />
      <span slot="invalid-feedback" v-t="`modal.editProperty.name${nameFeedback}`" />
      <b-input ref="name" v-model="currentProperty.name" :state="nameState" />
    </b-form-group>

    <!-- DESIGNER VIEW VISIBLE -->
    <b-form-group :label-cols="LABEL_COLS">
      <b-checkbox v-model="currentProperty.designerVisible">
        <span v-t="'modal.editProperty.designerVisible'" />
      </b-checkbox>
    </b-form-group>

    <!-- EDITOR TYPE -->
    <b-form-group :label-cols="LABEL_COLS">
      <span slot="label" v-t="'modal.editProperty.editorType'" />
      <b-select v-model="currentProperty.editorType">
        <optgroup :label="$t('modal.editProperty.editorTypeRecommended')">
          <option v-for="option in editorOptions.recommended" :key="option" :value="option">
            <span v-text="option" />
          </option>
        </optgroup>
        <optgroup :label="$t('modal.editProperty.editorTypeNotRecommended')">
          <option v-for="option in editorOptions.notRecommended" :key="option" :value="option">
            <span v-text="option" />
          </option>
        </optgroup>
      </b-select>
    </b-form-group>

    <!-- DESIGNER VIEW VISIBLE -->
    <b-form-group :label-cols="LABEL_COLS">
      <b-checkbox v-model="currentProperty.setterVisible" inline>
        <span v-t="'modal.editProperty.setterVisible'" />
      </b-checkbox>
      <b-checkbox v-model="currentProperty.getterVisible" inline>
        <span v-t="'modal.editProperty.getterVisible'" />
      </b-checkbox>
    </b-form-group>

    <!-- CATEGORY -->
    <b-form-group :label-cols="LABEL_COLS">
      <span slot="label" v-t="'modal.editProperty.category'" />
      <b-select v-model="currentProperty.category" :options="categoryOptions" />
    </b-form-group>

    <!-- DESCRIPTION -->
    <b-form-group :label-cols="LABEL_COLS">
      <span slot="label" v-t="'modal.editProperty.description'" />
      <b-input id="property_description" v-model="currentProperty.description" />
    </b-form-group>

    <!-- BINDED PROPERTY -->
    <b-form-group
        :label-cols="LABEL_COLS"
        :state="bindedComponentState === false || bindedPropertyState === false ? false : null">
      <span slot="label" v-t="'modal.editProperty.bindedProperty'" />
      <span slot="invalid-feedback" v-t="`modal.editProperty.bindedProperty${bindedPropertyFeedback}`" />
      <b-input-group>
        <b-select
            ref="bindedComponent"
            :options="bindedComponentOptions"
            :state="bindedComponentState"
            v-model="currentProperty.bindedProperty.compName" />
        <b-select
            ref="bindedProperty"
            :options="bindedPropertyOptions"
            :state="bindedPropertyState"
            :disabled="bindedComponentState !== null"
            v-model="currentProperty.bindedProperty.propName" />
      </b-input-group>
    </b-form-group>

    <!-- JAVA TYPE -->
    <b-form-group :label-cols="LABEL_COLS" :state="javaTypeState">
      <span slot="label" v-t="'modal.editProperty.javaType'" />
      <span slot="invalid-feedback" v-t="'modal.editProperty.defaultValueEmpty'" />
      <b-select
          :options="javaTypeOptions"
          :state="javaTypeState"
          :disabled="bindedComponentState !== null || bindedPropertyState !== null"
          v-model="currentProperty.javaType" />
    </b-form-group>

    <!-- DEFAULT VALUE -->
    <b-form-group :label-cols="LABEL_COLS" :state="defaultValueState">
      <span slot="label" v-t="'modal.editProperty.defaultValue'" />
      <span slot="description" v-t="`modal.editProperty.defaultValue${defaultValueHint}`" />
      <span slot="invalid-feedback" v-t="'modal.editProperty.defaultValueEmpty'" />
      <b-input
          ref="defaultValue"
          :state="defaultValueState"
          :disabled="bindedComponentState !== null || bindedPropertyState !== null || javaTypeState !== null"
          v-model="currentProperty.defaultValue" />
    </b-form-group>
  </b-modal>
</template>

<script lang="ts">
import { BFormInput, BFormSelect, BModal } from 'bootstrap-vue';
import Lodash from 'lodash';
import { Component, Vue, Watch } from 'vue-property-decorator';

import Content from '../Content.vue';
import AutoComplete from '../form/AutoComplete.vue';

import { PROPERTY_CATEGORY } from '../../lib/appinventor-sources/PropertyCategory';
import { PROPERTY_TYPE_CONSTANTS } from '../../lib/appinventor-sources/PropertyTypeConstants';
import { SIMPLE_COMPONENTS } from '../../lib/appinventor-sources/SimpleComponents';
import { YAIL_TYPES } from '../../lib/appinventor-sources/YailType';
import { EmptyLvgProperty, LvgProperty } from '../../typings/lvg';
import StringUtils from '../../utils/StringUtils';

@Component({ components: { AutoComplete } })
export default class EditPropertyModal extends Vue {
  public $parent!: Content;
  public $refs!: {
    modal: BModal;
    name: BFormInput;
    bindedComponent: BFormSelect;
    bindedProperty: BFormSelect;
    javaType: AutoComplete;
    defaultValue: BFormInput;
  };

  public readonly LABEL_COLS = 3;

  private isNewProperty = false;

  private readonly currentProperty: LvgProperty = {
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

  public getCurrentProperty (): LvgProperty {
    return {
      name: this.currentProperty.name,
      designerVisible: this.currentProperty.designerVisible,
      editorType: this.currentProperty.editorType,
      setterVisible: this.currentProperty.setterVisible,
      getterVisible: this.currentProperty.getterVisible,
      category: this.currentProperty.category,
      description: this.currentProperty.description,
      javaType: this.currentProperty.javaType,
      defaultValue: this.currentProperty.defaultValue,
      bindedProperty: {
        compName: this.currentProperty.bindedProperty.compName,
        propName: this.currentProperty.bindedProperty.propName,
      },
      args: [],
    };
  }
  public showModal (isNewProp: boolean, property: LvgProperty = EmptyLvgProperty()) {
    this.$refs.modal.show();
    this.isNewProperty = isNewProp;
    this.currentProperty.name            = property.name;
    this.currentProperty.designerVisible = property.designerVisible;
    this.currentProperty.editorType      = property.editorType;
    this.currentProperty.setterVisible   = property.setterVisible;
    this.currentProperty.getterVisible   = property.getterVisible;
    this.currentProperty.category        = property.category;
    this.currentProperty.description     = property.description;
    this.currentProperty.javaType        = property.javaType;
    this.currentProperty.defaultValue    = property.defaultValue;
    this.currentProperty.bindedProperty.compName = property.bindedProperty.compName;
    this.$nextTick(() =>
      this.currentProperty.bindedProperty.propName = property.bindedProperty.propName);
  }

  get nameEmpty () {
    return Lodash.isEmpty(this.currentProperty.name);
  }
  get nameConstitutionError () {
    return !/^[a-z_]\w*$/gi.test(this.currentProperty.name);
  }
  get needSwitchMode () {
    // only when not empty and mode conflict
    return !this.nameEmpty && this.$parent.checkPropertyExist(this.currentProperty.name) === this.isNewProperty;
  }
  get nameState () {
    return (this.nameEmpty || this.nameConstitutionError || this.needSwitchMode) ? false : null;
  }
  get nameFeedback () {
    return this.nameEmpty ? 'Empty'
        : this.nameConstitutionError ? 'ConstitutionError'
        : this.needSwitchMode ? (this.isNewProperty ? 'ConflitAdd' : 'ConflitEdit')
        : '';
  }
  get editorOptions () {
    const recommended = [ 'asset', 'boolean', 'color', 'component', 'float', 'integer', 'non_negative_float',
        'non_negative_integer', 'text', 'textArea', 'textalignment', 'visibility' ];
    return { recommended, notRecommended: Lodash.difference(PROPERTY_TYPE_CONSTANTS, recommended) };
  }
  get categoryOptions () {
    return PROPERTY_CATEGORY.map(name => ({
      text: this.$t('modal.editProperty.category' + Lodash.capitalize(name)),
      value: Lodash.toLower(name),
    }));
  }
  get bindedComponentOptions () {
    const options = [] as Array<string | { text: string, value: string }>;
    options.push({ text: this.$t('common.nullSelected') as string, value: '' });
    Lodash.forOwn(this.$parent.plainItemLayoutComponents, value => options.push(value.$Name));
    return options;
  }
  get bindedPropertyOptions () {
    const options = [] as Array<string | { text: string, value: string }>;
    options.push({ text: this.$t('common.nullSelected') as string, value: '' });

    const plainItemLayoutComponents = this.$parent.plainItemLayoutComponents;
    const compName = this.currentProperty.bindedProperty.compName;
    if (compName in plainItemLayoutComponents) {
      const compType = plainItemLayoutComponents[compName].$Type;
      if (compType in SIMPLE_COMPONENTS) {
        Lodash.forOwn(SIMPLE_COMPONENTS[compType].blockProperties,
            prop => options.push({
              text: Lodash.startCase(prop.name),
              value: prop.name,
            }));
      }
    }
    return options;
  }
  get bindedComponentEmpty () {
    return Lodash.isEmpty(this.currentProperty.bindedProperty.compName);
  }
  get bindedComponentState () {
    return this.bindedComponentEmpty ? false : null;
  }
  get bindedPropertyEmpty () {
    return Lodash.isEmpty(this.currentProperty.bindedProperty.propName);
  }
  get bindedPropertyState () {
    if (this.bindedComponentState !== null) {
      return null;
    }
    return this.bindedPropertyEmpty ? false : null;
  }
  get bindedPropertyFeedback () {
    return this.bindedComponentEmpty ? 'ComponentEmpty'
        : this.bindedPropertyEmpty ? 'PropertyEmpty'
        : '';
  }
  get javaTypeOptions () {
    const options = [] as Array<string | { text: string, value: string }>;
    options.push({ text: this.$t('common.nullSelected') as string, value: '' });

    const compName = this.currentProperty.bindedProperty.compName;
    const propName = this.currentProperty.bindedProperty.propName;
    const plainItemLayoutComponents = this.$parent.plainItemLayoutComponents;
    if (compName in plainItemLayoutComponents) {
      const compType = plainItemLayoutComponents[compName].$Type;
      if (compType in SIMPLE_COMPONENTS) {
        const bProps = SIMPLE_COMPONENTS[compType].blockProperties;
        if (propName in bProps) {
          const yailType = bProps[propName].type;
          if (yailType in YAIL_TYPES) {
            options.push(...Lodash.get(YAIL_TYPES, yailType));
          }
        }
      }
    }

    return options;
  }
  get javaTypeEmpty () {
    return Lodash.isEmpty(this.currentProperty.javaType);
  }
  get javaTypeState () {
    if (this.bindedComponentState !== null || this.bindedPropertyState !== null) {
      return null;
    }
    return this.javaTypeEmpty ? false : null;
  }
  get defaultValueEmpty () {
    return Lodash.isEmpty(this.currentProperty.defaultValue);
  }
  get defaultValueConstantLike () {
    return /^[a-z][\w\.]*[\w]$/gi.test(this.currentProperty.defaultValue);
  }
  get defaultValueState () {
    if (this.bindedComponentState !== null || this.bindedPropertyState !== null
        || this.javaTypeState !== null) {
      return null;
    }
    return this.defaultValueEmpty ? false : null;
  }
  get defaultValueHint () {
    const javaType = this.currentProperty.javaType;
    const val = this.currentProperty.defaultValue;
    if (this.defaultValueEmpty || this.defaultValueConstantLike) {
      return 'NoHint';
    }
    switch (javaType) {
      case 'long':
        return /^\d+l?$/i.test(val) ? 'NoHint' : 'NotIntOrConstant';
      case 'int':
        return /^\d+$/.test(val) ? 'NoHint' : 'NotIntOrConstant';
      case 'float':
      case 'double':
        return RegExp(`^\\d+([\\.]\\d+)?${javaType.charAt(0)}?$`, 'i').test(val) ? 'NoHint' : 'NotDecimal';
      case 'boolean':
        return [ 'true', 'false' ].includes(val) ? 'NoHint' : 'NotBoolean';
      case 'String':
        return val.length > 1 && val.startsWith('"') && val.endsWith('"') ? 'NoHint' : 'NotString';
      default:
        return 'NoHint';
    }
  }

  @Watch('currentProperty.bindedProperty.compName')
  private onBindedComponentChanged () {
    this.currentProperty.bindedProperty.propName = '';
  }
  private onShown () {
    this.$refs.name.focus();
  }
  private onOk (event: Event) {
    event.preventDefault();
    if (this.nameState === false) {
      return this.$refs.name.focus();
    }
    if (this.bindedComponentState === false) {
      return this.$refs.bindedProperty.focus();
    }
    if (this.bindedPropertyState === false) {
      return this.$refs.bindedProperty.focus();
    }
    if (this.javaTypeState === false) {
      return this.$refs.javaType.focus();
    }
    if (this.defaultValueState === false) {
      return this.$refs.defaultValue.focus();
    }
    // TODO: (LOW PRIORITY) notice when three checkboxs are all unchecked
    this.$emit('ok', this.isNewProperty, this.getCurrentProperty());
    this.$nextTick(() => this.$refs.modal.hide());
  }
  private switchMode (e: Event) {
    if (Lodash.isFunction(e.preventDefault)) {
      e.preventDefault();
    }
    this.isNewProperty = !this.isNewProperty;
  }
}
</script>
