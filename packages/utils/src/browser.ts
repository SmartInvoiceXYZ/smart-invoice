/* eslint-disable no-undef */
// https://developer.mozilla.org/en-US/docs/Web/API/CSS/supports
// https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter#Browser_compatibility
export const isBackdropFilterSupported = () =>
  typeof CSS !== 'undefined' &&
  CSS.supports != null &&
  (CSS.supports('-webkit-backdrop-filter', 'blur(1px)') ||
    CSS.supports('backdrop-filter', 'blur(1px)'));
