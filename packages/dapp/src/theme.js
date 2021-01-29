import chakraTheme from '@chakra-ui/theme';

export const theme = {
  ...chakraTheme,
  initialColorMode: 'dark',
  useSystemColorMode: false,
  styles: {
    ...chakraTheme.styles,
    global: {
      ...chakraTheme.styles.global,
      body: {
        ...chakraTheme.styles.global.body,
        fontFamily: 'body',
        background: 'black',
        a: {
          textDecoration: 'none',
        },
      },
      '.web3modal-modal-lightbox': {
        zIndex: '20',
      },
    },
  },
  colors: {
    ...chakraTheme.colors,
    red: {
      ...chakraTheme.colors.red,
      200: '#ffe2eb',
      300: '#ffb1c3',
      400: '#ff7f9c',
      500: '#ff3864',
      600: '#b30027',
      700: '#81001c',
      800: '#4f0010',
      900: '#200005',
    },
    green: '#38FF88',
    background: '#262626',
    white20: 'rgba(255,255,255,0.2)',
    black30: 'rgba(0,0,0,0.3)',
    black80: 'rgba(0,0,0,0.8)',
    grey: '#A4A4A4',
    borderGrey: '#505050',
    gretText: '#ABABAB',
  },
  fonts: {
    ...chakraTheme.fonts,
    mono: `'Rubik Mono One', sans-serif`,
    heading: `'Rubik One', sans-serif`,
    body: `'Roboto', sans-serif`,
  },
};
