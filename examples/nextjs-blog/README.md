# MarkdownDB Next.js Blog Tutorial

This tutorial guides you through creating a simple Next.js-based blog using MarkdownDB. MarkdownDB empowers you to treat markdown files as a database, simplifying content management and querying.

## Step 1: Set Up a Next.js Project

Begin by creating a Next.js project. If Next.js is not installed, execute the following command:

```bash
npx create-next-app nextjs-blog
cd nextjs-blog
```

## Step 2: Create a Folder for Blog Posts

Establish a folder to store your blog posts within your project. For instance:

```bash
mkdir src/content
cd src/content
```

Inside the content folder, create three sample blog posts using markdown, such as:

```bash
- embracing-minimalism.md
- remote-work-productivity.md
```

## Step 3: Index Markdown Files into SQLite Database

After preparing markdown files, store their metadata in a database using the MarkdownDB CLI. Execute the following command:

```bash
npx mddb ./content
```

## step 4: move `.markdowndb` folder with `files.json` to the src directory

## Step 5: Load Blog Posts Using MarkdownDB

Create a file for your blog listing page, e.g., `pages/blog.js`. Use the following code snippet:

**Component 1: BlogList**

```jsx
// blog-list.js
import Link from "next/link";

const BlogPostsList = ({ posts }) => {
  if (!posts || !Array.isArray(posts)) {
    return (
      <div>
        <h2>No Blog Posts Available</h2>
      </div>
    );
  }

  return (
    <div>
      <h2>Blog Posts</h2>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/blog/${post.url_path}`}>
              <h3>{post.metadata.title}</h3>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BlogPostsList;
```

Create a file for your blog page, `pages/blog/[url_path].js`. Use the following code snippet:

**Component 2: BlogItem**

```jsx
import ReactMarkdown from "react-markdown";
import fs from "fs";
import path from "path";

const BlogPost = ({ post }) => {
  const removeMetadata = (content) => {
    // Assuming metadata is between '---' at the beginning of the content
    const metadataRegex = /^---[\s\S]*?---/;
    return content.replace(metadataRegex, "");
  };

  return (
    <div>
      <h1>{post.metadata.title}</h1>
      <ul>
        <li>
          <strong>Tags:</strong> {post.tags.join(", ")}
        </li>
      </ul>
      <div>
        <ReactMarkdown>{removeMetadata(post.content)}</ReactMarkdown>
      </div>
    </div>
  );
};

export async function getStaticPaths() {
  const filePath = path.join(process.cwd(), "src/.markdowndb/files.json");
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const posts = JSON.parse(fileContent);

  // Generate paths for all posts
  const paths = posts.map((post) => ({
    params: { url_path: post.url_path },
  }));

  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), "src/.markdowndb/files.json");
  const jsonContent = fs.readFileSync(filePath, "utf-8");
  const posts = JSON.parse(jsonContent);
  const post = posts.find((post) => post.url_path === params.url_path);

  const contentPath = path.join(
    process.cwd(),
    `src/content/${params.url_path}.md`
  );
  const content = fs.readFileSync(contentPath, "utf-8");
  post.content = content;

  return {
    props: {
      post,
    },
  };
}

export default BlogPost;
```

## Step 6: Run Your Next.js App

Run your Next.js app to view your blog in action:

```bash
npm run dev
```

Visit http://localhost:3000/blog to see your blog posts listed.

Congratulations! You've successfully created a simple Next.js blog using MarkdownDB. Explore more features and customize your blog as needed.
