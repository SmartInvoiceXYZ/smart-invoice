export const Textarea = {
  baseStyle: {},
  defaultProps: {
    variant: 'filled',
  },
  variants: {
    filled: {
      bg: 'white',
      color: 'black',
      border: '1px solid',
      borderColor: 'lightgrey',
      _hover: { borderColor: 'lightgrey' },
      _invalid: { border: '1px solid', borderColor: 'red' },
    },
  },
};
