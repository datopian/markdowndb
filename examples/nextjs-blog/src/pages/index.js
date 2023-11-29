import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import BlogPostsList from "./blog-list"
import fs from "fs"

export default function Home({ posts }) {
  return (
    <>
      <Head>
        <title>Markdowndb blog</title>
        <meta name="description" content="Made by Markdowndb" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <BlogPostsList posts={posts} />
      </main>
    </>
  )
}

export async function getStaticProps() {
  const filePath = 'src/.markdowndb/files.json';
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const posts = JSON.parse(fileContent);

  return {
    props: {
      posts,
    },
  };
}
