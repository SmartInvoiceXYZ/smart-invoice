import { Button } from '@chakra-ui/react';
import { RWebShare } from 'react-web-share';

export const ShareButton = ({
  title,
  text,
  url,
}: {
  title: string;
  text: string;
  url: string;
}): JSX.Element => {
  return (
    <RWebShare
      data={{
        text,
        title,
        url,
      }}
    >
      <Button variant="outline" colorScheme="blue" size="sm">
        Share
      </Button>
    </RWebShare>
  );
};
