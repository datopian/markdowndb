# mddb

## 0.9.1

### Patch Changes

- [#103](https://github.com/datopian/markdowndb/pull/103) [`ae6575e`](https://github.com/datopian/markdowndb/commit/ae6575ee40a1633a235bca0513f1071552b39395) Thanks [@mohamedsalem401](https://github.com/mohamedsalem401)! - Fix tags from body extraction

## 0.9.0

### Minor Changes

- [#97](https://github.com/datopian/markdowndb/pull/97) [`c496199`](https://github.com/datopian/markdowndb/commit/c496199373745c066d82875700fcedd1e476ac3e) Thanks [@mohamedsalem401](https://github.com/mohamedsalem401)! - - Add configuration with include/exclude options

## 0.8.0

### Minor Changes

- [`ea5d036`](https://github.com/datopian/markdowndb/commit/ea5d0366a8b82163fa4a1e85a5e62443a09475f3) Thanks [@mohamedsalem401](https://github.com/mohamedsalem401)! - - Add computed fields
  - Add document types
  - Implement hot-reloading

## 0.7.0

### Minor Changes

- [#86](https://github.com/datopian/markdowndb/pull/86) [`81f85f6`](https://github.com/datopian/markdowndb/commit/81f85f6c382722031f24f75e8ac822bcf91a3fa5) Thanks [@mohamedsalem401](https://github.com/mohamedsalem401)! - [#54 Computed Fields]
  - Introduce a configuration parameter to support the inclusion of a custom function for computing fields.

## 0.6.0

### Minor Changes

- [#73](https://github.com/datopian/markdowndb/pull/73) [`aedd641`](https://github.com/datopian/markdowndb/commit/aedd6413a7eee41a0d710c477ba55996c43b3e0f) Thanks [@mohamedsalem401](https://github.com/mohamedsalem401)! - [ #53 , JSON output option ] Implemented functionality to write file JSON output to disk

## 0.5.0

### Minor Changes

- [#71](https://github.com/datopian/markdowndb/pull/71) [`6a8a952`](https://github.com/datopian/markdowndb/commit/6a8a9525c90f3d4160d412f3929922b1e2df354b) Thanks [@mohamedsalem401](https://github.com/mohamedsalem401)! - [ #60 , extract tasks ]
  Add tasks extraction from files. e.g `- [ ] task`

## 0.4.0

### Minor Changes

- [#61](https://github.com/datopian/markdowndb/pull/61) [`f6fe5b0`](https://github.com/datopian/markdowndb/commit/f6fe5b0899700462360e864c231473be99df91b0) Thanks [@mohamedsalem401](https://github.com/mohamedsalem401)! - Add Tags Extraction from Markdown Content.
  Resolved issues with link extraction from Markdown documents.
  Conducted code refactoring for improved readability and maintainability.

## 0.3.0

### Minor Changes

- [`52ff842`](https://github.com/datopian/markdowndb/commit/52ff8429cb0058f66f033b9ecdd180c854a00573) Thanks [@olayway](https://github.com/olayway)! - Support for querying files by frontmatter field values (exact matches only).

## 0.2.1

### Patch Changes

- [`1cc8bcc`](https://github.com/datopian/markdowndb/commit/1cc8bcc2b351f1ef83ee6e1cc30065ea48c10b2f) Thanks [@olayway](https://github.com/olayway)! - Fix missing build files in npm package

## 0.2.0

### Minor Changes

- [`6f93669`](https://github.com/datopian/markdowndb/commit/6f93669d748e7c7c4c5d72cf100f251a21603fe3) Thanks [@olayway](https://github.com/olayway)! - Extract wiki links with Obsidian style shortest paths

### Patch Changes

- [#35](https://github.com/datopian/markdowndb/pull/35) [`14520be`](https://github.com/datopian/markdowndb/commit/14520befd9bd8ca231904b44652fddbf25d7d464) Thanks [@olayway](https://github.com/olayway)! - Add support for Obsidian style tags list in frontmatter (e.g. `tags: a,b,c`).

## 0.1.9

### Patch Changes

- Package renamed from `@flowershow/markdowndb` to `mddb`.

---

# @flowershow/markdowndb

## 0.1.8

### Patch Changes

- Fix published package contents.

## 0.1.7

### Patch Changes

- 3129f4c: Fixed issue with indexing more than 500 files.

## 0.1.6

### Patch Changes

- aed0b4b: Fix ignore regex pattern.

## 0.1.5

### Patch Changes

- 41c75f7: Encode URL's stored in the database.

## 0.1.4

### Patch Changes

- 3aad734: Adjust default path->url resolver function and allow passing custom one.

## 0.1.3

### Patch Changes

- Fix build script.

## 0.1.2

### Patch Changes

- Migrate to a separate repo (out of flowershow monorepo).

## 0.1.1

### Patch Changes

- Fix import statement in bin/index.js file.

## 0.1.0

### Minor Changes

- Link extraction and querying support.

## 0.0.3

### Patch Changes

- 135a238: clean-up and reafctoring with more OOP approach and stronger typing.

## 0.0.2

### Patch Changes

- Fix \* export from package.
