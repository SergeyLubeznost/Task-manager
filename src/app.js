"use strict";

// объявление переменных для хранения DOM элементов полей задач
export let backlogAddTaskBtn,
  readyAddTaskBtn,
  inProgAddTaskBtn,
  finishedAddTaskBtn,
  backlog,
  ready,
  inprogress,
  finished,
  tasksColumns;

import "bootstrap/dist/css/bootstrap.min.css";
import Modal from "bootstrap/js/dist/modal";
import "./styles/style.css";
import taskFieldTemplate from "./templates/taskField.html";
import navbarAuthTemplate from "./templates/navbarAuth.html";
import navbarNotAuthTemplate from "./templates/navbarNotAuth.html";
import footerAuthTemplate from "./templates/footerAuth.html";
import footerNotAuthTemplate from "./templates/footerNotAuth.html";
import menu1Template from "./templates/menu1.html";
import menu2Template from "./templates/menu2.html";
import myAccountTemplate from "./templates/account.html";
import { User } from "./models/User";
import { Admin } from "./models/Admin";
import { Task } from "./models/Task";
import { State } from "./state";
import { authUser } from "./services/auth";
import {
  getFromStorage,
  generateTestUser,
  generateAdmin,
  deleteFromStorage,
  editInStorage,
  isCurrentUserAdmin,
  isTheLoginFree,
  addNewUser,
  displayTasks,
  updUserList,
  updTasksList,
  moveToNextStage,
  updBtnStatus,
  userIdByName,
  EventListener,
} from "./utils";

export const appState = new State(); // хранение залогиненого пользователя

// назначение модального окна (МО) добавления задачи
const modalWindow = new Modal(document.querySelector("#staticBackdrop"));

// модальное окно добавления задачи как элемент
const modalWindowElement = document.querySelector("#staticBackdrop");

// кнопки в МО добавления задач
const taskAddOkBtn = document.querySelector(".app-button-input"); // кнопка Add
const taskEditOkBtn = document.querySelector(".app-button-input-taskedit"); // кнопка Apply
const changeOwnerBtn = document.querySelector(".app-button-task-changeowner"); // кнопка Change owner
const deleteTaskBtn = document.querySelector(".app-button-task-delete"); // кнопка Delete task

// назначение модального окна добавления нового пользователя
const modalWindowAddUser = new Modal(
  document.querySelector("#staticBackdropAddUser")
);

// кнопка Apply в модальном окне добавления пользователя...
const taskInputAddUserBtn = document.querySelector(".app-button-input-adduser");

// назначение модального окна alert
const modalAlert = new Modal(document.querySelector("#alert"));

// DOM элементы
const navbar = document.querySelector(".navbar"); // панель навигации (ПН)
const content = document.querySelector("#content"); // для вставления основного содержания, задач
const footer = document.querySelector("#footer"); // футер
const modalWindowLabel = document.querySelector("#staticBackdropLabel"); // заголовок МО добавления задач
const inputTask = document.querySelector(".app-input-task"); // input в МО добавления задач
const inputTaskLabel = document.querySelector(".app-input-task-label"); // надпись над input в МО добавления задач
const inputUser = document.querySelector("#input-user"); // всплывающий список в МО добавления задач
const inputUserLabel = document.querySelector(".app-input-user-label"); // надпись над всплывающим списком в МО добавления задач
const inputUserForm = document.querySelector("#input-user-form"); // обёртка всплывающего списка в МО добавления задач
const popupBg = document.querySelector(".app-popup-bg"); // бэкграунд popup меню пользователя
const popup = document.querySelector(".app-popup"); // popup меню меню пользователя
const myTasks = document.querySelector("#app-tasks-btn"); // пункт меню задачи
const menu1 = document.querySelector("#app-menu1-btn"); // пункт меню 1
const menu2 = document.querySelector("#app-menu2-btn"); // пункт меню 2
const addUser = document.querySelector("#app-adduser-btn"); // пункт меню добавления нового пользователя
const deleteUser = document.querySelector("#app-deleteuser-btn"); // пункт меню удаления пользователя
const account = document.querySelector("#app-account-btn"); // пункт меню аккаунт
const logout = document.querySelector("#app-logout-btn"); // пункт меню выход

// input в МО создания нового пользователя
const inputLogin = document.querySelector(".app-input-login");
const inputPass1 = document.querySelector(".app-input-password-1");
const inputPass2 = document.querySelector(".app-input-password-2");

const alertMessage = document.querySelector("#alert-message"); // поле сообщения alert

let applyBtnFlag = "TaskEdit"; // флаг для функционала кнопки Apply в МО задачи

localStorage.clear(); // очистка локального хранилища
generateTestUser(User);
generateAdmin(Admin);

document.addEventListener("DOMContentLoaded", startApp); // после загрузки DOM запускается приложение
modalWindowElement.addEventListener("hidden.bs.modal", handlerDefault); // слушатель на скрытие МО

let taskId = ""; // переменная для хранения id задачи
let taskName = ""; // переменная для хранения имя задачи

// запускает приложение, отображает необходимые элементы, осуществляет основную функциональность приложения
function startApp() {
  navbar.innerHTML = navbarNotAuthTemplate; // в ПН отображается не авторизованный шаблон
  footer.innerHTML = footerNotAuthTemplate; // в футер отображается не авторизованный шаблон
  let username = document.querySelector("#username"); // поле вывода имя пользователя
  username.innerHTML = `Kanban board, ${new Date().getFullYear()}`; // выводим текущий год

  // находим и сохраняем в переменные DOM элементов
  const popupAuth = document.querySelector(".app-popup-auth"); // popup обёртка формы входа mini
  const loginForm = document.querySelector("#app-login-form"); // форма входа
  const loginFormMini = document.querySelector("#app-login-form-mini"); // форма входа mini
  const burgerClose = document.querySelector(".navbar-toggler"); // бургер в ПН, форма входа закрыта
  const burgerOpen = document.querySelector(".navbar-toggler-open"); // бургер в ПН, форма входа открыта

  // прослушка бургер меню
  burgerClose.addEventListener("click", handlerBurger);
  burgerOpen.addEventListener("click", handlerBurger);

  // прослушка формы входа на submit
  loginForm.addEventListener("submit", handlerForm); // обычная форма
  loginFormMini.addEventListener("submit", handlerForm); // мини форма в popup

  // срабатывает при клике по burger меню
  function handlerBurger() {
    popupAuth.classList.toggle("invisible");
    burgerClose.classList.toggle("invisible");
    burgerOpen.classList.toggle("invisible");
  }
  // ...

  // срабатывает при попытке логина
  function handlerForm(e) {
    e.preventDefault(); // отключаем отправку формы

    // передача данных из инпутов логина и пароля в переменные
    const formData = new FormData(loginForm);
    let login = formData.get("login");
    let password = formData.get("password");

    // передача данных из инпутов логина и пароля mini в переменные
    const formDataMini = new FormData(loginFormMini);
    const loginMini = formDataMini.get("login");
    const passwordMini = formDataMini.get("password");

    // если есть информация в инпутах формы мини, то передаём её
    // в обычные переменный, которые будут использоватся для
    // проверки авторизации
    if (loginMini && passwordMini) {
      login = loginMini;
      password = passwordMini;
    }
    // ...

    // если логин или пароль пустой выводит alert
    if (!login || !password) {
      alertMessage.innerHTML = "Input login and password";
      modalAlert.show();
      return;
    }
    // ...

    let auth = authUser(login, password); // сохраняем результат проверки логина и пароля

    // присвоить переменной соответствующий шаблон основного содержания в зависимости от результата авторизации
    let fieldHTMLContent = auth
      ? taskFieldTemplate
      : '<h2 class="app-auth-message">Please Sign In to see your tasks!</h2>';

    // присвоить переменной шаблон НП в зависимости от результата авторизации
    let navbarContent = auth ? navbarAuthTemplate : navbarNotAuthTemplate;

    // присвоить переменной шаблон футера в зависимости от результата авторизации
    let footerContent = auth ? footerAuthTemplate : footerNotAuthTemplate;

    // передача шаблонов из переменных в DOM приложения
    content.innerHTML = fieldHTMLContent;
    navbar.innerHTML = navbarContent;
    footer.innerHTML = footerContent;

    // если авторизация не состоялась выводим alert
    if (!auth) {
      alertMessage.innerHTML = "Login or password incorrect, please try again";
      modalAlert.show();
      loginForm.removeEventListener("submit", handlerForm); // удаляем прослушку, иначе наложится
      return startApp(); // прерываем и запускаем заново работу приложения
    }
    // ...

    username = document.querySelector("#username"); // обновляем DOM поля вывода имя пользователя после авторизации
    const greetings = document.querySelector("#greetings"); // поле приветствия
    const currentUser = appState.currentUser.login; // сохраняем логин текущего пользователя

    // отображаем приветствие и имя пользователя
    greetings.innerHTML = `Hello ${currentUser}!`;

    // отображаем пользователя и год в footer
    username.innerHTML = `Kanban board by ${currentUser}, ${new Date().getFullYear()}`;

    // назначение DOM элементов после авторизации и отображения соответствующей информации
    const avatar = document.querySelector(".app-avatar"); // иконки пользователя (userMenuClose и userMenuOpen)
    const userMenuClose = document.querySelector("#user-menu-close"); // иконка пользователя при закрытом меню
    const userMenuOpen = document.querySelector("#user-menu-open"); // иконка пользователя при открытом меню

    // выставляем статус иконки по умолчанию (меню закрыто)
    userMenuClose.classList.remove("invisible");
    userMenuOpen.classList.add("invisible");

    tasksFieldInit(); // инициализация полей задач

    // если пользователь админ отображает необходимую информацию
    if (isCurrentUserAdmin()) {
      addUser.classList.remove("invisible");
      deleteUser.classList.remove("invisible");
    } else {
      addUser.classList.add("invisible");
      deleteUser.classList.add("invisible");
    }
    // ...

    displayTasks(tasksColumns, currentUser, handlerTaskEdit); // отображаем задачи
    updBtnStatus(tasksColumns); // обновляем статусы кнопок

    // добавляем прослушку
    avatar.addEventListener("click", handlerAvatar); // иконки пользователя (отображает popup меню пользователя)
    popupBg.addEventListener("click", handlerAvatar); // бэкграунд popup меню пользователя
    myTasks.addEventListener("click", handlerMyTasks); // пункт меню My tasks
    menu1.addEventListener("click", handlerMenu1); // пункт меню Menu 1
    menu2.addEventListener("click", handlerMenu2); // пункт меню Menu 2
    addUser.addEventListener("click", handlerAddUser); // пункт меню добавления пользователя
    deleteUser.addEventListener("click", handlerDeleteUser); // пункт меню удаления пользователя
    account.addEventListener("click", handlerAccount); // пункт меню My account
    logout.addEventListener("click", handlerLogout); // пункт меню выход
    backlogAddTaskBtn.addEventListener("click", handlerAddTask); // кнопка добавить задачу в поле backlog
    readyAddTaskBtn.addEventListener("click", handlerMoveTask); // кнопка добавить задачу в поле ready
    inProgAddTaskBtn.addEventListener("click", handlerMoveTask); // кнопка добавить задачу в поле inprogress
    finishedAddTaskBtn.addEventListener("click", handlerMoveTask); // кнопка добавить задачу в поле finished
    taskAddOkBtn.addEventListener("click", handlerTaskOkBtn); // кнопка Add в МО добавления задач
    taskEditOkBtn.addEventListener("click", handlerTaskEditOkBtn); // кнопка Apply в МО
    changeOwnerBtn.addEventListener("click", handlerChangeOwnerBtn); // кнопка Change owner в МО
    deleteTaskBtn.addEventListener("click", handlerDeleteTaskBtn); // кнопка Delete в МО
    taskInputAddUserBtn.addEventListener("click", handlerAddUserOkBtn); // кнопка Apply в МО добавления пользователя

    // инициализирует поля статусов
    function tasksFieldInit() {
      // кнопки добавления задач в полях статусов
      backlogAddTaskBtn = document.querySelector("#backlog-addtask-btn");
      readyAddTaskBtn = document.querySelector("#ready-addtask-btn");
      inProgAddTaskBtn = document.querySelector("#inprogress-addtask-btn");
      finishedAddTaskBtn = document.querySelector("#finished-addtask-btn");

      // поля статусов задач
      backlog = document.querySelector(".app-backlog");
      ready = document.querySelector(".app-ready");
      inprogress = document.querySelector(".app-inprogress");
      finished = document.querySelector(".app-finished");

      // сохраняем список DOM полей статусов задач в массив
      tasksColumns = [backlog, ready, inprogress, finished];

      EventListener(tasksColumns, handlerOnDrop, "drop"); // прослушка drop на поля статусов
    }
    // ...

    // обновляет отображение задач и кнопок после перетаскивания
    function handlerOnDrop() {
      setTimeout(() => {
        displayTasks(tasksColumns, appState.currentUser.login, handlerTaskEdit); // отображаем задачи
        updBtnStatus(tasksColumns); // обновляем статусы кнопок
      }, 100);
    }
    // ...

    // скрывает попап меню пользователя, меняет вид иконки на закрытую
    function closePopupUserMenu() {
      popupBg.classList.add("invisible"); // скрываем бэкграунд popup
      popup.classList.add("invisible"); // скрываем popup

      // отображаем закрытую иконку
      userMenuClose.classList.remove("invisible");
      userMenuOpen.classList.add("invisible");
    }
    // ...

    // переключает вид иконки пользователя
    function handlerAvatar() {
      userMenuClose.classList.toggle("invisible");
      userMenuOpen.classList.toggle("invisible");
      popupBg.classList.toggle("invisible");
      popup.classList.toggle("invisible");
    }
    // ...

    // отображает задачи пользователя
    function handlerMyTasks() {
      closePopupUserMenu();

      content.innerHTML = fieldHTMLContent; // отображаем поля задач

      tasksFieldInit(); // // инициализация полей задач

      // добавляем прослушку
      backlogAddTaskBtn.addEventListener("click", handlerAddTask); // кнопка добавить задачу в поле backlog
      readyAddTaskBtn.addEventListener("click", handlerMoveTask); // кнопка добавить задачу в поле ready
      inProgAddTaskBtn.addEventListener("click", handlerMoveTask); // кнопка добавить задачу в поле inprogress
      finishedAddTaskBtn.addEventListener("click", handlerMoveTask); // кнопка добавить задачу в поле finished

      displayTasks(tasksColumns, currentUser, handlerTaskEdit); // отображаем задачи
      updBtnStatus(tasksColumns); // обновляем статусы кнопок
    }
    // ...

    // отображает шаблон меню 1
    function handlerMenu1() {
      content.innerHTML = menu1Template; // отображаем в основном содержании шаблон меню 1
      closePopupUserMenu();
    }
    // ...

    // отображает шаблон меню 2
    function handlerMenu2() {
      content.innerHTML = menu2Template; // отображаем в основном содержании шаблон меню 2
      closePopupUserMenu();
    }
    // ...

    // срабатывает при нажатии на кнопку добавления нового пользователя, отображает МО
    function handlerAddUser() {
      closePopupUserMenu();

      modalWindowAddUser.show();
    }
    // ...

    // срабатывает при нажатии на кнопку удаления пользователя, отображает МО
    function handlerDeleteUser() {
      applyBtnFlag = "DeleteUser"; // установка флага

      handlerMyTasks(); // отображаем задачи

      // настраиваем отображение элементов МО
      taskEditOkBtn.classList.remove("invisible"); // кнопка Apply отображаем
      taskAddOkBtn.classList.add("invisible"); // кнопка Add скрываем
      inputTask.classList.add("invisible"); // input в МО добавления задач скрываем
      inputTaskLabel.classList.add("invisible"); // надпись над input скрываем
      inputUserForm.classList.remove("invisible"); // всплывающий список отображаем
      modalWindowLabel.innerHTML = "Delete user"; // заголовок МО добавления задач
      inputUserLabel.innerHTML = "Select a user"; // меняем надпись над всплывающим списком

      closePopupUserMenu();

      updUserList(); // обновляем список пользователей во всплывающем меню

      // если в localstorge нет ни одного пользователя выводим алерт
      // и прерываем выполнение функции
      const users = getFromStorage("users");
      if (!users.length) {
        alertMessage.innerHTML = "There are no users to delete";
        modalAlert.show();
        return;
      }
      // ...

      modalWindow.show(); // отображаем МО
    }
    // ...

    // отображает шаблон аккаунт
    function handlerAccount() {
      content.innerHTML = myAccountTemplate; // отображаем в основном содержании шаблон меню 2
      closePopupUserMenu();
    }
    // ...

    // срабатывает при нажатии на пункт меню выход
    function handlerLogout() {
      // сброс основного содержания и текущего пользователя
      content.innerHTML =
        '<h2 class="app-auth-message">Please Sign In to see your tasks!</h2>';
      appState.currentUser = null;

      // удаление слушателей которые останутся после выхода и повесятся ещё раз при перезапуске startApp
      taskAddOkBtn.removeEventListener("click", handlerTaskOkBtn);
      taskEditOkBtn.removeEventListener("click", handlerTaskEditOkBtn);
      changeOwnerBtn.removeEventListener("click", handlerChangeOwnerBtn);
      deleteTaskBtn.removeEventListener("click", handlerDeleteTaskBtn);
      popupBg.removeEventListener("click", handlerAvatar);
      myTasks.removeEventListener("click", handlerMyTasks);
      menu1.removeEventListener("click", handlerMenu1);
      menu2.removeEventListener("click", handlerMenu2);
      addUser.removeEventListener("click", handlerAddUser);
      deleteUser.removeEventListener("click", handlerDeleteUser);
      account.removeEventListener("click", handlerAccount);
      logout.removeEventListener("click", handlerLogout);
      taskInputAddUserBtn.removeEventListener("click", handlerAddUserOkBtn);

      taskId = ""; // сброс id
      applyBtnFlag = "TaskEdit"; // сброс флага для функционала кнопки Apply в МО добавления задач
      popupBg.classList.add("invisible"); // скрываем бэкграунд popup
      popup.classList.add("invisible"); // скрываем popup

      return startApp(); // перезапуск приложения
    }
    // ...

    // срабатывает при нажатии кнопки добавления новой задачи
    function handlerAddTask() {
      // если админ отображает всплывающий список иначе скрывает
      if (currentUser == "admin") {
        inputUserForm.classList.remove("invisible");
      } else {
        inputUserForm.classList.add("invisible");
      }
      // ...

      modalWindow.show(); // отображаем МО
    }
    // ...

    // срабатывает при нажатии на кнопку add task во всех полях кроме backlog
    function handlerMoveTask(e) {
      const locationList = ["backlog", "ready", "inprogress", "finished"];
      applyBtnFlag = "MoveTask";

      // настройка нужного отображения
      inputTaskLabel.classList.add("invisible"); // надпись над input скрываем
      inputTask.classList.add("invisible"); // input скрываем
      taskAddOkBtn.classList.add("invisible"); // кнопку add скрываем
      taskEditOkBtn.classList.remove("invisible"); // кнопку apply отображаем
      modalWindowLabel.innerHTML = "Move task to next stage"; // меняем название МО
      inputUserLabel.innerHTML = "Select a task"; // меняем надпись над всплывающим списком

      // перебираем поля статусов
      for (const location of locationList) {
        // если id нажатой кнопки содержит название поля статуса,
        // то передаём название данного поля в функцию отображения задач во всплывающем списке
        if (e.target.id.match(location)) {
          updTasksList(location);
          break;
        }
      }
      // ...

      inputUserForm.classList.remove("invisible"); // отобразить всплывающий список
      modalWindow.show();
    }
    // ...

    // срабатывает при нажатии на кнопку Add в МО добавления задач
    function handlerTaskOkBtn() {
      if (!inputTask.value) return; // если инпут пустой ничего не происходит

      // если админ, то создаём задачу для выбранного пользователя, иначе для залогиненого
      if (currentUser == "admin") {
        const task = new Task(inputTask.value, inputUser.value);
        Task.save(task);
      } else {
        const task = new Task(inputTask.value, login);
        Task.save(task);
      }
      // ...

      displayTasks(tasksColumns, login, handlerTaskEdit);
      updBtnStatus(tasksColumns);
      modalWindow.hide();
    }
    // ...

    // срабатывае при нажатии на кнопку Apply в МО
    function handlerTaskEditOkBtn() {
      // в зависимости от флага редактирует либо переносит задачу в следующую стадию
      // либо изменяет ответственного у задачи, либо удаляет выбранного пользователя
      if (applyBtnFlag == "TaskEdit") {
        editInStorage("tasks", taskId, "name", inputTask.value);
      } else if (applyBtnFlag == "MoveTask") {
        moveToNextStage(inputUser.value);
      } else if (applyBtnFlag == "ChangeOwner") {
        editInStorage("tasks", taskId, "own", inputUser.value);
      } else if (applyBtnFlag == "DeleteUser") {
        // удаляем пользователя и далее все задачи принадлежащие ему
        deleteFromStorage("users", userIdByName(inputUser.value));
        const storageData = getFromStorage("tasks");
        if (storageData.length) {
          storageData.forEach((task) => {
            if (task.own == inputUser.value) {
              deleteFromStorage("tasks", task.id);
            }
          });
        }
      }
      // ...

      modalWindow.hide(); // скрываем МО

      handlerDefault(); // выставление состояния элементов по умолчанию

      displayTasks(tasksColumns, currentUser, handlerTaskEdit);
      updBtnStatus(tasksColumns);
    }
    // ...

    // отображает МО с необходимой информацией при нажатии на задачу
    function handlerTaskEdit(e) {
      applyBtnFlag = "TaskEdit"; // установка флага для использования МО для редактирования задачи
      taskId = e.target.id; // сохраняем id редактируемой задачи
      taskName = this.innerHTML; // сохраняем имя редактируемой задачи
      inputTask.value = taskName; // отображаем в инпуте название текущей задачи
      inputUserForm.classList.add("invisible"); // скрываем всплывающий список
      taskEditOkBtn.classList.remove("invisible"); // отображаем кнопку Apply
      taskAddOkBtn.classList.add("invisible"); // скрываем кнопку Add

      // если админ, отображаем кнопку Delete и Change owner
      if (currentUser == "admin") {
        changeOwnerBtn.classList.remove("invisible");
        deleteTaskBtn.classList.remove("invisible");
      }

      modalWindow.show(); // отображаем МО
    }
    // ...

    // изменякт вид МО под задачу изменения ответственного выбранной задачи
    function handlerChangeOwnerBtn() {
      const users = getFromStorage("users");
      // если меньше двух пользователей в хранилище, выводим alert
      if (users.length < 2) {
        alertMessage.innerHTML = "Add more users first";
        modalAlert.show();
        return;
      }
      // ...

      applyBtnFlag = "ChangeOwner";

      updUserList();
      modalWindowLabel.innerHTML = `Change the owner of ${taskName}`; // изменяем надпись в заголовке МО
      inputTaskLabel.classList.add("invisible"); // скрываем надпись над инпутом
      inputTask.classList.add("invisible"); // скрываем инпут добавления задачи
      inputUserForm.classList.remove("invisible"); // отображаем всплывающий список
      inputUserLabel.innerHTML = "Select a new owner"; // изменяем надпись над всплывающим списком
      changeOwnerBtn.classList.add("invisible"); // скрываем кнопку сменю ответственного
      deleteTaskBtn.classList.add("invisible"); // скрываем кнопку удаления задачи
    }
    // ...

    // срабатывает при нажатии на кнопку Delete при редактировании задачи
    function handlerDeleteTaskBtn() {
      deleteFromStorage("tasks", taskId);
      displayTasks(tasksColumns, currentUser, handlerTaskEdit);
      updBtnStatus(tasksColumns);
      modalWindow.hide(); // скрываем МО

      deleteTaskBtn.classList.add("invisible"); // скрываем Delete
      taskEditOkBtn.classList.add("invisible"); // скрываем Apply
      taskAddOkBtn.classList.remove("invisible"); // отображаем Add
    }
    // ...

    // срабатывает при нажатии кнопки добавления нового пользователя
    function handlerAddUserOkBtn() {
      handlerMyTasks(); // отображаем задачи

      // передача данных из инпутов в переменные
      const login = inputLogin.value,
        pass1 = inputPass1.value,
        pass2 = inputPass2.value;

      // если какой-то инпут пустой отображает alert и прерывает выполнение функции
      if (!login || !pass1 || !pass2) {
        alertMessage.innerHTML = "All fields are required";
        modalAlert.show();
        return;
      }
      // ...

      // если имя пользователя содержит admin отображает alert и прерывает выполнение функции
      if (login.match(/admin/gi)) {
        alertMessage.innerHTML = "This name cannot be used";
        modalAlert.show();
        return;
      }
      // ...

      // если такого имя пользователя не существует
      // и если пароли в инпутах совпадают, то создаёт нового пользователя,
      // иначе выводит alert
      else if (isTheLoginFree(login)) {
        if (pass1 == pass2) {
          addNewUser(User, login, pass1);
        } else {
          alertMessage.innerHTML = "Password not confirmed";
          modalAlert.show();
          return;
        }
      }

      // иначе выводит alert
      else {
        alertMessage.innerHTML = "That login already exists";
        modalAlert.show();
        return;
      }
      // ...

      updBtnStatus(tasksColumns); // обновляем статусы кнопок

      modalWindowAddUser.hide(); // скрываем МО
    }
    // ...
  }
  // ...
}
// ...

// сбрасывает необходимые настройки отображения к начальным
function handlerDefault() {
  inputTaskLabel.classList.remove("invisible"); // отображаем надпись над input в МО
  changeOwnerBtn.classList.add("invisible"); // скрываем кнопку изменения ответственного за задачу
  deleteTaskBtn.classList.add("invisible"); // скрываем кнопку удаления задачи в МО
  taskEditOkBtn.classList.add("invisible"); // скрываем кнопку Apply в МО
  inputUserForm.classList.add("invisible"); // скрываем всплывающий список в МО
  modalWindowLabel.innerHTML = "Input task name"; // меняем название МО
  inputUserLabel.innerHTML = "Select a user"; // меняем надпись на всплывающим списком в МО
  taskAddOkBtn.classList.remove("invisible"); // отображаем кнопку Add в МО
  inputTask.classList.remove("invisible"); // отображаем input в МО добавления задач
  taskId = ""; // сброс id задачи
  taskName = ""; // сброс названия задачи
}
// ...
