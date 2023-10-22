"use strict";


import { appState } from "./app";
import { tasksColumns } from "./app";
const locationList = ["backlog", "ready", "inprogress", "finished"];
let taskIdAllowDrop;
export const getFromStorage = function (key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
};
export const addToStorage = function (obj, key) {
  const storageData = getFromStorage(key);
  storageData.push(obj);
  localStorage.setItem(key, JSON.stringify(storageData));
};
export const generateTestUser = function (User) {
  const testUser = new User("test", "123");
  User.save(testUser);
};
export const generateAdmin = function (Admin) {
  const admin = new Admin("admin", "123");
  Admin.save(admin);
};
export const addNewUser = function (User, login, password) {
  const user = new User(login, password);
  User.save(user);
};
export const isCurrentUserAdmin = function () {
  return appState.currentUser.login == "admin" ? true : false;
};
export const isTheLoginFree = function (login) {
  const users = getFromStorage("users");
  if (users.length == 0) return true;
  for (const user of users) {
    if (user.login == login) return false;
  }
  return true;
};
export const displayTasks = function (taskFieldList, login, handlerTask) {
  let usersOfTaskList = document.querySelectorAll(".app-task__user");
  if (login == "admin") {
    if (usersOfTaskList.length) {
      taskFieldList.forEach((field) => {
        usersOfTaskList = field.querySelectorAll(".app-task__user");
        usersOfTaskList.forEach((element) => {
          field.removeChild(element);
        });
      });
    }
  }
  let taskList = document.querySelectorAll(".app-task__item");
  if (taskList.length) {
    taskFieldList.forEach((field) => {
      taskList = field.querySelectorAll(".app-task__item");
      taskList.forEach((element) => {
        field.removeChild(element);
      });
    });
  }
  if (localStorage.getItem("tasks")) {
    const tasks = getFromStorage("tasks");
    const tasksByUser = new Map();

    for (const task of tasks) {
      if (!tasksByUser.has(task.own)) {
        tasksByUser.set(task.own, [task]);
      }
      else {
        const tempUserArr = tasksByUser.get(task.own);
        tempUserArr.push(task);
        tasksByUser.set(task.own, tempUserArr);
      }
    }
    if (login == "admin") {
      for (const field of taskFieldList) {
        for (const key of tasksByUser.keys()) {
          for (const task of tasksByUser.get(key)) {
            if (field.className.match(task.location)) {
              field.insertAdjacentHTML(
                "beforeend",
                `<ul class="app-task__user ${field}">${key}</ul>`
              );
              break;
            }
          }
        }
        usersOfTaskList = field.querySelectorAll(".app-task__user");
        for (const user of usersOfTaskList) {
          tasksByUser.get(user.innerText).forEach((task) => {
            if (field.className.match(task.location)) {
              user.insertAdjacentHTML(
                "beforeend",
                `<li class="app-task__item" id='${task.id}'>${task.name}</li>`
              );
            }
          });
        }
      }
    }
    else {
      taskFieldList.forEach((field) => {
        for (const task of tasks) {
          if (field.className.match(task.location)) {
            if (task.own == login) {
              field.insertAdjacentHTML(
                "beforeend",
                `<li class='app-task__item' id='${task.id}'>${task.name}</li>`
              );
            }
          }
        }
      });
    }
    taskList = document.querySelectorAll(".app-task__item");
    EventListener(taskList, handlerTask, "click");

    dragAndDrop(taskFieldList); 
    displayFooterTasksStatus(taskFieldList[0], taskFieldList[3]);
  } else displayFooterTasksStatus(taskFieldList[0], taskFieldList[3]);
};
export const updUserList = function () {
  if (localStorage.getItem("users")) {
    const userList = document.querySelectorAll("option");
    const userListContainer = document.querySelector("#input-user");
    if (userList.length) {
      userList.forEach((element) => {
        userListContainer.removeChild(element);
      });
    }
    const users = getFromStorage("users");
    for (const user of users) {
      userListContainer.insertAdjacentHTML(
        "beforeend",
        `<option class="input-user__item" value="${user.login}">${user.login}</option>`
      );
    }
  }
};
export const updTasksList = function (field) {
  if (localStorage.getItem("tasks")) {
    const taskList = document.querySelectorAll("option"); 
    const taskListContainer = document.querySelector("#input-user");
    let displayField = "backlog"; 
    const user = appState.currentUser.login;
    const tasks = getFromStorage("tasks");
    if (taskList.length) {
      taskList.forEach((element) => {
        taskListContainer.removeChild(element);
      });
    }
    for (let i = 0; i < locationList.length; i++) {
      if (locationList[i] == field) {
        displayField = locationList[i - 1];
      }
     
    }
    for (const task of tasks) {
      if (task.location == displayField) {
        if (user == "admin" || task.own == user) {
          taskListContainer.insertAdjacentHTML(
            "beforeend",
            `<option class="input-user__item" value="${task.id}">${task.name}</option>`
          );
        }
      }
    }
  }
};
export const EventListener = function (array, handler, event) {
  if (array.length) {
    for (const item of array) {
      item.addEventListener(event, handler);
    }
  }
};
export const deleteFromStorage = function (key, id) {
  const storageData = getFromStorage(key);
  const tempArr = [];

  storageData.forEach((element) => {
    if (element.id != id) {
      tempArr.push(element);
    }
  });

  localStorage.setItem(key, JSON.stringify(tempArr));
};
export const editInStorage = function (key, id, changeItem, newInfo) {
  const storageData = getFromStorage(key);
  const tempArr = [];
  storageData.forEach((element) => {
    if (element.id != id) {
      tempArr.push(element);
      deleteFromStorage(key, element.id); 
    }
    else {
      element[changeItem] = newInfo; 
      tempArr.push(element);
      deleteFromStorage(key, id);
    }
  });
  localStorage.setItem(key, JSON.stringify(tempArr));
};

export const moveToNextStage = function (taskId) {
  const storageData = getFromStorage("tasks");
  storageData.forEach((element) => {
    if (element.id == taskId) {
      if (element.location == locationList[3]) return false; 
      for (let i = 0; i < locationList.length - 1; i++) {
        if (locationList[i] == element.location) {
          editInStorage("tasks", taskId, "location", locationList[i + 1]);
          break;
        }
      }
    }
  });
};
export const updBtnStatus = function (taskFieldList) {
  const backlogAddTaskBtn = document.querySelector("#backlog-addtask-btn");
  const readyAddTaskBtn = document.querySelector("#ready-addtask-btn"); 
  const inProgAddTaskBtn = document.querySelector("#inprogress-addtask-btn"); 
  const finishedAddTaskBtn = document.querySelector("#finished-addtask-btn");

  let readyFlag = false,
    inprogressFlag = false,
    finishedFlag = false;
  for (let i = 0; i < taskFieldList.length - 1; i++) {
    let taskList = taskFieldList[i].querySelectorAll(".app-task__item"); 
    if (taskList.length) {
      readyAddTaskBtn.id.match(locationList[i + 1])
        ? (readyFlag = true)
        : readyFlag;
      inProgAddTaskBtn.id.match(locationList[i + 1])
        ? (inprogressFlag = true)
        : inprogressFlag;
      finishedAddTaskBtn.id.match(locationList[i + 1])
        ? (finishedFlag = true)
        : finishedFlag;
    }
  }
  readyFlag
    ? (readyAddTaskBtn.disabled = false)
    : (readyAddTaskBtn.disabled = true);
  inprogressFlag
    ? (inProgAddTaskBtn.disabled = false)
    : (inProgAddTaskBtn.disabled = true);
  finishedFlag
    ? (finishedAddTaskBtn.disabled = false)
    : (finishedAddTaskBtn.disabled = true);

  updUserList();
  const inputUser = document.querySelector("#input-user"); 
 
  if (!inputUser.value) {
    backlogAddTaskBtn.disabled = true;
  } else backlogAddTaskBtn.disabled = false;
};
export const taskSum = function (field) {
  let count = 0;
  const tasks = field.querySelectorAll(".app-task__item");
  if (tasks.length) {
    tasks.forEach(() => {
      count++;
    });
  }
  return count;
};
export const displayFooterTasksStatus = function (activeField, finishedField) {
  const active = document.querySelector(".app-active-tasks");
  const finished = document.querySelector(".app-finished-tasks");
  const countActive = taskSum(activeField);
  const countFinished = taskSum(finishedField);
  active.innerHTML = `Ative tasks: ${countActive}`;
  finished.innerHTML = `Finished tasks: ${countFinished}`;
};
export const userIdByName = function (userName) {
  const storageData = getFromStorage("users");
  let id = null;
  if (!storageData.length) return null;
  storageData.forEach((element) => {
    element.login == userName ? (id = element.id) : id;
  });
  return id;
};
export const taskLocationById = function (taskId) {
  const storageData = getFromStorage("tasks");
  let location = "";
  if (!storageData.length) return "";
  storageData.forEach((task) => {
    task.id == taskId ? (location = task.location) : location;
  });
  return location;
};
export const taskOwnById = function (taskId) {
  const storageData = getFromStorage("tasks");
  let own = "";
  if (!storageData.length) return "";
  storageData.forEach((task) => {
    task.id == taskId ? (own = task.own) : own;
  });
  return own;
};
function setFieldToDefault() {
  tasksColumns.forEach((field) => {
    field.style.border = "none";
  });
}

export const dragAndDrop = function (taskFieldList) {
  taskFieldList.forEach((field) => {
    field.ondragover = allowDrop;
    field.ondrop = dropField;
    if (appState.currentUser.login == "admin") {
      const usersOfTaskList = field.querySelectorAll(".app-task__user");
      if (usersOfTaskList.length) {
        usersOfTaskList.forEach((user) => {
          user.ondragover = allowDrop; 
          user.ondrop = dropUser;
        });
      }
    }
  });
  const taskList = document.querySelectorAll(".app-task__item");
  taskList.forEach((task) => {
    task.draggable = "true";
    task.ondragstart = drag; 
  });
};
function allowDrop(event) {
  event.preventDefault();
  const taskLocation = taskLocationById(taskIdAllowDrop); 
  const taskOwner = taskOwnById(taskIdAllowDrop);
  const taskList = document.querySelectorAll(".app-task__item");
  const usersOfAllFields = document.querySelectorAll(".app-task__user");

  let usersOfTaskList; 
  let fieldFlag = false, 
    userFlag = false; 
  taskList.forEach((task) => {
    task.style.display = "none";
  });
  for (let i = 0; i < tasksColumns.length; i++) {
    usersOfTaskList = tasksColumns[i].querySelectorAll(".app-task__user");
  }
}
function drag(event) {
  event.dataTransfer.setData("id", event.target.id);
  taskIdAllowDrop = event.target.id;
}
function dropField(event) {
  const itemId = event.dataTransfer.getData("id");
  const itemLocation = taskLocationById(itemId); 
  const dropField = event.target.id; 

  if (dropField) {
    for (let i = 0; i < locationList.length; i++) {
      if (itemLocation == locationList[i]) {
        if (dropField == locationList[i + 1]) {
          moveToNextStage(itemId); 
          break;
        }
      }
    }
  }

  setFieldToDefault(); 
}
function dropUser(event) {
  const itemId = event.dataTransfer.getData("id"); 
  const itemOwner = taskOwnById(itemId);
  const itemLocation = taskLocationById(itemId);
  const dropUser = event.target.innerText; 
  const dropParent = event.target.parentNode; 

  if (itemLocation != dropParent.id) {
    for (let i = 0; i < locationList.length; i++) {
      if (itemLocation == locationList[i]) {
        if (dropParent.id == locationList[i + 1]) {
          moveToNextStage(itemId); 
          if (itemOwner != dropUser) {
            editInStorage("tasks", itemId, "own", dropUser);
          }
          break;
        }
      }
    }
  }
  else {
    if (itemOwner != dropUser) {
      editInStorage("tasks", itemId, "own", dropUser);
    }
  }
}
