export const Input = {
  baseStyle: {},
  defaultProps: {
    variant: 'filled',
  },
  variants: {
    filled: {
      field: {
        bg: 'white',
        color: 'black',
        border: '1px solid',
        borderColor: 'lightgrey',
        // _hover: { borderColor: 'lightgrey' },
        _invalid: { borderWidth: '2px', borderColor: 'red.500' },
      },
    },
  },
};
