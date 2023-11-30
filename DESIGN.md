### Define Your Schema

To define the schema, you can use MarkdownDB's flexible schema definition syntax. Below is an example for a blog post with a mandatory `date` field:

```javascript
// markdowndb.config.js

module.exports = {
  schemas: {
    post: {
      date: {
        type: "string",
        required: true,
        validate: (fileObject) => {
          const dateFormat = /\d{4}-\d{2}-\d{2}/; // YYYY-MM-DD
          if (!dateFormat.test(fileObject.date)) {
            return {
              status: false,
              message: "Invalid date format. Please use YYYY-MM-DD.",
            };
          }
          return {
            status: true,
          };
        },
        compute(fileObject, ast) {
          // this function returns the first date in a file
          const nodes = selectAll("*", ast);
          nodes.map((node: any) => {
            if (node.type === "text") {
              const dateFormat = /\d{4}-\d{2}-\d{2}/;
              if (!node.value.test(fileObject.date)) {
                return node.value;
              }
            }
          });
        },
      },
      // Add more fields as needed
    },
    // Define additional schemas if necessary
  },
};
```

In this example, the `date` field is defined as a required string. It also includes custom validation logic to ensure that the date follows the format YYYY-MM-DD.

### How Validation Works

When you load a Markdown file, MarkdownDB will validate it against the specified schema. If the validation fails, MarkdownDB will throw an error, providing detailed error messages to help you identify and fix the issues.
