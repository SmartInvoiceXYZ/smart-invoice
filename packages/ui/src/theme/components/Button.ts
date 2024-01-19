const Button = {
  baseStyle: {},
  defaultProps: {
    variant: 'solid',
  },
  variants: {
    solid: {
      _hover: { backgroundColor: 'rgba(61, 136, 248, 0.7)' },
      _active: { backgroundColor: 'rgba(61, 136, 248, 0.7)' },
      color: 'white',
      backgroundColor: 'blue.1',
    },
  },
};

export default Button;
