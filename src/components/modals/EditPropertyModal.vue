<template>
  <div>
    <b-modal
        size="lg"
        :title="isNewProperty ? $t('modal.editProperty.titleAdd') : $t('modal.editProperty.titleEdit')"
        centered
        :ok-title="nameConflit ? $t('modal.editProperty.switchMode') : $t('button.applyAndClose')"
        :cancel-title="$t('button.cancel')"
        :ok-variant="nameConflit ? 'danger' : 'primary'"
        cancel-variant="outline-secondary"
        hide-header-close
        no-close-on-backdrop
        no-close-on-esc
        @shown="onShown"
        @ok="nameConflit ? switchMode($event) : onOk($event)">

      <!-- NAME -->
      <b-form-group
          horizontal :label-cols="titleWidth"
          :label="$t('modal.editProperty.name')"
          label-for="property_name"
          :state="nameState"
          :invalid-feedback="$t('modal.editProperty.name' + nameFeedback)">
        <b-input-group>
          <b-form-input
              id="property_name"
              ref="name"
              :state="nameState"
              v-model="name" />
        </b-input-group>
      </b-form-group>

      <!-- DESIGNER VIEW VISIBLE -->
      <b-form-group
          horizontal :label-cols="titleWidth"
          label-for="property_designerVisible">
        <b-form-checkbox
            id="property_designerVisible"
            v-model="designerVisible"
            :value="true" :unchecked-value="false">{{ $t("modal.editProperty.designerVisible") }}</b-form-checkbox>
      </b-form-group>

      <!-- EDITOR TYPE -->
      <b-form-group
          horizontal :label-cols="titleWidth"
          :label="$t('modal.editProperty.editorType')"
          label-for="property_editorType">
        <b-form-select
            id="property_editorType"
            v-model="editorType">
          <optgroup :label="$t('modal.editProperty.editorTypeRecommended')">
            <option v-for="opt in editorTypeRecommendedOptions" :key="opt" :value="opt">{{ opt }}</option>
          </optgroup>
          <optgroup :label="$t('modal.editProperty.editorTypeNotRecommended')">
            <option v-for="opt in editorTypeNotRecommendedOptions" :key="opt" :value="opt">{{ opt }}</option>
          </optgroup>
        </b-form-select>
      </b-form-group>

      <!-- DESIGNER VIEW VISIBLE -->
      <b-form-group
          horizontal :label-cols="titleWidth">
        <b-input-group>
          <b-form-checkbox
              v-model="setterVisible"
              :value="true" :unchecked-value="false">{{ $t("modal.editProperty.setterVisible") }}</b-form-checkbox>
          <b-form-checkbox
              v-model="getterVisible"
              :value="true" :unchecked-value="false">{{ $t("modal.editProperty.getterVisible") }}</b-form-checkbox>
        </b-input-group>
      </b-form-group>

      <!-- EDITOR TYPE -->
      <b-form-group
          horizontal :label-cols="titleWidth"
          :label="$t('modal.editProperty.category')"
          label-for="property_category">
        <b-form-select
            id="property_category"
            v-model="category">
          <option value="unset" v-t="'modal.editProperty.categoryUnset'" />
          <option value="appearance" v-t="'modal.editProperty.categoryAppearance'" />
          <option value="behavior" v-t="'modal.editProperty.categoryBehavior'" />
          <option value="deprecated" v-t="'modal.editProperty.categoryDeprecated'" />
        </b-form-select>
      </b-form-group>

      <!-- DESCRIPTION -->
      <b-form-group
          horizontal :label-cols="titleWidth"
          :label="$t('modal.editProperty.description')"
          label-for="property_description">
        <b-input-group>
          <b-form-input
              id="property_description"
              v-model="description" />
        </b-input-group>
      </b-form-group>

      <!-- JAVA TYPE -->
      <b-form-group
          horizontal :label-cols="titleWidth"
          :label="$t('modal.editProperty.javaType')"
          label-for="property_javaType"
          :state="javaTypeState"
          :invalid-feedback="$t('modal.editProperty.defaultValueEmpty')">
        <AutoComplete
            id="property_javaType"
            ref="javaType"
            v-model="javaType"
            :options="javaTypeAutoCompleteItems"
            :state="javaTypeState" />
      </b-form-group>

      <!-- DEFAULT VALUE -->
      <b-form-group
          horizontal :label-cols="titleWidth"
          :label="$t('modal.editProperty.defaultValue')"
          label-for="property_defaultValue"
          :state="defaultValueState"
          :description="$t('modal.editProperty.defaultValue' + defaultValueHint)"
          :invalid-feedback="$t('modal.editProperty.defaultValueEmpty')">
        <b-input-group>
          <b-form-input
              id="property_defaultValue"
              ref="defaultValue"
              :state="defaultValueState"
              v-model="defaultValue" />
        </b-input-group>
      </b-form-group>
    </b-modal>
  </div>
</template>

<script>
import AutoComplete from "../form/AutoComplete"

import stringUtils from "../../utils/stringUtils"

export default {
  name: "EditPropertyModal",
  components: {
    AutoComplete
  },
  data() {
    return {
      isNewProperty: false,
      titleWidth: 3,

      name: "",
      designerVisible: true,
      editorType: "text",
      editorTypeRecommendedOptions: [
        "asset","boolean","color","component","float","integer","non_negative_float","non_negative_integer",
        "text","textArea","textalignment","visibility"
      ],
      editorTypeNotRecommendedOptions: [
        "accelerometer_sensitivity","BluetoothClient","button_shape","choices","countries","FirbaseURL",
        "geographic_point","geojson_type","horizontal_alignment","languages","latitude","longitude",
        "lego_ev3_color_sensor_mode","lego_ev3_generated_color","lego_ev3_gyro_sensor_mode","lego_ev3_sensor_port",
        "lego_ev3_sound_sensor_mode","lego_ev3_ultrasonic_sensor_mode","lego_nxt_generated_color","lego_nxt_sensor_port",
        "map_type","map_zoom","scaling","screen_animation","screen_orientation","sensor_dist_interval",
        "sensor_time_interval","sizing","text_receiving","theme","toast_length","typeface","vertical_alignment"
      ],
      setterVisible: true,
      getterVisible: true,
      category: "unset",
      description: "",
      javaType: "String",
      javaTypeAutoCompleteItems: ["boolean", "Component", "double", "float", "int", "long", "String", "YailList"],
      defaultValue: ""
    }
  },
  computed: {
    nameEmpty() {
      return this.name == "";
    },
    nameFirstCharError() {
      return !/[a-z_]/i.test(this.name.charAt(0));
    },
    nameConstitutionError() {
      return this.name.search(/[a-z_]\w*$/gi) != 0;
    },
    nameConflit() {
      return this.nameEmpty
          ? false
          : this.$parent.checkPropertyExist(this.name) === this.isNewProperty;
    },
    nameState() {
      return this.nameEmpty || this.nameFirstCharError || this.nameConstitutionError || this.nameConflit
          ? false : null;
    },
    nameFeedback() {
      if (this.nameEmpty) {
        return "Empty";
      } else if (this.nameFirstCharError) {
        return "FirstCharError";
      } else if (this.nameConstitutionError) {
        return "ConstitutionError";
      } else if (this.nameConflit) {
        return this.isNewProperty ? "ConflitAdd" : "ConflitEdit";
      } else {
        return "";
      }
    },
    javaTypeState() {
      return this.javaType == "" || this.javaType == null ? false : null;
    },
    defaultValueEmpty() {
      return this.defaultValue == "";
    },
    defaultValueConstantLike() {
      return this.defaultValue.search(/[a-z\.][\w\.]*$/gi) == 0;
    },
    defaultValueState() {
      return this.defaultValueEmpty ? false : null;
    },
    defaultValueHint() {
      if (this.defaultValueEmpty) {
        return "NoHint"; // will be show in form of invalid feedback
      } else if (this.javaType == "int" || this.javaType == "long") {
        let num = this.defaultValue;
        if (this.javaType == "long") {
          let result = stringUtils.removeSuffix(num, "l");
          num = result != num ? result : stringUtils.removeSuffix(num, "L");
        }
        num = Number(num);
        return this.defaultValueConstantLike || !isNaN(num) && Number.isInteger(num)
            ? "NoHint"
            : "NotInt";
      } else if (this.javaType == "float" || this.javaType == "double") {
        let num = this.defaultValue;
        let suffix = this.javaType.charAt(0);
        let result = stringUtils.removeSuffix(num, suffix);
        num = result != num ? result : stringUtils.removeSuffix(num, suffix.toUpperCase());
        num = Number(num);
        return this.defaultValueConstantLike || !isNaN(num)
            ? "NoHint"
            : "NotDecimal";
      } else if (this.javaType == "boolean") {
        let val = this.defaultValue;
        return this.defaultValueConstantLike || val == "true" || val == "false" || val === true || val === false
            ? "NoHint"
            : "NotBoolean";
      } else { // TODO: (LOW PRIORITY) add more
        return "NoHint";
      }
    },
    valuesInFields() {
      return {
        isNewProperty: this.isNewProperty,
        name: this.name,
        designerVisible: this.designerVisible,
        editorType: this.editorType,
        setterVisible: this.setterVisible,
        getterVisible: this.getterVisible,
        category: this.category,
        description: this.description,
        javaType: this.javaType,
        defaultValue: this.defaultValue
      }
    }
  },
  methods: {
    onShown() {
      this.$refs.name.focus();
    },
    onOk(event) {
      event.preventDefault();
      if (this.nameState == false) {
        return this.$refs.name.focus();
      }
      if (this.javaTypeState == false) {
        return this.$refs.javaType.focus();
      }
      if (this.defaultValueState == false) {
        return this.$refs.defaultValue.focus();
      }
      // TODO: (LOW PRIORITY) notice when three checkbox are all unchecked
      this.$emit("ok", this.valuesInFields);
      this.$children[0].hide();
    },
    switchMode(e = {}) {
      if (typeof(e.preventDefault) == "function") {
        e.preventDefault();
      }
      this.isNewProperty = !this.isNewProperty;
    },
    showModal(isNewProp, property) {
      this.isNewProperty = isNewProp;
      property = isNewProp ? {} : property;
      this.$children[0].show();
      
      this.name = property.hasOwnProperty("name") ? property.name : "";
      this.designerVisible = property.hasOwnProperty("designerVisible") ? property.designerVisible : true;
      this.editorType = property.hasOwnProperty("editorType") ? property.editorType : "text";
      this.setterVisible = property.hasOwnProperty("setterVisible") ? property.setterVisible : true;
      this.getterVisible = property.hasOwnProperty("getterVisible") ? property.getterVisible : true;
      this.category = property.hasOwnProperty("category") ? property.category : "unset";
      this.description = property.hasOwnProperty("description") ? property.description : "";
      this.javaType = property.hasOwnProperty("javaType") ? property.javaType : "String";
      this.defaultValue = property.hasOwnProperty("defaultValue") ? property.defaultValue : "";
    }
  }
}
</script>