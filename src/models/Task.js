import { BaseModel } from "./BaseModel";
import { addToStorage } from "../utils";

export class Task extends BaseModel {
  constructor(taskName, taskOwn) {
    super();
    this.own = taskOwn;
    this.name = taskName;
    this.location = "backlog";
    this.storageKey = "tasks";
  }

  static save(task) {
    try {
      addToStorage(task, task.storageKey);
      return true;
    } catch (e) {
      throw new Error(e);
    }
  }
}
