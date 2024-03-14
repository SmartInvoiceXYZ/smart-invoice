export const Input = {
  baseStyle: {},
  defaultProps: {
    variant: 'outline',
  },
  variants: {
    outline: {
      field: {
        bg: 'white',
        color: 'black',
        border: '1px solid',
        borderColor: 'lightgrey',
        // _hover: { borderColor: 'lightgrey' },
        _invalid: { borderWidth: '2px', borderColor: 'red.500' },
        // _invalid={{ border: '1px solid', borderColor: 'red' }}
      },
    },
  },
};
