import { extractTasks, processAST } from "../lib/parseFile";

const getTasksFromSource = (source: string) => {
  const ast = processAST(source, {});
  const tasks = extractTasks(ast);
  return tasks;
};

describe("extractTasks", () => {
  test("should extract uncompleted tasks from body", () => {
    const tasks = getTasksFromSource(
      "- [] uncompleted task 1\n- [ ] uncompleted task 2"
    );
    const expectedTasks = [
      { description: "uncompleted task 2", checked: false },
    ];
    expect(tasks).toEqual(expectedTasks);
  });

  test("should extract completed tasks from body", () => {
    const tasks = getTasksFromSource(
      "- [x] completed task 1\n- [X] completed task 2"
    );
    const expectedTasks = [
      { description: "completed task 1", checked: true },
      { description: "completed task 2", checked: true },
    ];
    expect(tasks).toEqual(expectedTasks);
  });

  test("should handle mixed completed and uncompleted tasks", () => {
    const tasks = getTasksFromSource(
      "- [x] completed task\n- [ ] uncompleted task"
    );
    const expectedTasks = [
      { description: "completed task", checked: true },
      { description: "uncompleted task", checked: false },
    ];
    expect(tasks).toEqual(expectedTasks);
  });

  test("should handle tasks with leading and trailing spaces", () => {
    const tasks = getTasksFromSource(
      "- [x]  completed task  \n- [ ]  uncompleted task  "
    );
    const expectedTasks = [
      { description: "completed task", checked: true },
      { description: "uncompleted task", checked: false },
    ];
    expect(tasks).toEqual(expectedTasks);
  });

  test("should handle tasks with different checkbox formats", () => {
    const tasks = getTasksFromSource(
      "- [x] task 1\n- [X] task 2\n- [ ] task 3"
    );
    const expectedTasks = [
      { description: "task 1", checked: true },
      { description: "task 2", checked: true },
      { description: "task 3", checked: false },
    ];
    expect(tasks).toEqual(expectedTasks);
  });

  test("should handle tasks with special characters", () => {
    const tasks = getTasksFromSource("- [x] task with $pecial character$");
    const expectedTasks = [
      { description: "task with $pecial character$", checked: true },
    ];
    expect(tasks).toEqual(expectedTasks);
  });
});
