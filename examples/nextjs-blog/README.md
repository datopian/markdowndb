# MarkdownDB Next.js Blog Tutorial

This tutorial guides you through creating a simple Next.js-based blog using MarkdownDB. MarkdownDB empowers you to treat markdown files as a database, simplifying content management and querying.

## Step 1: Set Up a Next.js Project

Begin by creating a Next.js project. If Next.js is not installed, execute the following command, and make sure to include Tailwind:

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

Inside the content folder, create two sample blog posts using markdown, such as:

```bash
- embracing-minimalism.md
- remote-work-productivity.md
```

## Step 3: Index Markdown Files into SQLite Database

After preparing markdown files, store their metadata in a database using the MarkdownDB CLI. Execute the following command:

```bash
npx mddb ./content
```

## Step 4: Move `.markdowndb` Folder with `files.json` to the src Directory

## Step 5: Load Blog Posts Using MarkdownDB

Edit `pages/index.js`. Use the following code snippet:

### Component 1: BlogList

```jsx
import fs from "fs";
import Link from "next/link";
import styles from "@/styles/Home.module.css";

export default function Home({ posts }) {
  return (
    <>
      <main className={styles.main}>
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
```

## Step 6: Run Your Next.js App

Run your Next.js app to view your blog in action:

```bash
npm run dev
```

Visit http://localhost:3000/blog to see your blog posts listed.

Congratulations! You've successfully created a simple Next.js blog using MarkdownDB. Explore more features and customize your blog as needed.


### Flag: While `mddb` may not offer significantly more than manual handling, it stands out as a straightforward, extensively tested, and lightweight library.

### Additional Features:

- **Tag Querying:** Easily retrieve tags from all files, streamlining organization and categorization.
- **Backward/Forward Links:** Establish links for enhanced file interconnectivity and navigation.
- **Custom Field Calculation:** Automatically calculate custom fields based on file content, reducing manual effort.
- **Schema Validation:** Ensure file adherence to a predefined schema for data integrity.
