import fs from "fs";

export default function Home({ posts }) {
  return (
    <>
      <main>
        <div>
          <h2>Blog Posts</h2>
          <ul>
            {posts.map((post) => (
              <li>
                <h3>{post.metadata.title}</h3>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}

export async function getStaticProps() {
  const filePath = "src/.markdowndb/files.json";
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const posts = JSON.parse(fileContent);

  return {
    props: {
      posts,
    },
  };
}
