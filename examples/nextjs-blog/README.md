# MarkdownDB Next.js Blog Tutorial

This tutorial guides you through creating a simple Next.js-based blog using MarkdownDB. MarkdownDB empowers you to treat markdown files as a database, simplifying content management and querying.

## Step 1: Set Up a Next.js Project

Begin by creating a Next.js project. If Next.js is not installed, execute the following command:

```bash
npx create-next-app my-blog
cd my-blog
```

## Step 2: Create a Folder for Blog Posts

Establish a folder to store your blog posts within your project. For instance:

```bash
mkdir content
cd content
```

Inside the content folder, create three sample blog posts using markdown, such as:

```bash
- post-1.md
- post-2.md
- post-3.md
```

## Step 3: Index Markdown Files into SQLite Database

After preparing markdown files, store their metadata in a database using the MarkdownDB CLI. Execute the following command:

```bash
npx mddb ./content
```

This command generates a markdown.db file in the execution directory, alongside your project structure.

```plaintext
.
├── markdown.db
└── content
    ├── post-1.md
    ├── post-2.md
    └── post-3.md
```

## Step 4: Explore the SQLite Database

Explore the SQLite database using a viewer like [SQLite Browser](https://sqlitebrowser.org/). The database contains tables such as 'files,' 'file_tags,' 'links,' and 'tags,' storing metadata, tags, links, and tag information, respectively.

Additionally, install the `mddb` package:

```bash
npm install mddb
```

## Step 5: Load Blog Posts Using MarkdownDB

Create a file for your blog listing page, e.g., `pages/blog.js`. Use the following code snippet:

**Component 1: BlogList**

```jsx
// BlogList.js
import { useEffect, useState } from "react";
import { MarkdownDB } from "markdowndb";

const BlogList = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const loadPosts = async () => {
      const mdDB = new MarkdownDB();
      await mdDB.init();
      await mdDB.indexFolder("./content");

      // Load all blog posts
      const blogPosts = await mdDB.getFiles("./content");
      setPosts(blogPosts);
    };

    loadPosts();
  }, []);

  return (
    <div>
      <h1>Blog Posts</h1>
      <ul>
        {posts.map((post) => (
          <li key={post._id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default BlogList;
```

**Component 2: BlogItem**

```jsx
// BlogItem.js
import React from "react";

const BlogItem = ({ post }) => {
  // Customize the display of individual blog items
  return (
    <div>
      <h2>{post.title}</h2>
      <p>{post.content}</p>
    </div>
  );
};

export default BlogItem;
```

## Step 6: Run Your Next.js App

Run your Next.js app to view your blog in action:

```bash
npm run dev
```

Visit http://localhost:3000/blog to see your blog posts listed.

Congratulations! You've successfully created a simple Next.js blog using MarkdownDB. Explore more features and customize your blog as needed.
