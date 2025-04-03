import User from '../../database/model/User';
import _ from 'lodash';

export const enum AccessMode {
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
}

export async function getUserData(user: User) {
  const fields = ['_id', 'name', 'role', 'profilePicUrl'];

  // Include username if it exists
  if (user.username) fields.push('username');

  const data = _.pick(user, fields);
  return data;
}
