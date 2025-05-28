import { Button } from '@chakra-ui/react';
import { RWebShare } from 'react-web-share';

import { ShareIcon } from '../icons';

export const ShareButton: React.FC<{
  title: string;
  text: string;
  url: string;
}> = ({ title, text, url }) => {
  return (
    <RWebShare
      data={{
        text,
        title,
        url,
      }}
    >
      <Button
        variant="ghost"
        bg="none"
        colorScheme="blue"
        h="auto"
        w="auto"
        minW="2"
        p={1}
      >
        <ShareIcon boxSize={5} />
      </Button>
    </RWebShare>
  );
};
