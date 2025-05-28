import { HeroSection } from '../components/about/Hero';
import { Story } from '../components/about/Story';
import { Supporters } from '../components/about/Supporters';
import { TeamSection } from '../components/about/Team';
import { CallToAction } from '../components/layout/CallToAction';
import { AboutMeta } from '../components/layout/Head';
import { Layout } from '../components/layout/Layout';

export default function About() {
  return (
    <Layout title="About Smart Invoice" metatags={<AboutMeta />}>
      <HeroSection maxWidth={1300} />
      <Story maxWidth={1300} />
      <TeamSection maxWidth={1300} />
      <Supporters maxWidth={1300} />
      <CallToAction maxWidth={1300} />
    </Layout>
  );
}
