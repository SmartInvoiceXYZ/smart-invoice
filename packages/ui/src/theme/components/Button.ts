export const Button = {
  baseStyle: {
    fontWeight: 'normal',
  },
  defaultProps: {
    variant: 'solid',
  },
  variants: {
    solid: {
      _hover: { backgroundColor: 'rgba(61, 136, 248, 0.7)' },
      _active: { backgroundColor: 'rgba(61, 136, 248, 0.7)' },
      color: 'white',
      backgroundColor: 'blue.1',
      fontFamily: 'mono',
    },
    max: {
      color: 'blue.1',
      borderColor: 'blue.1',
      borderWidth: 1,
      backgroundColor: 'white',
      width: '300px',
      minH: '200px',
      paddingY: 6,
      _hover: { backgroundColor: 'rgba(61, 136, 248, 1)', color: 'white' },
      _active: { backgroundColor: 'rgba(61, 136, 248, 1)', color: 'white' },
    },
  },
};
