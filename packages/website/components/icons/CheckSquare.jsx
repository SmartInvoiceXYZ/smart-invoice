import { Icon } from '@chakra-ui/react';
import NextImage from 'next/image';
import React from 'react';

import avoid from '../../public/icons/boxed/avoid.svg';
import client from '../../public/icons/boxed/client.svg';
import menu from '../../public/icons/boxed/list.svg';
import pdf from '../../public/icons/boxed/pdf.svg';
import piechart from '../../public/icons/boxed/piechart.svg';
import progress from '../../public/icons/boxed/progress.svg';
import scale from '../../public/icons/boxed/scale.svg';
import search from '../../public/icons/boxed/search.svg';
import status from '../../public/icons/boxed/status.svg';
import trust from '../../public/icons/boxed/trust.svg';
import warning from '../../public/icons/boxed/warning.svg';

export function CustomIcon({ ...props }) {
  if (props.type === 'avoid') return <NextImage src={avoid} {...props} />;
  if (props.type === 'client') return <NextImage src={client} {...props} />;
  if (props.type === 'menu') return <NextImage src={menu} {...props} />;
  if (props.type === 'pdf') return <NextImage src={pdf} {...props} />;
  if (props.type === 'piechart') return <NextImage src={piechart} {...props} />;
  if (props.type === 'progress') return <NextImage src={progress} {...props} />;
  if (props.type === 'scale') return <NextImage src={scale} {...props} />;
  if (props.type === 'search') return <NextImage src={search} {...props} />;
  if (props.type === 'status') return <NextImage src={status} {...props} />;
  if (props.type === 'trust') return <NextImage src={trust} {...props} />;
  if (props.type === 'warning') return <NextImage src={warning} {...props} />;
}

export const CheckSquareIcon = ({ ...props }) => (
  <Icon viewBox="0 0 30 30" {...props} xmlns="http://www.w3.org/2000/svg">
    <rect width="30" height="30" rx="12" fill="currentColor" />
    <path
      d="M12 19.17L7.83 15L6.41 16.41L12 22L24 9.99997L22.59 8.58997L12 19.17Z"
      fill={props.checkcolor}
    />
  </Icon>
);
