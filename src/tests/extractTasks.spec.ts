import matter from "gray-matter";
import { extractTasks, processAST } from "../lib/parseFile";

const getTasksFromSource = (source: string) => {
  const ast = processAST(source, {});
  const { data: metadata } = matter(source);
  const tasks = extractTasks(ast, metadata);
  return tasks;
};

describe("extractTasks", () => {
  test("should extract uncompleted tasks from body", () => {
    // TODO: Figure out why task 1 is ignored
    const tasks = getTasksFromSource(
      "- [] uncompleted task 1\n- [ ] uncompleted task 2"
    );
    const expectedTasks = [
      { description: "uncompleted task 2", checked: false, metadata: {}, 
      created: null,
      due: null,
      completion: null,
      start: null,
      scheduled: null,
      list: null,  },
    ];
    expect(tasks).toEqual(expectedTasks);
  });

  test("should extract completed tasks from body", () => {
    const tasks = getTasksFromSource(
      "- [x] completed task 1\n- [X] completed task 2"
    );
    const expectedTasks = [
      { description: "completed task 1", checked: true, metadata: {}, 
      created: null,
      due: null,
      completion: null,
      start: null,
      scheduled: null,
      list: null,  },
      { description: "completed task 2", checked: true, metadata: {}, 
      created: null,
      due: null,
      completion: null,
      start: null,
      scheduled: null,
      list: null,  },
    ];
    expect(tasks).toEqual(expectedTasks);
  });

  test("should handle mixed completed and uncompleted tasks", () => {
    const tasks = getTasksFromSource(
      "- [x] completed task\n- [ ] uncompleted task"
    );
    const expectedTasks = [
      { description: "completed task", checked: true, metadata: {}, 
      created: null,
      due: null,
      completion: null,
      start: null,
      scheduled: null,
      list: null,  },
      { description: "uncompleted task", checked: false, metadata: {}, 
      created: null,
      due: null,
      completion: null,
      start: null,
      scheduled: null,
      list: null,  },
    ];
    expect(tasks).toEqual(expectedTasks);
  });

  test("should handle tasks with leading and trailing spaces", () => {
    const tasks = getTasksFromSource(
      "- [x]  completed task  \n- [ ]  uncompleted task  "
    );
    const expectedTasks = [
      { description: "completed task", checked: true, metadata: {}, 
      created: null,
      due: null,
      completion: null,
      start: null,
      scheduled: null,
      list: null,  },
      { description: "uncompleted task", checked: false, metadata: {}, 
      created: null,
      due: null,
      completion: null,
      start: null,
      scheduled: null,
      list: null,  },
    ];
    expect(tasks).toEqual(expectedTasks);
  });

  test("should handle tasks with different checkbox formats", () => {
    const tasks = getTasksFromSource(
      "- [x] task 1\n- [X] task 2\n- [ ] task 3"
    );
    const expectedTasks = [
      { description: "task 1", checked: true, metadata: {}, 
      created: null,
      due: null,
      completion: null,
      start: null,
      scheduled: null,
      list: null, },
      { description: "task 2", checked: true, metadata: {}, 
      created: null,
      due: null,
      completion: null,
      start: null,
      scheduled: null,
      list: null,  },
      { description: "task 3", checked: false, metadata: {}, 
      created: null,
      due: null,
      completion: null,
      start: null,
      scheduled: null,
      list: null,  },
    ];
    expect(tasks).toEqual(expectedTasks);
  });

  test("should handle tasks with special characters", () => {
    const tasks = getTasksFromSource("- [x] task with $pecial character$");
    const expectedTasks = [
      { 
        description: "task with $pecial character$",
        checked: true,
        metadata: {}, 
        created: null,
        due: null,
        completion: null,
        start: null,
        scheduled: null, 
        list: null,
      },
    ];
    expect(tasks).toEqual(expectedTasks);
  });
  test("should handle tasks with metadata", () => {
    const tasks = getTasksFromSource(
      "- [x] task with metadata [field1:: field1value]"
    );
    const expectedTasks = [
      { 
        description: "task with metadata [field1:: field1value]",
        checked: true,
        metadata: { field1 : "field1value", tags: []  }, 
        created: null,
        due: null,
        completion: null,
        start: null,
        scheduled: null,
        list: null,
      },
    ];
    expect(tasks).toEqual(expectedTasks);
  });
  test("should extract tasks with kanban list names from body", () => {
    const body = "## Ideas\n\n- [ ] task 1\n- [ ] task 2\n## Doing\n\n- [ ] task 3\n- [ ] task 4\n## Done\n\n- [x] task 5";
    const kanbanMetadata = "---\nkanban-list: board\n---\n";
    const tasksInNonKanban = getTasksFromSource(body);
    const tasksInKanban = getTasksFromSource(kanbanMetadata + body);
    expect(tasksInNonKanban).toEqual([
      { description: "task 1", checked: false, metadata: {}, created: null, due: null, completion: null, start: null, scheduled: null, list: null },
      { description: "task 2", checked: false, metadata: {}, created: null, due: null, completion: null, start: null, scheduled: null, list: null },
      { description: "task 3", checked: false, metadata: {}, created: null, due: null, completion: null, start: null, scheduled: null, list: null },
      { description: "task 4", checked: false, metadata: {}, created: null, due: null, completion: null, start: null, scheduled: null, list: null },
      { description: "task 5", checked: true, metadata: {}, created: null, due: null, completion: null, start: null, scheduled: null, list: null },
    ]);
    expect(tasksInKanban).toEqual([
      { description: "task 1", checked: false, metadata: {}, created: null, due: null, completion: null, start: null, scheduled: null, list: "Ideas" },
      { description: "task 2", checked: false, metadata: {}, created: null, due: null, completion: null, start: null, scheduled: null, list: "Ideas" },
      { description: "task 3", checked: false, metadata: {}, created: null, due: null, completion: null, start: null, scheduled: null, list: "Doing" },
      { description: "task 4", checked: false, metadata: {}, created: null, due: null, completion: null, start: null, scheduled: null, list: "Doing" },
      { description: "task 5", checked: true, metadata: {}, created: null, due: null, completion: null, start: null, scheduled: null, list: "Done" },
    ]);
  });
});
