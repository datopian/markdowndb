### Define Your Schema with Zod Scheming

MarkdownDB leverages the powerful Zod library for schema definition, allowing you to specify the structure and validation rules for your Markdown content. Below is an example configuration demonstrating the usage of Zod to define a schema for a blog post with a mandatory `date` field.

```javascript
// markdowndb.config.js
import { z } from "zod";

module.exports = {
  schemas: z.object({
    post: {
      date: z.string().refine((value) => /\d{4}-\d{2}-\d{2}/.test(value), {
        message: "Invalid date format. Please use YYYY-MM-DD format for the 'date' field.",
      }),
      // Add more fields as needed, each with its own validation rules
      // Example:
      // title: z.string().min(1, "Title must have at least 1 character"),
      // content: z.string(),
    },
    // Define additional schemas for different content types
    // Example:
    // page: {
    //   author: z.string(),
    //   text: z.string(),
    // },
  }),
};
```

### How Validation Works

In this example, the `post` schema is defined using Zod's `object` method, specifying the structure of the content. Each field within the schema, such as `date`, is assigned validation rules using Zod's methods, ensuring data integrity.

When MarkdownDB loads a Markdown file, it automatically validates the content against the defined schema using Zod. If any field fails validation, MarkdownDB throws an error with a detailed message indicating the specific issue. For instance:

- If the date has an invalid format, it throws an error like this: `Error: In 'blog.md' for the 'post' schema. Invalid date format. Please use YYYY-MM-DD format for the 'date' field.`
- If a required field is missing, it throws an error like this: `Error: Missing 'date' field in 'blog.md' for the 'post' schema.`