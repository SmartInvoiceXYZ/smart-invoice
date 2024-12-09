import { extendTheme } from '@chakra-ui/react';

export const colors = {
  blue: {
    1: '#3D88F8',
    2: '#2B69C5',
    3: '#1C59B3',
    4: '#0C3C84',
    dark: '#334D6E',
    hover: {
      1: 'rgba(61, 136, 248, 0.7)'
    }
  },
  charcoal: '#323C47',
  gray: {
    dark: '#707683',
    light: '#90A0B7',
    background: 'rgba(245, 246, 248, 1)',
  },
};

export const styles = {
  global: {
    'html, body': {
      color: '#707683',
      background: 'white',
    },
    'h1, h2': {
      color: '#323C47',
      fontWeight: 700,
    },
  },
};

export const theme = extendTheme({ colors, styles });
