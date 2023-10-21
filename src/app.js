"use strict";

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

export const appState = new State();
const modalWindow = new Modal(document.querySelector("#staticBackdrop"));
const modalWindowElement = document.querySelector("#staticBackdrop");
const taskAddOkBtn = document.querySelector(".app-button-input"); 
const taskEditOkBtn = document.querySelector(".app-button-input-taskedit"); 
const changeOwnerBtn = document.querySelector(".app-button-task-changeowner"); 
const deleteTaskBtn = document.querySelector(".app-button-task-delete");

const modalWindowAddUser = new Modal(
  document.querySelector("#staticBackdropAddUser")
);
const taskInputAddUserBtn = document.querySelector(".app-button-input-adduser");
const modalAlert = new Modal(document.querySelector("#alert"));
const navbar = document.querySelector(".navbar"); 
const content = document.querySelector("#content");
const footer = document.querySelector("#footer"); 
const modalWindowLabel = document.querySelector("#staticBackdropLabel"); 
const inputTask = document.querySelector(".app-input-task");
const inputTaskLabel = document.querySelector(".app-input-task-label"); 
const inputUser = document.querySelector("#input-user"); 
const inputUserLabel = document.querySelector(".app-input-user-label"); 
const inputUserForm = document.querySelector("#input-user-form");
const popupBg = document.querySelector(".app-popup-bg"); 
const popup = document.querySelector(".app-popup");
const myTasks = document.querySelector("#app-tasks-btn");
const addUser = document.querySelector("#app-adduser-btn"); 
const deleteUser = document.querySelector("#app-deleteuser-btn");
const logout = document.querySelector("#app-logout-btn");
const inputLogin = document.querySelector(".app-input-login");
const inputPass1 = document.querySelector(".app-input-password-1");
const inputPass2 = document.querySelector(".app-input-password-2");
const alertMessage = document.querySelector("#alert-message");
let applyBtnFlag = "TaskEdit"; 
localStorage.clear();
generateTestUser(User);
generateAdmin(Admin);

document.addEventListener("DOMContentLoaded", startApp);
modalWindowElement.addEventListener("hidden.bs.modal", handlerDefault);

let taskId = ""; 
let taskName = "";

function startApp() {
  navbar.innerHTML = navbarNotAuthTemplate;
  footer.innerHTML = footerNotAuthTemplate;
  let username = document.querySelector("#username"); 
  username.innerHTML = `Kanban board, ${new Date().getFullYear()}`;
  const popupAuth = document.querySelector(".app-popup-auth"); 
  const loginForm = document.querySelector("#app-login-form"); 
  const loginFormMini = document.querySelector("#app-login-form-mini"); 
  const burgerClose = document.querySelector(".navbar-toggler"); 
  const burgerOpen = document.querySelector(".navbar-toggler-open");
  burgerClose.addEventListener("click", handlerBurger);
  burgerOpen.addEventListener("click", handlerBurger);
  loginForm.addEventListener("submit", handlerForm); 
  loginFormMini.addEventListener("submit", handlerForm);
  function handlerBurger() {
    popupAuth.classList.toggle("invisible");
    burgerClose.classList.toggle("invisible");
    burgerOpen.classList.toggle("invisible");
  }
  function handlerForm(e) {
    e.preventDefault();
    const formData = new FormData(loginForm);
    let login = formData.get("login");
    let password = formData.get("password");
    const formDataMini = new FormData(loginFormMini);
    const loginMini = formDataMini.get("login");
    const passwordMini = formDataMini.get("password");
    if (loginMini && passwordMini) {
      login = loginMini;
      password = passwordMini;
    }

    if (!login || !password) {
      alertMessage.innerHTML = "Input login and password";
      modalAlert.show();
      return;
    }
    
    let auth = authUser(login, password);
    let fieldHTMLContent = auth
      ? taskFieldTemplate
      : '<h2 class="app-auth-message">Please Sign In to see your tasks!</h2>';
    let navbarContent = auth ? navbarAuthTemplate : navbarNotAuthTemplate;
    let footerContent = auth ? footerAuthTemplate : footerNotAuthTemplate;
    content.innerHTML = fieldHTMLContent;
    navbar.innerHTML = navbarContent;
    footer.innerHTML = footerContent;

    if (!auth) {
      alertMessage.innerHTML = "Login or password incorrect, please try again";
      modalAlert.show();
      loginForm.removeEventListener("submit", handlerForm);
      return startApp();
    }
    username = document.querySelector("#username");
    const greetings = document.querySelector("#greetings"); 
    const currentUser = appState.currentUser.login;
    greetings.innerHTML = `Hello ${currentUser}!`;
    username.innerHTML = `Kanban board by ${currentUser}, ${new Date().getFullYear()}`;
    const avatar = document.querySelector(".app-avatar"); 
    const userMenuClose = document.querySelector("#user-menu-close");
    const userMenuOpen = document.querySelector("#user-menu-open");
    userMenuClose.classList.remove("invisible");
    userMenuOpen.classList.add("invisible");

    tasksFieldInit(); 
    if (isCurrentUserAdmin()) {
      addUser.classList.remove("invisible");
      deleteUser.classList.remove("invisible");
    } else {
      addUser.classList.add("invisible");
      deleteUser.classList.add("invisible");
    }
 
    displayTasks(tasksColumns, currentUser, handlerTaskEdit);
    updBtnStatus(tasksColumns);
    avatar.addEventListener("click", handlerAvatar);
    popupBg.addEventListener("click", handlerAvatar); 
    myTasks.addEventListener("click", handlerMyTasks); 
    addUser.addEventListener("click", handlerAddUser); 
    deleteUser.addEventListener("click", handlerDeleteUser);
    logout.addEventListener("click", handlerLogout);
    backlogAddTaskBtn.addEventListener("click", handlerAddTask);
    readyAddTaskBtn.addEventListener("click", handlerMoveTask); 
    inProgAddTaskBtn.addEventListener("click", handlerMoveTask); 
    finishedAddTaskBtn.addEventListener("click", handlerMoveTask); 
    taskAddOkBtn.addEventListener("click", handlerTaskOkBtn);
    taskEditOkBtn.addEventListener("click", handlerTaskEditOkBtn); 
    changeOwnerBtn.addEventListener("click", handlerChangeOwnerBtn); 
    deleteTaskBtn.addEventListener("click", handlerDeleteTaskBtn);
    taskInputAddUserBtn.addEventListener("click", handlerAddUserOkBtn);

    function tasksFieldInit() {
      backlogAddTaskBtn = document.querySelector("#backlog-addtask-btn");
      readyAddTaskBtn = document.querySelector("#ready-addtask-btn");
      inProgAddTaskBtn = document.querySelector("#inprogress-addtask-btn");
      finishedAddTaskBtn = document.querySelector("#finished-addtask-btn");
      backlog = document.querySelector(".app-backlog");
      ready = document.querySelector(".app-ready");
      inprogress = document.querySelector(".app-inprogress");
      finished = document.querySelector(".app-finished");
      tasksColumns = [backlog, ready, inprogress, finished];
       EventListener(tasksColumns, handlerOnDrop, "drop");
    }
   
    function handlerOnDrop() {
      setTimeout(() => {
        displayTasks(tasksColumns, appState.currentUser.login, handlerTaskEdit); 
        updBtnStatus(tasksColumns);
      }, 100);
    }
    function closePopupUserMenu() {
      popupBg.classList.add("invisible");
      popup.classList.add("invisible");
      userMenuClose.classList.remove("invisible");
      userMenuOpen.classList.add("invisible");
    }
    function handlerAvatar() {
      userMenuClose.classList.toggle("invisible");
      userMenuOpen.classList.toggle("invisible");
      popupBg.classList.toggle("invisible");
      popup.classList.toggle("invisible");
    }
    function handlerMyTasks() {
      closePopupUserMenu();
      content.innerHTML = fieldHTMLContent; 
      tasksFieldInit(); 
      backlogAddTaskBtn.addEventListener("click", handlerAddTask);
      readyAddTaskBtn.addEventListener("click", handlerMoveTask); 
      inProgAddTaskBtn.addEventListener("click", handlerMoveTask); 
      finishedAddTaskBtn.addEventListener("click", handlerMoveTask); 
      displayTasks(tasksColumns, currentUser, handlerTaskEdit); 
      updBtnStatus(tasksColumns); 
    }
    function handlerAddUser() {
      closePopupUserMenu();
      modalWindowAddUser.show();
    }
    function handlerDeleteUser() {
      applyBtnFlag = "DeleteUser"; 

      handlerMyTasks(); 
      taskEditOkBtn.classList.remove("invisible");
      taskAddOkBtn.classList.add("invisible"); 
      inputTask.classList.add("invisible"); 
      inputTaskLabel.classList.add("invisible"); 
      inputUserForm.classList.remove("invisible"); 
      modalWindowLabel.innerHTML = "Delete user"; 
      inputUserLabel.innerHTML = "Select a user"; 

      closePopupUserMenu();

      updUserList(); 
      const users = getFromStorage("users");
      if (!users.length) {
        alertMessage.innerHTML = "There are no users to delete";
        modalAlert.show();
        return;
      }
      modalWindow.show();
    }

    function handlerLogout() {
      content.innerHTML =
        '<h2 class="app-auth-message">Please Sign In to see your tasks!</h2>';
      appState.currentUser = null;
      taskAddOkBtn.removeEventListener("click", handlerTaskOkBtn);
      taskEditOkBtn.removeEventListener("click", handlerTaskEditOkBtn);
      changeOwnerBtn.removeEventListener("click", handlerChangeOwnerBtn);
      deleteTaskBtn.removeEventListener("click", handlerDeleteTaskBtn);
      popupBg.removeEventListener("click", handlerAvatar);
      myTasks.removeEventListener("click", handlerMyTasks);
      addUser.removeEventListener("click", handlerAddUser);
      deleteUser.removeEventListener("click", handlerDeleteUser);
      logout.removeEventListener("click", handlerLogout);
      taskInputAddUserBtn.removeEventListener("click", handlerAddUserOkBtn);
      taskId = ""; 
      applyBtnFlag = "TaskEdit"; 
      popupBg.classList.add("invisible"); 
      popup.classList.add("invisible"); 
      return startApp();
    }
    function handlerAddTask() {
      if (currentUser == "admin") {
        inputUserForm.classList.remove("invisible");
      } else {
        inputUserForm.classList.add("invisible");
      }
      modalWindow.show();
    }
    function handlerMoveTask(e) {
      const locationList = ["backlog", "ready", "inprogress", "finished"];
      applyBtnFlag = "MoveTask";
      inputTaskLabel.classList.add("invisible"); 
      inputTask.classList.add("invisible");
      taskAddOkBtn.classList.add("invisible");
      taskEditOkBtn.classList.remove("invisible"); 
      modalWindowLabel.innerHTML = "Move task to next stage"; 
      inputUserLabel.innerHTML = "Select a task";
      for (const location of locationList) {
        if (e.target.id.match(location)) {
          updTasksList(location);
          break;
        }
      }
      inputUserForm.classList.remove("invisible"); 
      modalWindow.show();
    }
    function handlerTaskOkBtn() {
      if (!inputTask.value) return; 
      if (currentUser == "admin") {
        const task = new Task(inputTask.value, inputUser.value);
        Task.save(task);
      } else {
        const task = new Task(inputTask.value, login);
        Task.save(task);
      }
      displayTasks(tasksColumns, login, handlerTaskEdit);
      updBtnStatus(tasksColumns);
      modalWindow.hide();
    }
    function handlerTaskEditOkBtn() {
      if (applyBtnFlag == "TaskEdit") {
        editInStorage("tasks", taskId, "name", inputTask.value);
      } else if (applyBtnFlag == "MoveTask") {
        moveToNextStage(inputUser.value);
      } else if (applyBtnFlag == "ChangeOwner") {
        editInStorage("tasks", taskId, "own", inputUser.value);
      } else if (applyBtnFlag == "DeleteUser") {
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
      modalWindow.hide(); 

      handlerDefault();

      displayTasks(tasksColumns, currentUser, handlerTaskEdit);
      updBtnStatus(tasksColumns);
    }
    function handlerTaskEdit(e) {
      applyBtnFlag = "TaskEdit"; 
      taskId = e.target.id; 
      taskName = this.innerHTML; 
      inputTask.value = taskName; 
      inputUserForm.classList.add("invisible");
      taskEditOkBtn.classList.remove("invisible"); 
      taskAddOkBtn.classList.add("invisible"); 
      if (currentUser == "admin") {
        changeOwnerBtn.classList.remove("invisible");
        deleteTaskBtn.classList.remove("invisible");
      }

      modalWindow.show();
    }
   
    function handlerChangeOwnerBtn() {
      const users = getFromStorage("users");
      if (users.length < 2) {
        alertMessage.innerHTML = "Add more users first";
        modalAlert.show();
        return;
      }
      applyBtnFlag = "ChangeOwner";

      updUserList();
      modalWindowLabel.innerHTML = `Change the owner of ${taskName}`;
      inputTaskLabel.classList.add("invisible");
      inputTask.classList.add("invisible");
      inputUserForm.classList.remove("invisible");
      inputUserLabel.innerHTML = "Select a new owner";
      changeOwnerBtn.classList.add("invisible");
      deleteTaskBtn.classList.add("invisible");
    }
    function handlerDeleteTaskBtn() {
      deleteFromStorage("tasks", taskId);
      displayTasks(tasksColumns, currentUser, handlerTaskEdit);
      updBtnStatus(tasksColumns);
      modalWindow.hide(); 

      deleteTaskBtn.classList.add("invisible"); 
      taskEditOkBtn.classList.add("invisible"); 
      taskAddOkBtn.classList.remove("invisible");
    }
   
    function handlerAddUserOkBtn() {
      handlerMyTasks();
      const login = inputLogin.value,
        pass1 = inputPass1.value,
        pass2 = inputPass2.value;
      if (!login || !pass1 || !pass2) {
        alertMessage.innerHTML = "All fields are required";
        modalAlert.show();
        return;
      }
      if (login.match(/admin/gi)) {
        alertMessage.innerHTML = "This name cannot be used";
        modalAlert.show();
        return;
      }
      else if (isTheLoginFree(login)) {
        if (pass1 == pass2) {
          addNewUser(User, login, pass1);
        } else {
          alertMessage.innerHTML = "Password not confirmed";
          modalAlert.show();
          return;
        }
      }

      else {
        alertMessage.innerHTML = "That login already exists";
        modalAlert.show();
        return;
      }
     
      updBtnStatus(tasksColumns); 

      modalWindowAddUser.hide(); 
    }

  }

}

function handlerDefault() {
  inputTaskLabel.classList.remove("invisible"); 
  changeOwnerBtn.classList.add("invisible"); 
  deleteTaskBtn.classList.add("invisible"); 
  taskEditOkBtn.classList.add("invisible"); 
  inputUserForm.classList.add("invisible"); 
  modalWindowLabel.innerHTML = "Input task name";
  inputUserLabel.innerHTML = "Select a user"; 
  taskAddOkBtn.classList.remove("invisible"); 
  inputTask.classList.remove("invisible"); 
  taskId = ""; 
  taskName = ""; 
}

