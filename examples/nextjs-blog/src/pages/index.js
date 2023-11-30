import fs from "fs"
import Link from 'next/link';
import styles from '@/styles/Home.module.css'

export default function Home({ posts }) {
  return (
    <>
      <main className={styles.main}>
        <div>
          <h2>Blog Posts</h2>
          <ul>
            {posts.map((post) => (
              <li key={post._id}>
                <Link href={`/blog/${post.url_path}`}>
                  <h3>{post.metadata.title}</h3>
                </Link>
              </li>
            ))}
          </ul>
        </div>
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
