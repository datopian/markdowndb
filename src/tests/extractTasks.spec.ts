import { extractTasks, processAST } from "../lib/parseFile";

const getTasksFromSource = (source: string) => {
  const ast = processAST(source, {});
  const tasks = extractTasks(ast);
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
      scheduled: null,  },
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
      scheduled: null,  },
      { description: "completed task 2", checked: true, metadata: {}, 
      created: null,
      due: null,
      completion: null,
      start: null,
      scheduled: null,  },
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
      scheduled: null,  },
      { description: "uncompleted task", checked: false, metadata: {}, 
      created: null,
      due: null,
      completion: null,
      start: null,
      scheduled: null,  },
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
      scheduled: null,  },
      { description: "uncompleted task", checked: false, metadata: {}, 
      created: null,
      due: null,
      completion: null,
      start: null,
      scheduled: null,  },
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
      scheduled: null, },
      { description: "task 2", checked: true, metadata: {}, 
      created: null,
      due: null,
      completion: null,
      start: null,
      scheduled: null,  },
      { description: "task 3", checked: false, metadata: {}, 
      created: null,
      due: null,
      completion: null,
      start: null,
      scheduled: null,  },
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
      
      },
    ];
    expect(tasks).toEqual(expectedTasks);
  });
});
