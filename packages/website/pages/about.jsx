import { Layout } from "../components/layout/Layout"
import { HeroSection } from "../components/about/Hero"
import { Story } from "../components/about/Story"
import { TeamSection } from "../components/about/Team"
import { Supporters } from "../components/about/Supporters"
import { CallToAction } from "../components/layout/CallToAction"
import { Testimonials } from "../components/about/Testimonials"
import { AboutMeta } from "../components/layout/Head"


export default function About() {
  return (
    <Layout title="About Smart Invoice" metatags={<AboutMeta/>}>
      <HeroSection maxWidth={1300} />
      <Story maxWidth={1300} />
      <TeamSection maxWidth={1300} />
      <Supporters maxWidth={1300} />
      {/* <Testimonials maxWidth={1400} /> */}
      <CallToAction maxWidth={1300} />
    </Layout>
  )
}