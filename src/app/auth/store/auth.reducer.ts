import { User } from '../user.model';
import * as AuthActions from './auth.actions';
import * as angFire from 'firebase';

export interface State {
  user: angFire.User;
  authError: string;
  loading: boolean;
}

const initialState: State = {
  user: null,
  authError: null,
  loading: false,
};

export function authReducer(
  state = initialState,
  action: AuthActions.AuthActions
) {
  switch (action.type) {
    case AuthActions.AUTHENTICATE_SUCCESS:
      return {
        ...state,
        authError: null,
        user: action.payload.user, //override new user property
        loading: false,
      };
    case AuthActions.LOGOUT:
      return {
        ...state,
        user: null, //clear it
      };
    case (AuthActions.LOGIN_START, AuthActions.SIGNUP_START): //can group different cases together
      return {
        ...state,
        authError: null, //error message; clear
        loading: true,
      };
    case AuthActions.AUTHENTICATE_FAIL:
      return {
        ...state,
        user: null, //there should be no user cuz they are not logged in
        authError: action.payload, //error message -> firebase error
        loading: false,
      };
      return;
    case AuthActions.CLEAR_ERROR:
      return {
        ...state,
        authError: null,
      };
    default:
      return state;
  }
}
