import User from '../../database/model/User';
import _ from 'lodash';

export const enum AccessMode {
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
}

export async function getUserData(user: User) {
  const fields = [
    '_id',
    'name',
    'role',
    'email',
    'profilePicUrl',
    'businessType',
    'bio',
  ];

  const data = _.pick(user, fields);
  return data;
}
