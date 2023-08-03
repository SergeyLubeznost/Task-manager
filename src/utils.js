"use strict";

import { appState } from "./app";
import { tasksColumns } from "./app";

// массив полей статуса
const locationList = ["backlog", "ready", "inprogress", "finished"];

// переменная для хранения id перетаскиваемой задачи, т.к. в событии ondragover нет доступа к dataTransfer
let taskIdAllowDrop;

// достаёт данные из localStorage/////
export const getFromStorage = function (key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
};
// ...

// добавляет данные в localStorage
export const addToStorage = function (obj, key) {
  const storageData = getFromStorage(key);
  storageData.push(obj);
  localStorage.setItem(key, JSON.stringify(storageData));
};
// ...

// создаёт нового пользователя, аргумент - класс User
export const generateTestUser = function (User) {
  const testUser = new User("test", "123");
  User.save(testUser);
};
// ...

// создаёт админа, аргумент - класс Admin
export const generateAdmin = function (Admin) {
  const admin = new Admin("admin", "123");
  Admin.save(admin);
};
// ...

// добавляет нового пользователя, , аргументы: класс User, имя, пароль
export const addNewUser = function (User, login, password) {
  const user = new User(login, password);
  User.save(user);
};
// ...

// проверяет является ли текущий пользователь админом
export const isCurrentUserAdmin = function () {
  return appState.currentUser.login == "admin" ? true : false;
};
// ...

// проверяет свободно ли имя пользователя или занято
export const isTheLoginFree = function (login) {
  const users = getFromStorage("users");
  if (users.length == 0) return true;
  for (const user of users) {
    if (user.login == login) return false;
  }
  return true;
};
// ...

// отображает задания во всех полях статусов, аргументы: список с полями статусов,
// имя пользователя для которого отображаем, обработчик для прослушки отображённых задач
export const displayTasks = function (taskFieldList, login, handlerTask) {
  // ищем и сохраняем списки задач пользователей (если задачи отображались при админе)
  let usersOfTaskList = document.querySelectorAll(".app-task__user");

  // если админ и списки задач найдены, то перебираем поля статусов
  // ищем в них и удаляем списки задач пользователей
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
  // ...

  // ищем и сохраняем задачи (если задачи отображались при обычном пользователе)
  let taskList = document.querySelectorAll(".app-task__item");

  // если задачи найдены, то перебираем поля статусов,
  // ищем в них и удаляем все задачи
  if (taskList.length) {
    taskFieldList.forEach((field) => {
      taskList = field.querySelectorAll(".app-task__item");
      taskList.forEach((element) => {
        field.removeChild(element);
      });
    });
  }
  // ...

  // если в localStorage есть какие то задачи, то создаём колекцию
  // с ключами - именами пользователей и значениями - массивами задач
  // и отображаем задачи в нужных полях статусов
  if (localStorage.getItem("tasks")) {
    const tasks = getFromStorage("tasks");
    const tasksByUser = new Map();

    // перебираем задачи
    for (const task of tasks) {
      // если Map не содержит ключа - имя владельца задачи,
      // то добавляем задачу по ключу - имени
      if (!tasksByUser.has(task.own)) {
        tasksByUser.set(task.own, [task]);
      }

      // иначе создаём временный массив, копируем в него задачи которые хранятся в Map
      // добавляем во временный массив перебираемую задачу
      // записываем массив с новой задачей в Map
      else {
        const tempUserArr = tasksByUser.get(task.own);
        tempUserArr.push(task);
        tasksByUser.set(task.own, tempUserArr);
      }
      // ...
    }
    // ...

    // если админ
    if (login == "admin") {
      // перебираем DOM полей статусов задач
      for (const field of taskFieldList) {
        // перебираем имена пользователей в Map
        for (const key of tasksByUser.keys()) {
          // перебираем задачи каждого пользователя
          for (const task of tasksByUser.get(key)) {
            // если класс поля статуса содержит название статуса из задачи пользователя,
            // то отбразить список задач пользователя в поле статуса
            // (на данном этапе пустой ul с именем,
            // в котором позже будет добавлен список задач li)
            if (field.className.match(task.location)) {
              field.insertAdjacentHTML(
                "beforeend",
                `<ul class="app-task__user ${field}">${key}</ul>`
              );
              // прервать перебор задач, на каждое поле статуса
              // нужно лишь одно отображение списка задач пользователя
              break;
            }
            // ...
          }
          // ...
        }
        // ...

        // находим DOM всех отображённых в данном поле статуса списков задач пользователей
        usersOfTaskList = field.querySelectorAll(".app-task__user");

        // перебираем DOM отображённых в данном поле статуса списков задач пользователей
        for (const user of usersOfTaskList) {
          // перебираем задачи пользователя
          tasksByUser.get(user.innerText).forEach((task) => {
            // если статус задачи совпадает со статусом данного поля то отображаем её
            if (field.className.match(task.location)) {
              user.insertAdjacentHTML(
                "beforeend",
                `<li class="app-task__item" id='${task.id}'>${task.name}</li>`
              );
            }
            // ...
          });
        }
        // ...
      }
      // ...
    }

    // иначе (не админ)
    else {
      // перебираем DOM полей статусов задач
      taskFieldList.forEach((field) => {
        // перебираем задачи пользователей
        for (const task of tasks) {
          // если статус задачи соответствует статусу поля
          if (field.className.match(task.location)) {
            // если логин соответствует владельцу задачи, то отображаем её
            if (task.own == login) {
              field.insertAdjacentHTML(
                "beforeend",
                `<li class='app-task__item' id='${task.id}'>${task.name}</li>`
              );
            }
            // ...
          }
          // ...
        }
        // ...
      });
    }
    // ...

    // находим DOM всех отображённых задач
    taskList = document.querySelectorAll(".app-task__item");

    // вешаем прослушку click на каждую задачу, обработчик берём из аргумента
    EventListener(taskList, handlerTask, "click");

    dragAndDrop(taskFieldList); // запускаем функцию drag and drop

    // обновляем количество задач в footer
    // активные - поле inprogress, законченные - поле finished
    displayFooterTasksStatus(taskFieldList[0], taskFieldList[3]);
  } else displayFooterTasksStatus(taskFieldList[0], taskFieldList[3]);
};
// ...

// обновляет и отображает список пользователей в строке выбора
export const updUserList = function () {
  // если в localStorage есть пользователи
  if (localStorage.getItem("users")) {
    const userList = document.querySelectorAll("option");
    const userListContainer = document.querySelector("#input-user");
    // если что-то найдено во всплывающем списке
    if (userList.length) {
      // перебираем элементы списка и удаляем их
      userList.forEach((element) => {
        userListContainer.removeChild(element);
      });
    }
    // ...

    const users = getFromStorage("users");
    // перебираем список пользователей и отображаем их
    for (const user of users) {
      userListContainer.insertAdjacentHTML(
        "beforeend",
        `<option class="input-user__item" value="${user.login}">${user.login}</option>`
      );
    }
    // ...
  }
  // ...
};
// ...

// обновляет и отображает список задач во всплывающем списке,
// аргумент поле статуса в котором была нажата кнопка добавления задачи
// за исключением backlog
export const updTasksList = function (field) {
  // если в localStorage есть задачи
  if (localStorage.getItem("tasks")) {
    const taskList = document.querySelectorAll("option"); // всплывающий список
    const taskListContainer = document.querySelector("#input-user"); // контейнер списка
    let displayField = "backlog"; // поле статуса откуда должны браться задачи
    const user = appState.currentUser.login;
    const tasks = getFromStorage("tasks");

    // если во всплывающем списке что-то есть удаляем это
    if (taskList.length) {
      taskList.forEach((element) => {
        taskListContainer.removeChild(element);
      });
    }
    // ...

    // перебираем поля статусов для установки displayField
    for (let i = 0; i < locationList.length; i++) {
      // если поле статуса совпадает с аргументом,
      if (locationList[i] == field) {
        // то устанавливаем displayField предыдущее поле статуса
        // при попытке добавить задачу в ready,
        // в списке должны отображаться задачи и backlog и т.д.
        displayField = locationList[i - 1];
      }
      // ...
    }
    // ...

    // перебираем задачи
    for (const task of tasks) {
      // если displayField совпадает со статусом задачи
      if (task.location == displayField) {
        // и если админ или владелец задачи, то отображаем её во всплывающем списке
        if (user == "admin" || task.own == user) {
          taskListContainer.insertAdjacentHTML(
            "beforeend",
            `<option class="input-user__item" value="${task.id}">${task.name}</option>`
          );
        }
        // ...
      }
      // ...
    }
    // ...
  }
  // ...
};
// ...

// вешает прослушку event на каждый элемент DOM из массива array, handler из аргумента
export const EventListener = function (array, handler, event) {
  if (array.length) {
    for (const item of array) {
      item.addEventListener(event, handler);
    }
  }
};
// ...

// удаляет элемент из localStorage по ключу и id
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
// ...

// изменяет элемент в localStorage по ключу, id, изменяемому полю и информации
export const editInStorage = function (key, id, changeItem, newInfo) {
  const storageData = getFromStorage(key);
  const tempArr = [];

  // перебираем элементы
  storageData.forEach((element) => {
    // если id не совпадают
    if (element.id != id) {
      tempArr.push(element); // добавляем элемент во временный массив
      deleteFromStorage(key, element.id); // удаляем элемент из localStorage
    }

    // если id совпадают
    else {
      element[changeItem] = newInfo; // изменяем заданное поле элемента, заданной информацией
      tempArr.push(element); // добавляем элемент во временный массив
      deleteFromStorage(key, id); // удаляем элемент из localStorage
    }
    // ...
  });

  // сохраняем в localStorage временный массив с изменённым элементом
  localStorage.setItem(key, JSON.stringify(tempArr));
};
// ...

// перемещает задачу на следующую стадию (в следующее поле статуса)
export const moveToNextStage = function (taskId) {
  const storageData = getFromStorage("tasks");
  // перебираем задачи
  storageData.forEach((element) => {
    // если id задачи совпадает с аргументом
    if (element.id == taskId) {
      if (element.location == locationList[3]) return false; // из finished не переносим
      // перебираем поля статусов
      for (let i = 0; i < locationList.length - 1; i++) {
        // если поле статуса совпадает со статусом задачи
        if (locationList[i] == element.location) {
          // изменяем статус задачи на следующий из списка
          // например backlog на ready и т.д.
          editInStorage("tasks", taskId, "location", locationList[i + 1]);
          break;
        }
        // ...
      }
      // ...
    }
    // ...
  });
};
// ...

// обновляет disabled статус кнопок добавления задачи
export const updBtnStatus = function (taskFieldList) {
  // находим и сохраняем в переменные DOM кнопок
  const backlogAddTaskBtn = document.querySelector("#backlog-addtask-btn"); // активна если есть хоть один пользователь
  const readyAddTaskBtn = document.querySelector("#ready-addtask-btn"); // должна быть активна если в backlog есть задача
  const inProgAddTaskBtn = document.querySelector("#inprogress-addtask-btn"); // должна быть активна если в ready есть задача
  const finishedAddTaskBtn = document.querySelector("#finished-addtask-btn"); // должна быть активна если в inprogress есть задача

  // определяем флаги
  let readyFlag = false,
    inprogressFlag = false,
    finishedFlag = false;

  // перебираем DOM полей статусов, последнее поле finished не нужно
  for (let i = 0; i < taskFieldList.length - 1; i++) {
    let taskList = taskFieldList[i].querySelectorAll(".app-task__item"); // ищем задачи в данном поле статуса
    // если что-то нашли
    if (taskList.length) {
      // проверяем кнопки, если какая то кнопка содержит в id название следующего статуса после данного,
      // то флаг становится true, что означает что кнопка должна стать активной
      // если совпадения нет, то оставляем флаг как есть
      // например нашли что-то в backlog, значит кнопка в поле ready должна стать активной
      // т.е. ready.disabled = false
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
    // ...
  }
  // ...

  // в зависимости от состояния флагов делаем кнопки активными либо оставляем отключенными
  readyFlag
    ? (readyAddTaskBtn.disabled = false)
    : (readyAddTaskBtn.disabled = true);
  inprogressFlag
    ? (inProgAddTaskBtn.disabled = false)
    : (inProgAddTaskBtn.disabled = true);
  finishedFlag
    ? (finishedAddTaskBtn.disabled = false)
    : (finishedAddTaskBtn.disabled = true);

  updUserList(); // обновляем список пользователей
  const inputUser = document.querySelector("#input-user"); // всплывающий список в МО
  // если список пользователей пуст то делаем кнопку добавления задачи
  // в backlog не активной, иначе активируем кнопку
  if (!inputUser.value) {
    backlogAddTaskBtn.disabled = true;
  } else backlogAddTaskBtn.disabled = false;
};
// ...

// подсчитывает количество задач в поле статуса
export const taskSum = function (field) {
  let count = 0;
  // ищем задачи в заданном поле
  const tasks = field.querySelectorAll(".app-task__item");
  // если что-то нашлось, то перебираем задачи
  // и каждый раз увеличиваем счётчик на 1
  if (tasks.length) {
    tasks.forEach(() => {
      count++;
    });
  }
  // ...

  return count;
};
// ...

// обновляет количество задач в footer
export const displayFooterTasksStatus = function (activeField, finishedField) {
  const active = document.querySelector(".app-active-tasks");
  const finished = document.querySelector(".app-finished-tasks");
  const countActive = taskSum(activeField);
  const countFinished = taskSum(finishedField);
  active.innerHTML = `Ative tasks: ${countActive}`;
  finished.innerHTML = `Finished tasks: ${countFinished}`;
};
// ...

// находит и возвращает id пользователя по имени, если не находит возвращает null
export const userIdByName = function (userName) {
  const storageData = getFromStorage("users");
  let id = null;
  if (!storageData.length) return null;
  storageData.forEach((element) => {
    element.login == userName ? (id = element.id) : id;
  });
  return id;
};
// ...

// находит и возвращает location задачи по id
export const taskLocationById = function (taskId) {
  const storageData = getFromStorage("tasks");
  let location = "";
  if (!storageData.length) return "";
  storageData.forEach((task) => {
    task.id == taskId ? (location = task.location) : location;
  });
  return location;
};
// ...

// находит и возвращает own задачи по id
export const taskOwnById = function (taskId) {
  const storageData = getFromStorage("tasks");
  let own = "";
  if (!storageData.length) return "";
  storageData.forEach((task) => {
    task.id == taskId ? (own = task.own) : own;
  });
  return own;
};
// ...

// сбрасывает границу полей статусов по умолчанию
function setFieldToDefault() {
  tasksColumns.forEach((field) => {
    field.style.border = "none";
  });
}
// ...

// запускает функционал drag & drop
export const dragAndDrop = function (taskFieldList) {
  // перебираем DOM полей статусов
  taskFieldList.forEach((field) => {
    field.ondragover = allowDrop; // вешаем прослушку событию перетаскивания
    field.ondrop = dropField; // вешаем прослушку событию сбрасывания элемента в поле

    // если админ
    if (appState.currentUser.login == "admin") {
      // находим DOM всех отображённых в данном поле статуса списков задач пользователей
      const usersOfTaskList = field.querySelectorAll(".app-task__user");
      // если кого-то нашли
      if (usersOfTaskList.length) {
        // перебираем пользователей в данном поле
        usersOfTaskList.forEach((user) => {
          user.ondragover = allowDrop; // вешаем прослушку событию перетаскивания
          user.ondrop = dropUser; // вешаем прослушку событию сбрасывания элемента в список задач пользователя
        });
      }
      // ...
    }
    // ...
  });

  // находим DOM всех отображённых задач
  const taskList = document.querySelectorAll(".app-task__item");
  // перебираем задачи
  taskList.forEach((task) => {
    task.draggable = "true"; // разрешаем перетаскивание
    task.ondragstart = drag; // вешаем прослушку собитию начала перетаскивания
  });
};
// ...

// изменяет отображение полей статусов и списков задач при перетаскивании
// логика: если перетаскиваемая задач из backlog красим его в красный (первая иттерация fieldFlag = false)
// т.к. задачу можно перенести только в следующее поле (inprogress), далее выставляем флаг fieldFlag = true
// все списки задач красим в красный (нужно для будущих иттераций, что бы покрасить в красный списки в предыдущих полях)
// попадаем в блок если !userFlag, красим списки задач пользователей, в соответственный цвет
// если задача его в зелёный, иначе в красный
// соответственно на следующей иттерации цикла попадаем в блок если fieldFlag, красим поле в зелёный (inprogress),
// сбрасываем флаг fieldFlag, красим все списки в поле inprogress в зелёный, т.к. перетаскиваемая задач находится
// в бэклог, значит её можно перетащить хоть в того же пользователя, хоть в другого
// сбрасываем userFlag, и более он уже не будет выставлен, т.к. блок сравнения позиции перетаскиваемой задачи может
// сработать только при одной иттерации цикла, соответственно всё что дальше будет покрашено в красный
function allowDrop(event) {
  event.preventDefault(); // отменяем работу по умолчанию

  // Объявляем переменные
  const taskLocation = taskLocationById(taskIdAllowDrop); // расположение (поле статуса) перемещаемой задачи
  const taskOwner = taskOwnById(taskIdAllowDrop); // ответственный за задачу
  const taskList = document.querySelectorAll(".app-task__item"); // списко DOM задач
  const usersOfAllFields = document.querySelectorAll(".app-task__user"); // списко DOM списков задач пользователей в полях статуса

  let usersOfTaskList; // список задач пользователей
  let fieldFlag = false, // флаг для отслеживания изменения цвета границы полей статусов
    userFlag = false; // флаг для отслеживания изменения цвета границы списков задач пользователей

  // перебираем все задачи и скрываем их
  taskList.forEach((task) => {
    task.style.display = "none";
  });

  // перебираем поля статусов
  for (let i = 0; i < tasksColumns.length; i++) {
    // находим DOM списков задач пользователей в i-том поле статуса
    usersOfTaskList = tasksColumns[i].querySelectorAll(".app-task__user");

    // если fieldFlag
    if (fieldFlag) {
      tasksColumns[i].style.border = "5px solid #108ea2"; // красим границу поля статуса
      fieldFlag = false; // сбрасываем флаг
      // перебираем список задач пользователей в i-том поле статуса
      usersOfTaskList.forEach((user) => {
        user.style.border = "5px solid #12a974"; // красим границу
      });
      userFlag = true; // сбрасываем флаг
    }
    // иначе
    else tasksColumns[i].style.border = "5px solid #d5370f"; // красим границу поля статуса
    // ...

    // если расположение задачи равно полю статуса
    if (locationList[i] == taskLocation) {
      fieldFlag = true; // выставляем флаг
      tasksColumns[i].style.border = "5px solid #d5370f"; // красим границу поля статуса

      // перебираем списки задач пользователей
      usersOfAllFields.forEach((user) => {
        user.style.border = "5px solid #d5370f"; // красим границу
      });

      // если userFlag = false
      if (!userFlag) {
        // перебираем список задач пользователей в i-том поле статуса
        for (let j = 0; j < usersOfTaskList.length; j++) {
          // если ответственный за задачу совпадает со списком задач пользователя
          if (taskOwner != usersOfTaskList[j].innerText) {
            usersOfTaskList[j].style.border = "5px solid #12a974"; // красим границу
          }
          // иначе
          else usersOfTaskList[j].style.border = "5px solid #d5370f"; // красим границу
          // ...
        }
        // ...
      }
      // иначе (userFlag = true)
      else usersOfTaskList[j].style.border = "5px solid #d5370f"; // красим границу
      // ...
    }
    // ...
  }
  // ...
}
// ...

// сохраняет id перетаскиваемой задачи в dataTransfer, так же передаёт его в переменную
function drag(event) {
  event.dataTransfer.setData("id", event.target.id);
  taskIdAllowDrop = event.target.id;
}
// ...

// если возможно (перетаскивать можно только в следующее поле) переносит задачу в данное поле статуса
function dropField(event) {
  const itemId = event.dataTransfer.getData("id"); // сохраняем id перетаскиваемой задачи в переменную
  const itemLocation = taskLocationById(itemId); // находим и сохраняем расположение задачи по id
  const dropField = event.target.id; // сохраняем название поля статуса куда сбросили задачу

  if (dropField) {
    // перебираем список полей статусов (текстовые названия, как в dropField)
    for (let i = 0; i < locationList.length; i++) {
      // если перетаскиваемая задача была расположена в i-том поле
      if (itemLocation == locationList[i]) {
        // если поле в которую задачу сбросили - следующее (i+1)
        if (dropField == locationList[i + 1]) {
          moveToNextStage(itemId); // переносим задачу в следующее поле
          break; // прерываем цикл, цель функции выполнена
        }
        // ...
      }
      // ...
    }
    // ...
  }
  // ...

  setFieldToDefault(); // сбрасываем границу полей статусов по умолчанию
}
// ...

// если возможно (другому пользователю в текущем поле, либо всем в следующем) переносит задачу другому пользователю
function dropUser(event) {
  const itemId = event.dataTransfer.getData("id"); // сохраняем id перетаскиваемой задачи в переменную
  const itemOwner = taskOwnById(itemId); // находим и сохраняем ответственного перетаскиваемой задачи
  const itemLocation = taskLocationById(itemId); // находим и сохраняем расположение задачи
  const dropUser = event.target.innerText; // сохраняем имя ответственного в текстовом формате
  const dropParent = event.target.parentNode; // сохраняем DOM родителя задачи, т.е. поле статуса

  // если расположение задачи и поле в которое её сбросили не равны
  if (itemLocation != dropParent.id) {
    // перебираем список полей статусов (текстовые названия)
    for (let i = 0; i < locationList.length; i++) {
      // если расположение задачи совпадает с i-ым полем из списка
      if (itemLocation == locationList[i]) {
        // если поле в которое сбросили задачу следующее (i+1)
        if (dropParent.id == locationList[i + 1]) {
          moveToNextStage(itemId); // переносим задачу в следующее поле
          // если ответственный за задачу и пользователь которому скинули задачу не равны
          if (itemOwner != dropUser) {
            editInStorage("tasks", itemId, "own", dropUser); // изменяем ответственного за задачу
          }
          break; // прерываем цикл, задача функции выполнена
        }
        // ...
      }
      // ...
    }
    // ...
  }
  // иначе (расположение задачи и поле в которое её сбросили равны)
  else {
    // если ответственный за задачу и пользователь которому скинули задачу не равны
    if (itemOwner != dropUser) {
      editInStorage("tasks", itemId, "own", dropUser); // изменяем ответственного за задачу
    }
    // ...
  }
  // ...
}
// ...
