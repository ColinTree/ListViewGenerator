<template>
  <b-modal
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
          <option v-for="option in EDITOR_TYPE_OPTIONS_RECOMMENDED" :key="option" :value="option">
            <span v-text="option" />
          </option>
        </optgroup>
        <optgroup :label="$t('modal.editProperty.editorTypeNotRecommended')">
          <option v-for="option in EDITOR_TYPE_OPTIONS_NOT_RECOMMENDED" :key="option" :value="option">
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
      <b-select v-model="currentProperty.category">
        <option
            v-for="name in CATEGORY_OPTIONS"
            :key="name"
            :value="name.toLowerCase()"
            v-t="`modal.editProperty.category${name}`" />
      </b-select>
    </b-form-group>

    <!-- DESCRIPTION -->
    <b-form-group :label-cols="LABEL_COLS">
      <span slot="label" v-t="'modal.editProperty.description'" />
      <b-input id="property_description" v-model="currentProperty.description" />
    </b-form-group>

    <!-- JAVA TYPE -->
    <b-form-group :label-cols="LABEL_COLS" :state="javaTypeState">
      <span slot="label" v-t="'modal.editProperty.javaType'" />
      <span slot="invalid-feedback" v-t="'modal.editProperty.defaultValueEmpty'" />
      <AutoComplete ref="javaType" :value.sync="currentProperty.javaType" :options="JAVA_TYPE_OPTIONS" :state="javaTypeState" />
    </b-form-group>

    <!-- DEFAULT VALUE -->
    <b-form-group :label-cols="LABEL_COLS" :state="defaultValueState">
      <span slot="label" v-t="'modal.editProperty.defaultValue'" />
      <span slot="description" v-t="`modal.editProperty.defaultValue${defaultValueHint}`" />
      <span slot="invalid-feedback" v-t="'modal.editProperty.defaultValueEmpty'" />
      <b-input ref="defaultValue" :state="defaultValueState" v-model="currentProperty.defaultValue" />
    </b-form-group>
  </b-modal>
</template>

<script lang="ts">
import { BFormInput, BModal } from 'bootstrap-vue';
import { Component, Vue } from 'vue-property-decorator';

import Content from '../Content.vue';
import AutoComplete from '../form/AutoComplete.vue';

import { EmptyLvgProperty, LvgProperty } from '../../typings/lvg';
import StringUtils from '../../utils/StringUtils';

@Component({ components: { AutoComplete } })
export default class EditPropertyModal extends Vue {
  public readonly LABEL_COLS = 3;
  public readonly CATEGORY_OPTIONS =
    [ 'Unset', 'Appearance', 'Behavior', 'Deprecated' ];
  public readonly JAVA_TYPE_OPTIONS =
    [ 'boolean', 'Component', 'double', 'float', 'int', 'long', 'String', 'YailList' ];
  public EDITOR_TYPE_OPTIONS_RECOMMENDED =
    [ 'asset', 'boolean', 'color', 'component', 'float', 'integer', 'non_negative_float',
      'non_negative_integer', 'text', 'textArea', 'textalignment', 'visibility' ];
  public EDITOR_TYPE_OPTIONS_NOT_RECOMMENDED =
    [ 'accelerometer_sensitivity', 'BluetoothClient', 'button_shape', 'choices', 'countries',
      'FirbaseURL', 'geographic_point', 'geojson_type', 'horizontal_alignment', 'languages',
      'latitude', 'longitude', 'lego_ev3_color_sensor_mode', 'lego_ev3_generated_color',
      'lego_ev3_gyro_sensor_mode', 'lego_ev3_sensor_port', 'lego_ev3_sound_sensor_mode',
      'lego_ev3_ultrasonic_sensor_mode', 'lego_nxt_generated_color', 'lego_nxt_sensor_port',
      'map_type', 'map_zoom', 'scaling', 'screen_animation', 'screen_orientation',
      'sensor_dist_interval', 'sensor_time_interval', 'sizing', 'text_receiving', 'theme',
      'toast_length', 'typeface', 'vertical_alignment' ];

  private isNewProperty = false;

  private readonly currentProperty: LvgProperty = {
    name: '',
    designerVisible: true,
    editorType: 'text',
    setterVisible: true,
    getterVisible: true,
    category: 'unset',
    description: '',
    javaType: 'String',
    defaultValue: '',
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
      args: [],
    };
  }
  public showModal (isNewProp: boolean, property: LvgProperty = EmptyLvgProperty()) {
    (this.$children[0] as BModal).show();
    this.isNewProperty = isNewProp;
    Object.assign(this.currentProperty, property);
    /*
    this.currentProperty.name            = property.name
    this.currentProperty.designerVisible = property.designerVisible
    this.currentProperty.editorType      = property.editorType
    this.currentProperty.setterVisible   = property.setterVisible
    this.currentProperty.getterVisible   = property.getterVisible
    this.currentProperty.category        = property.category
    this.currentProperty.description     = property.description
    this.currentProperty.javaType        = property.javaType
    this.currentProperty.defaultValue    = property.defaultValue
    */
  }

  get nameEmpty () {
    return this.currentProperty.name.length === 0;
  }
  get nameConstitutionError () {
    return !/^[a-z_]\w*$/gi.test(this.currentProperty.name);
  }
  get needSwitchMode () {
    return this.nameEmpty
        ? false
        : (this.$parent as Content).checkPropertyExist(this.currentProperty.name) === this.isNewProperty;
  }
  get nameState () {
    return (this.nameEmpty || this.nameConstitutionError || this.needSwitchMode) ? false : null;
  }
  get nameFeedback () {
    if (this.nameEmpty) {
      return 'Empty';
    } else if (this.nameConstitutionError) {
      return 'ConstitutionError';
    } else if (this.needSwitchMode) {
      return this.isNewProperty ? 'ConflitAdd' : 'ConflitEdit';
    } else {
      return '';
    }
  }
  get javaTypeState () {
    return (this.currentProperty.javaType === '' || this.currentProperty.javaType === null) ? false : null;
  }
  get defaultValueEmpty () {
    return this.currentProperty.defaultValue === '';
  }
  get defaultValueConstantLike () {
    return /^[a-z][\w\.]*[\w]$/gi.test(this.currentProperty.defaultValue);
  }
  get defaultValueState () {
    return this.defaultValueEmpty ? false : null;
  }
  get defaultValueHint () {
    /* Case empty */
    if (this.defaultValueEmpty) {
      // will be shown as invalid feedback rather than a hint
      return 'NoHint';
    } else
    /* Case integer */
    if (this.currentProperty.javaType === 'int' || this.currentProperty.javaType === 'long') {
      if (this.defaultValueConstantLike) {
        return 'NoHint';
      }
      let numStr = this.currentProperty.defaultValue;
      if (this.currentProperty.javaType === 'long') {
        const result = StringUtils.removeSuffix(numStr, 'l');
        numStr = result !== numStr ? result : StringUtils.removeSuffix(numStr, 'L');
      }
      const num = Number(numStr);
      return Number.isInteger(num) ? 'NoHint' : 'NotIntOrConstant';
    } else
    /* Case decimals */
    if (this.currentProperty.javaType === 'float' || this.currentProperty.javaType === 'double') {
      let numStr = this.currentProperty.defaultValue;
      const suffix = this.currentProperty.javaType.charAt(0);
      const result = StringUtils.removeSuffix(numStr, suffix);
      numStr = result !== numStr ? result : StringUtils.removeSuffix(numStr, suffix.toUpperCase());
      const num = Number(numStr);
      return (this.defaultValueConstantLike || !isNaN(num)) ? 'NoHint' : 'NotDecimal';
    } else
    /* Case boolean */
    if (this.currentProperty.javaType === 'boolean') {
      const val = this.currentProperty.defaultValue;
      return this.defaultValueConstantLike || val === 'true' || val === 'false'
          ? 'NoHint' : 'NotBoolean';
    } else {
      // TODO: (LOW PRIORITY) check more cases
      return 'NoHint';
    }
  }

  private onShown () {
    (this.$refs.name as BFormInput).focus();
  }
  private onOk (event: Event) {
    event.preventDefault();
    if (this.nameState === false) {
      return (this.$refs.name as BFormInput).focus();
    }
    if (this.javaTypeState === false) {
      return (this.$refs.javaType as AutoComplete).focus();
    }
    if (this.defaultValueState === false) {
      return (this.$refs.defaultValue as BFormInput).focus();
    }
    // TODO: (LOW PRIORITY) notice when three checkboxs are all unchecked
    this.$emit('ok', this.isNewProperty, this.getCurrentProperty());
    this.$nextTick(() => (this.$children[0] as BModal).hide());
  }
  private switchMode (e?: Event) {
    if (e !== undefined && typeof(e.preventDefault) === 'function') {
      e.preventDefault();
    }
    this.isNewProperty = !this.isNewProperty;
  }
}
</script>
