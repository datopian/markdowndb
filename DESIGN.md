### Define Your Schema with Zod Scheming

MarkdownDB leverages the powerful Zod library for schema definition, allowing you to specify the structure and validation rules for your Markdown content. Below is an example configuration demonstrating the usage of Zod to define a schema for a blog post with a mandatory `date` field.

```javascript
// markdowndb.config.js
import { z } from "zod";

module.exports = {
  schemas: z.object({
    post: {
      date: z.string().refine((value) => /\d{4}-\d{2}-\d{2}/.test(value), {
        message: "Invalid date format. Please use YYYY-MM-DD.",
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

In this example, the `post` schema is defined using Zod's `object` method, specifying the structure of the content. The `date` field is required and must adhere to the specified date format using Zod's `string` and `refine` methods for custom validation.

### How Validation Works

When you load a Markdown file using MarkdownDB, it automatically validates the content against the defined schema using Zod. If the validation fails for any field, MarkdownDB will throw an error, providing detailed error messages. This helps you quickly identify and rectify issues, ensuring your Markdown content adheres to the specified structure and validation rules.

Feel free to extend the schema by adding more fields and their respective validation rules as needed for your specific use case. This flexibility allows you to define complex structures and ensure the integrity of your data.
