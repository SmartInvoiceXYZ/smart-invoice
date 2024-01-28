/* eslint-disable import/no-unresolved */
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import React from 'react';

import getHashCode from '../util/getHashCode';
import styles from './styles.module.css';

const features = [
  {
    title: 'Streamlined Experience',
    imageUrl: 'img/undraw_docusaurus_mountain.svg',
    description: <>Enabling a simple interface to create and view payments</>,
  },
  {
    title: 'Information Access',
    imageUrl: 'img/undraw_docusaurus_tree.svg',
    description: (
      <>Providing reliable, auditable, and immutable information flows.</>
    ),
  },
  {
    title: 'Contractual Enforcement',
    imageUrl: 'img/undraw_docusaurus_react.svg',
    description: <>Through Impartial third-party dispute resolution</>,
  },
];

function Feature({ imageUrl, title, description }) {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={clsx('col col--4', styles.feature)}>
      {imgUrl && (
        <div className="text--center">
          <img className={styles.featureImage} src={imgUrl} alt={title} />
        </div>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default function Home() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Description will go into a meta tag in <head />"
    >
      <header className={clsx('hero hero--primary', styles.heroBanner)}>
        <div className="container">
          <h1 className="hero__title">{siteConfig.title}</h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link
              className={clsx(
                'button button--outline button--secondary button--lg',
                styles.getStarted,
              )}
              to={useBaseUrl('docs/introducing-smart-invoice')}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>
      <main>
        {features && features.length > 0 && (
          <section className={styles.features}>
            <div className="container">
              <div className="row">
                {features.map(props => (
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  <Feature key={getHashCode(props.title)} {...props} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </Layout>
  );
}
