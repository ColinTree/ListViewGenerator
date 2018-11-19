<!-- Some of following codes from https://github.com/robrogers3/vue-single-select/blob/master/src/VueSingleSelect.vue -->
<template>
  <b-input-group>
    <b-form-input
        :id="safeId()"
        ref="input"
        v-model="inputValue"
        :state="state"
        :name="name"
        :disabled="disabled"
        :required="required" />
    <div class="dropdown-toggler">
      <svg v-if="inputValue != ''" aria-hidden="true" @click="inputValue = ''" viewBox="0 0 512 512">
        <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm121.6 313.1c4.7 4.7 4.7 12.3 0 17L338 377.6c-4.7 4.7-12.3 4.7-17 0L256 312l-65.1 65.6c-4.7 4.7-12.3 4.7-17 0L134.4 338c-4.7-4.7-4.7-12.3 0-17l65.6-65-65.6-65.1c-4.7-4.7-4.7-12.3 0-17l39.6-39.6c4.7-4.7 12.3-4.7 17 0l65 65.7 65.1-65.6c4.7-4.7 12.3-4.7 17 0l39.6 39.6c4.7 4.7 4.7 12.3 0 17L312 256l65.6 65.1z" />
      </svg>
      <svg v-else aria-hidden="true" @click="toggleDropdown($nextTick(()=>$refs.input.focus()))" viewBox="0 0 448 512">
        <path v-if="shouldShowDropDown" d="M240.971 130.524l194.343 194.343c9.373 9.373 9.373 24.569 0 33.941l-22.667 22.667c-9.357 9.357-24.522 9.375-33.901.04L224 227.495 69.255 381.516c-9.379 9.335-24.544 9.317-33.901-.04l-22.667-22.667c-9.373-9.373-9.373-24.569 0-33.941L207.03 130.525c9.372-9.373 24.568-9.373 33.941-.001z" />
        <path v-else d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z" />
      </svg>
    </div>
    <ul v-show="matchingOptions && shouldShowDropDown" ref="options"
        tabindex="-1" class="dropdown">
      <li tabindex="-1"
          v-for="(option, idx) in matchingOptions" :key="idx"
          :class="idx === pointer ? 'active' : ''" style="cursor: pointer; outline: 0;"
          @mouseover="pointer = idx"
          @mouseenter="mousein = true" @mouseout="mousein = false"
          @click.prevent="onClickOption(option)">{{ option }}</li>
    </ul>
  </b-input-group>
</template>

<script>
import bIdMixin from "bootstrap-vue/es/mixins/id.js";
import bFormMixin from "bootstrap-vue/es/mixins/form.js";
import bFormStateMixin from "bootstrap-vue/es/mixins/form-state.js";

export default {
  name: "AutoComplete",
  mixins: [ bIdMixin, bFormMixin, bFormStateMixin ],
  mounted() {
    this.$refs.input.$el.addEventListener('focus', this.onFocus);
    this.$refs.input.$el.addEventListener('blur', this.onBlur);
    this.$refs.input.$el.addEventListener('keyup', this.onOnKeyUp);
  },
  data() {
    return {
      dropdownOpen: false,
      inputValue: this.value,
      hasFocus: false,
      pointer: -1,
      mousein: false
    }
  },
  props: {
    value: {
      type: String,
      required: true
    },
    options: {
      type: Array,
      required: true
    }
  },
  computed: {
    matchingOptions() {
      if (this.inputValue === null || !this.inputValue.length) {
        return this.options;
      }
      return this.options.filter(option =>
          option.toString().toLowerCase().includes(this.inputValue.toString().toLowerCase()));
    },
    shouldShowDropDown() {
      return this.hasFocus && this.dropdownOpen;
    }
  },
  methods: {
    focus() {
      this.$refs.input.focus();
    },
    onFocus() {
      this.hasFocus = true;
      this.toggleDropdown(true);
    },
    onBlur() {
      if (!this.mousein) {
        this.hasFocus = false;
        this.toggleDropdown(false);
      }
    },
    onOnKeyUp(e) {
      if (e.code == "Enter" || e.key == "Enter" || e.keyCode == 13) {
        e.preventDefault();
        this.onEnter();
        return false;
      } else if (e.code == "ArrowUp" || e.key == "ArrowUp" || e.keyCode == 38) {
        e.preventDefault();
        this.onArrowUp();
        return false;
      } else if (e.code == "ArrowDown" || e.key == "ArrowDown" || e.keyCode == 40) {
        e.preventDefault();
        this.onArrowDown();
        return false;
      } else if (e.code == "Escape" || e.key == "Escape" || e.keyCode == 27) {
        e.preventDefault();
        if (this.dropdownOpen) {
          this.toggleDropdown(false);
        }
        return false;
      }
    },
    onArrowUp() {
      if (this.pointer > 0) {
        this.pointer--;
      } else {
        this.pointer = this.matchingOptions.length - 1;
      }
    },
    onArrowDown() {
      if (this.pointer < this.matchingOptions.length - 1) {
        this.pointer++;
      } else {
        this.pointer = 0;
      }
    },
    onEnter() {
      if (this.pointer < 0 || this.pointer >= this.matchingOptions.length) {
        return;
      }
      this.inputValue = this.matchingOptions[this.pointer];
      this.pointer = -1;
      this.$nextTick(() => this.toggleDropdown(false));
    },
    onClickOption(option) {
      this.inputValue = option;
      this.pointer = -1;
      this.$nextTick(() => this.toggleDropdown(false));
    },
    toggleDropdown() {
      let targetDropdownState = false; // refer to closed
      if (arguments.length > 0 && typeof arguments[0] == "boolean") {
        targetDropdownState = arguments[0];
      }
      this.dropdownOpen = targetDropdownState;
    }
  },
  watch: {
    value(val) {
      this.inputValue = val;
    },
    inputValue(val) {
      this.$emit("input", val);
      if (this.hasFocus) {
        this.toggleDropdown(true);
      }
    }
  }
}
</script>

<style scoped>
input {
  box-sizing: border-box;
}
.dropdown-toggler {
  padding: 0 1em;
  right: 0;
  top: 0;
  bottom: 0;
  fill: #606f7b;
  position: absolute;
  display: flex;
  align-items: center;
  z-index: 3; /* refer to .input-group>.form-control:focus { z-index: 3; } */
}
.dropdown-toggler svg {
  cursor: pointer;
  width: 0.75em;
  height: 0.75em;
}
ul.dropdown {
  position: absolute;
  top: 37px;
  width: 100%;
  overflow: auto;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  margin-top: 1px;
  list-style: none;
  padding: 0;
  max-height: 220px;
  z-index: 100;
  -webkit-box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.12),
                      0 2px 4px 0 rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.12), 0 2px 4px 0 rgba(0, 0, 0, 0.08);
  background-color: #fff;
  color: #606f7b;
  border-radius: 0.25em;
  line-height: 1.25;
  text-align: left;
}
ul.dropdown li {
  padding: 0.5em 0.75em;
}
.active {
    background: #dae1e7;
}
</style>
