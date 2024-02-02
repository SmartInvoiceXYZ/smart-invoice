import { extendTheme } from '@chakra-ui/react';
import { css } from '@emotion/react';

import { colors } from './colors';
import { Button, Checkbox, Input, Link, Textarea } from './components';

export const theme = extendTheme({
  initialColorMode: 'light',
  useSystemColorMode: false,
  colors,
  components: {
    Button,
    Checkbox,
    Input,
    Link,
    Textarea,
  },
  fonts: {
    mono: `'Poppins', sans-serif`,
    heading: `'Poppins', sans-serif`,
    body: `'Poppins', sans-serif`,
  },
});

export const globalStyles = css`
  /*
    This will hide the focus indicator if the element receives focus via the mouse,
    but it will still show up on keyboard focus.
  */
  .js-focus-visible :focus:not([data-focus-visible-added]) {
    box-shadow: none;
  }
  *:focus {
    outline: none;
    border-color: ${theme.colors.blue} !important;
    box-shadow: 0 0 0 1px ${theme.colors.blue} !important;
  }
  input[type='date']::-webkit-calendar-picker-indicator {
    opacity: 1;
    display: block;
    background: url(/assets/calendar.svg) no-repeat;
    background-size: contain !important;
    width: 14px;
    height: 14px;
    border-width: thin;
    cursor: pointer;
    transition: background 0.25s;
    &:hover {
      background: url(/assets/calendar-hover.svg) no-repeat;
      background-size: contain;
    }
    &:hover,
    &:focus,
    &:active {
      background-size: contain;
      outline: none;
    }
  }
  select option {
    background: ${theme.colors.white} !important;
    color: ${theme.colors.black};
  }
  body {
    font-family: ${theme.fonts.body};
    background: ${theme.colors.white};
  }
  .web3modal-modal-lightbox {
    zindex: 20;
  }
`;
