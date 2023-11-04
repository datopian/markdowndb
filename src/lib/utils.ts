import { Tag } from "./schemaTypes";

export type CreateDiff<T> = {
  type: "create";
  data: T;
};

export type DeleteDiff<T> = {
  type: "delete";
  data: T;
};

export type ArrayDiffResult<T> = CreateDiff<T> | DeleteDiff<T>;

export function arrayDiff<T>(
  oldArray: T[],
  newArray: T[]
): ArrayDiffResult<T>[] {
  const diffArray: ArrayDiffResult<T>[] = [];

  oldArray.forEach((oldItem) => {
    const newArrayWithoutOldItem = !newArray.some((newItem) =>
      deepEqual(oldItem, newItem)
    );
    if (newArrayWithoutOldItem) {
      diffArray.push({ type: "delete", data: oldItem });
    }
  });

  newArray.forEach((newItem) => {
    const matchingOldItem = oldArray.find((oldItem) =>
      deepEqual(oldItem, newItem)
    );

    if (!matchingOldItem) {
      const notEqual = !deepEqual(matchingOldItem, newItem);
      if (notEqual) {
        diffArray.push({
          type: "create",
          data: newItem,
        });
      }
    }
  });

  return diffArray;
}

export function deepEqual(a: any, b: any): boolean {
  if (a === null || b === null) {
    return a === null && b === null;
  }

  // Handle primitive types and non-objects
  if (a === b) {
    return true;
  }

  if (typeof a !== "object" || typeof b !== "object") {
    return false;
  }

  // Compare objects
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (const key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
      return false;
    }
  }

  return true;
}

export function jsonDiff<T extends Record<string, any>>(
  oldJson: T,
  newJson: T
): Record<string, any> {
  const diff: Record<string, any> = {};
  // Check for keys that exist in the new JSON but not in the old JSON
  Object.keys(newJson).forEach((key) => {
    const notAKeyInOldJson = !oldJson.hasOwnProperty(key);
    const notSameValueAsOldJson = !deepEqual(oldJson[key], newJson[key]);
    if (notAKeyInOldJson || notSameValueAsOldJson) {
      diff[key] = newJson[key];
    }
  });

  return diff;
}

export function extractDataFromDiffArray<T>(
  diffArray: ArrayDiffResult<T>[]
): T[] {
  return diffArray.map((diff) => diff.data);
}

export function getDiffArray<T>(
  arrayToConvert: T[],
  type: "create"
): CreateDiff<T>[];
export function getDiffArray<T>(
  arrayToConvert: T[],
  type: "delete"
): DeleteDiff<T>[];
export function getDiffArray<T>(
  arrayToConvert: T[],
  type: "create" | "delete"
): ArrayDiffResult<T>[] {
  return arrayToConvert.map((item) => {
    if (type === "create") {
      return { type: "create", data: item } as CreateDiff<T>;
    }

    return { type: "delete", data: item } as DeleteDiff<T>;
  });
}

export function filterCreateDiffs<T>(
  arrayToFilter: ArrayDiffResult<T>[]
): CreateDiff<T>[] {
  return arrayToFilter.filter(
    (diff) => diff.type === "create"
  ) as CreateDiff<T>[];
}

export function filterDeleteDiffs<T>(
  arrayToFilter: ArrayDiffResult<T>[]
): DeleteDiff<T>[] {
  return arrayToFilter.filter(
    (diff) => diff.type === "delete"
  ) as DeleteDiff<T>[];
}

export function getItemsNotInFirstList<T>(list1: T[], list2: T[]): T[] {
  const set1 = new Set(list1);

  const itemsNotInList1 = list2.filter((item) => !set1.has(item));

  return itemsNotInList1;
}

export function getUniqueValues<T>(array: T[]): T[] {
  return [...new Set(array)];
}

export function applyJsonDiff<T extends Record<string, any>>(
  originalJson: Record<string, any>,
  jsonDiffResult: Record<string, any>
) {
  const updatedJson = { ...originalJson };

  // Apply the changes from the JSON diff result to the original JSON
  Object.keys(jsonDiffResult).forEach((key) => {
    updatedJson[key] = jsonDiffResult[key];
  });

  return updatedJson;
}

// Apply Array Diff to an Array
export function applyArrayDiff<T>(
  originalArray: T[],
  arrayDiffResult: ArrayDiffResult<T>[]
): T[] {
  const updatedArray = [...originalArray];

  arrayDiffResult.forEach((diff) => {
    if (diff.type === "create") {
      updatedArray.push(diff.data);
    } else if (diff.type === "delete") {
      const dataToDelete = diff.data;
      const indexToDelete = updatedArray.findIndex((item) =>
        deepEqual(item, dataToDelete)
      );
      if (indexToDelete !== -1) {
        updatedArray.splice(indexToDelete, 1);
      }
    }
  });

  return updatedArray;
}

export function mapTagsToFile(id: string, tags: Tag[]) {
  return tags.map((tag) => ({
    file: id,
    tag: tag.name,
  }));
}
