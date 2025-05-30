import { Box, Heading } from '@chakra-ui/react';
import fs from 'fs';
import matter from 'gray-matter';
import { marked } from 'marked';
import path from 'path';

import { DocLayout } from '../../components/doc-layout/DocLayout';

export async function getStaticPaths() {
  const files = fs.readdirSync(path.join('docs-v3', 'misc'));
  const paths = files.map(filename => ({
    params: {
      slug: filename.replace('.md', ''),
    },
  }));

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const markdown = fs.readFileSync(
    path.join('docs-v3', 'misc', `${params.slug}.md`),
    'utf-8',
  );
  const { data: frontmatter, content } = matter(markdown);

  return {
    props: {
      frontmatter,
      slug: params.slug,
      content,
    },
  };
}

export default function DocPage({ frontmatter, slug, content, docs }) {
  return (
    <DocLayout docs={docs} active={slug} title={frontmatter.title}>
      <Box maxWidth={700}>
        <Heading mb={8}>{frontmatter.title}</Heading>
        <Box
          className="doc-body"
          dangerouslySetInnerHTML={{ __html: marked(content) }}
        />
      </Box>
    </DocLayout>
  );
}
