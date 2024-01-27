import { extendTheme } from '@chakra-ui/react';
import { css } from '@emotion/react';

import { Button, Input, Textarea } from './components';

export const theme = extendTheme({
  initialColorMode: 'light',
  useSystemColorMode: false,
  colors: {
    red: {
      200: '#ffe2eb',
      300: '#ffb1c3',
      400: '#ff7f9c',
      500: '#ff3864',
      600: '#b30027',
      700: '#81001c',
      800: '#4f0010',
      900: '#200005',
    },
    blue: {
      1: '#3D88F8',
      2: '#2B69C5',
      3: '#1C59B3',
      4: '#0C3C84',
      dark: '#334D6E',
    },
    green: '#38FF88',
    background: 'white',
    white10: 'rgba(255,255,255,0.1)',
    white20: 'rgba(255,255,255,0.2)',
    black30: 'rgba(0,0,0,0.3)',
    black80: 'rgba(0,0,0,0.8)',
    grey: '#A4A4A4',
    borderGrey: '#505050',
    greyText: '#ABABAB',
    purple: '#702b89',
    red50: 'rgba(255, 56, 100, 0.5)',
  },
  components: {
    Button,
    Input,
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
