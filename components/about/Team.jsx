import { Box, Flex, Grid, GridItem, Heading, Link, Text } from "@chakra-ui/react";
import NextImage from 'next/image'
import NextLink from 'next/link'

import launchninjaPfp from '../../public/pfp/launchninja.svg'
import plorPfp from '../../public/pfp/plor.svg'
import tufnelPfp from '../../public/pfp/tufnel.svg'
import georgehPfp from '../../public/pfp/georgeh.svg'
import spengrahPfp from '../../public/pfp/spengrah.svg'
import dan13ramPfp from '../../public/pfp/dan13ram.svg'
import manoPfp from '../../public/pfp/manolingam.svg'
import jaqiPfp from '../../public/pfp/jaqi.svg'
import bingoPfp from '../../public/pfp/bingo.svg'

import facebookIcon from '../../public/icons/socials/facebook.svg'
import githubIcon from '../../public/icons/socials/github.svg'
import linkedinIcon from '../../public/icons/socials/linkedin.svg'
import twitterIcon from '../../public/icons/socials/twitter.svg'
import websiteIcon from '../../public/icons/socials/website.svg'

export function TeamSection({...props}) {
  const teamMembers = [
    {
      name: 'launchninja',
      position: 'Product Lead',
      pfp: launchninjaPfp,
      twitter: 'https://twitter.com/launchninja0x'
    },
    {
      name: 'plor',
      position: 'Project Manager',
      pfp: plorPfp,
      twitter: 'https://twitter.com/plor',
      github: 'https://github.com/plor'
    },
    {
      name: 'Tufnel_Enterprises',
      position: 'Developer',
      pfp: tufnelPfp,
      github: 'https://github.com/psparacino'
    },
    {
      name: 'georgeh',
      position: 'Developer',
      pfp: georgehPfp,
      github: 'https://github.com/geovgy'
    },
    {
      name: 'spengrah',
      position: 'Developer',
      pfp: spengrahPfp,
      twitter: 'https://twitter.com/spengrah'
    },
    {
      name: 'dan13ram',
      position: 'Developer',
      pfp: dan13ramPfp,
      twitter: 'https://twitter.com/dan13ram'
    },
    {
      name: 'manolingam',
      position: 'Developer',
      pfp: manoPfp,
      twitter: 'http://twitter.com/saimano1996'
    },
    {
      name: 'Jaqi',
      position: 'Designer',
      pfp: jaqiPfp,
      twitter: 'https://twitter.com/jaclynlenee',
      linkedin: 'https://www.linkedin.com/in/jaclynlenee/',
      website: 'https://www.jaclynlenee.com/'
    },
    {
      name: 'Bingo',
      position: 'Designer',
      pfp: bingoPfp,
      website: 'https://www.bingothedesigner.com/'
    }
  ]

  return (
    <Box background='blue.dark' textColor='white' paddingY={20} paddingX={8}>
      <Heading textAlign='center' textColor='white' mb={4}>
        A team of exceptional people
      </Heading>
      <Text textAlign='center'>
        Meet the team, past and present, that’s worked to make crypto invoicing and escrow free for all web3 freelancers.
      </Text>
      <Flex width='100%' justify='center' align='center' mt={20}>
        <Grid gridTemplateColumns='repeat(auto-fit, minmax(200px, 1fr))' gap={6} width='100%' maxWidth={1000}>
          {teamMembers.map(member => (
            <GridItem
              key={`griditem-${member.name}`}
              display='flex'
              flexDir='column'
              alignItems='center'
              background='white'
              borderRadius={10}
              padding={8}
            >
              <NextImage src={member.pfp} width={180} height={180} objectFit='cover' />
              <Heading fontSize={24} textColor='gray.dark' mt={4}>
                {member.name}
              </Heading>
              <Text textColor='blue.dark' fontSize={18} mt={1}>
                {member.position}
              </Text>
              <Flex justify='center' align='center' gap={4} mt={6}>
                {member.facebook && (
                  <NextLink href={member.facebook} passHref>
                    <Link cursor='pointer' target='_blank'>
                      <NextImage src={facebookIcon} width={48} height={48} />
                    </Link>
                  </NextLink>
                )}
                {member.twitter && (
                  <NextLink href={member.twitter} passHref>
                    <Link cursor='pointer' target='_blank'>
                      <NextImage src={twitterIcon} width={48} height={48} />
                    </Link>
                  </NextLink>
                )}
                {member.linkedin && (
                  <NextLink href={member.linkedin} passHref>
                    <Link cursor='pointer' target='_blank'>
                      <NextImage src={linkedinIcon} width={48} height={48} />
                    </Link>
                  </NextLink>
                )}
                {member.github && (
                  <NextLink href={member.github} passHref>
                    <Link cursor='pointer' target='_blank'>
                      <NextImage src={githubIcon} width={48} height={48} />
                    </Link>
                  </NextLink>
                )}
                {member.website && (
                  <NextLink href={member.website} passHref>
                    <Link cursor='pointer' target='_blank'>
                      <NextImage src={websiteIcon} width={48} height={48} />
                    </Link>
                  </NextLink>
                )}
              </Flex>
            </GridItem>
          ))}
        </Grid>
      </Flex>
    </Box>
  )
}