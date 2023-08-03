import { appState } from "../app";
import { Admin } from "../models/Admin";
import { User } from "../models/User";

export const authUser = function (login, password) {
  const user = new User(login, password);
  const admin = new Admin(login, password);

  if (user.hasAccess) {
    appState.currentUser = user;
    return true;
  } else if (admin.hasAccess) {
    appState.currentUser = admin;
    return true;
  } else return false;
};
