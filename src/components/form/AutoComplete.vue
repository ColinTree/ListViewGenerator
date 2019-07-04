<!-- Some of following codes from https://github.com/robrogers3/vue-single-select/blob/master/src/VueSingleSelect.vue -->
<template>
  <b-input-group>
    <b-input
        :id="id"
        ref="input"
        v-model="syncedValue"
        :state="state"
        :name="name"
        :disabled="disabled"
        :required="required" />
    <div class="dropdown-toggler">
      <svg v-if="syncedValue != ''" aria-hidden="true" @click="syncedValue = ''" viewBox="0 0 512 512">
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
          :class="idx === pointer ? 'active' : ''" style="cursor: pointer; outline: 0"
          @mouseover="pointer = idx"
          @mouseenter="mousein = true" @mouseout="mousein = false"
          @click.prevent="onOptionSelected(option)" v-text="option" />
    </ul>
  </b-input-group>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, PropSync } from 'vue-property-decorator'
import { BFormInput } from 'bootstrap-vue'

@Component
export default class AutoComplete extends Vue {

  @Prop({ type: String, default: null })
  private readonly id!: string | null

  @Prop({ type: [ Boolean, String ], default: null })
  private readonly state!: string | boolean | null

  @Prop({ type: String, default: '' })
  private readonly name!: string

  @Prop({ type: Boolean, default: false })
  private readonly disabled!: boolean

  @Prop({ type: Boolean, default: false })
  private readonly required!: boolean

  @Prop({ type: Array, required: true })
  private readonly options!: string[]

  @PropSync('value', { type: String, required: true })
  private syncedValue!: string

  private dropdownOpen = false
  private hasFocus = false
  private pointer = -1
  private mousein = false

  get matchingOptions () {
    if (this.syncedValue === null || !this.syncedValue.length) {
      return this.options
    }
    return this.options.filter(option =>
        option.toString().toLowerCase().includes(this.syncedValue.toString().toLowerCase()))
  }
  get shouldShowDropDown () {
    return this.hasFocus && this.dropdownOpen
  }

  public focus () {
    (this.$refs.input as BFormInput).focus()
  }

  private mounted () {
    (this.$refs.input as BFormInput).$el.addEventListener('focus', this.onFocus);
    (this.$refs.input as BFormInput).$el.addEventListener('blur', this.onBlur);
    (this.$refs.input as BFormInput).$el.addEventListener('keyup', this.onKeyUp)
  }

  private onFocus () {
    this.hasFocus = true
    this.toggleDropdown(true)
  }
  private onBlur () {
    if (!this.mousein) {
      this.hasFocus = false
      this.toggleDropdown(false)
    }
  }
  private onKeyUp (event: Event) {
    const e = event as KeyboardEvent
    if (e.code === 'Enter' || e.key === 'Enter' || e.keyCode === 13) {
      e.preventDefault()
      this.onEnter()
      return false
    } else if (e.code === 'ArrowUp' || e.key === 'ArrowUp' || e.keyCode === 38) {
      e.preventDefault()
      this.onArrowUp()
      return false
    } else if (e.code === 'ArrowDown' || e.key === 'ArrowDown' || e.keyCode === 40) {
      e.preventDefault()
      this.onArrowDown()
      return false
    } else if (e.code === 'Escape' || e.key === 'Escape' || e.keyCode === 27) {
      e.preventDefault()
      if (this.dropdownOpen) {
        this.toggleDropdown(false)
      }
      return false
    }
    return true
  }
  private onArrowUp () {
    if (this.pointer > 0) {
      this.pointer --
    } else {
      this.pointer = this.matchingOptions.length - 1
    }
  }
  private onArrowDown () {
    if (this.pointer < this.matchingOptions.length - 1) {
      this.pointer++
    } else {
      this.pointer = 0
    }
  }
  private onEnter () {
    if (this.pointer < 0 || this.pointer >= this.matchingOptions.length) {
      return
    }
    this.syncedValue = this.matchingOptions[this.pointer]
    this.pointer = -1
    this.$nextTick(() => this.toggleDropdown(false))
  }
  private onOptionSelected (option: string) {
    this.syncedValue = option
    this.pointer = -1
    this.$nextTick(() => this.toggleDropdown(false))
  }
  private toggleDropdown (to: boolean = false) {
    this.dropdownOpen = to
  }

}
</script>

<style>
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
