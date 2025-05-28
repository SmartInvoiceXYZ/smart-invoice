import React from 'react';

import { DemoSection } from '../components/home/Demo';
import { FAQSection } from '../components/home/FAQ';
import { FeatureArbitration } from '../components/home/FeatureArbitration';
import { FeatureCrypto } from '../components/home/FeatureCrypto';
import { FeatureEscrow } from '../components/home/FeatureEscrow';
import { FeatureInvoice } from '../components/home/FeatureInvoice';
import { HeroSection } from '../components/home/Hero';
import { StoryOverviewSection } from '../components/home/StoryOverview';
import { Testimonials } from '../components/home/Testimonials';
import { CallToAction } from '../components/layout/CallToAction';
import { HomeMeta } from '../components/layout/Head';
import { Layout } from '../components/layout/Layout';

export default function Home() {
  return (
    <Layout
      title="Smart Invoice | Crypto Invoicing & Escrow Software"
      metatags={<HomeMeta />}
    >
      <HeroSection maxWidth={1300} />
      <FeatureCrypto maxWidth={1300} />
      <FeatureInvoice maxWidth={1300} />
      <FeatureEscrow maxWidth={1300} />
      <FeatureArbitration maxWidth={1300} />
      <Testimonials maxWidth={1300} />
      <DemoSection maxWidth={1300} />
      <StoryOverviewSection maxWidth={1300} />
      <FAQSection maxWidth={1300} />
      <CallToAction maxWidth={1300} />
    </Layout>
  );
}
