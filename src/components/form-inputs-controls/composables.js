import { computed } from 'vue';

/**
 * Syncs the error and validation state with the underlying vuetify component.
 * @param {import("vue").Ref<unknown>} elementRef The template ref to the base vuetify component.
 * @returns {import("vue").Ref<string>} Error message to display. Is empty string if either there are no error messages or if the validation errors are not displayed because
 * no interaction with the component or validation was reset by form. Validation errors have precedence over custom error messages.
 */
// eslint-disable-next-line import/prefer-default-export
export function useErrorSync(elementRef) {
  return computed(() => {
    // if element is already mounted
    if (elementRef.value) {
      // errorMessages of selectField can either be (empty) array or string. Makes sure it is array.
      const customErrorMessages = Array.isArray(elementRef.value.errorMessages)
        ? elementRef.value.errorMessages
        : [elementRef.value.errorMessages];
      // if validationState is 'error' (reset button removes this) or if there is errorMessages prop
      if (
        elementRef.value.validationState === 'error' ||
        !!customErrorMessages.length
      ) {
        // custom errorMessages are displayed when all validation error are solved.
        return (
          [...elementRef.value.errorBucket, ...customErrorMessages][0] || ''
        );
      }
    }
    return '';
  });
}
