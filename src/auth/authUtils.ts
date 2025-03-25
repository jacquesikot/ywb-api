import { Tokens } from 'app-request';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { tokenInfo } from '../config';
import { AuthFailureError, InternalError } from '../core/ApiError';
import JWT, { JwtPayload } from '../core/JWT';
import { KeystoreModel } from '../database/model/Keystore';
import User from '../database/model/User';

export const getAccessToken = (authorization?: string) => {
  if (!authorization) throw new AuthFailureError('Invalid Authorization');
  if (!authorization.startsWith('Bearer '))
    throw new AuthFailureError('Invalid Authorization');
  return authorization.split(' ')[1];
};

export const validateTokenData = (payload: JwtPayload): boolean => {
  if (
    !payload ||
    !payload.iss ||
    !payload.sub ||
    !payload.aud ||
    !payload.prm ||
    payload.iss !== tokenInfo.issuer ||
    payload.aud !== tokenInfo.audience ||
    !Types.ObjectId.isValid(payload.sub)
  )
    throw new AuthFailureError('Invalid Access Token');
  return true;
};

export const createTokens = async (
  user: User,
  accessTokenKey: string,
  refreshTokenKey: string,
): Promise<Tokens> => {
  const accessToken = await JWT.encode(
    new JwtPayload(
      tokenInfo.issuer,
      tokenInfo.audience,
      user._id.toString(),
      accessTokenKey,
      tokenInfo.accessTokenValidity,
    ),
  );
  if (!accessToken) throw new InternalError();
  const refreshToken = await JWT.encode(
    new JwtPayload(
      tokenInfo.issuer,
      tokenInfo.audience,
      user._id.toString(),
      refreshTokenKey,
      tokenInfo.refreshTokenValidity,
    ),
  );

  if (!refreshToken) throw new InternalError();

  return {
    accessToken: accessToken,
    refreshToken: refreshToken,
  } as Tokens;
};

export const generateEmailVerificationToken = async (
  userId: Types.ObjectId,
) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date();
  expires.setHours(expires.getHours() + 6); // Token expires in 6 hours

  await KeystoreModel.updateOne(
    { client: userId },
    {
      emailVerificationToken: token,
      emailVerificationTokenExpires: expires,
    },
  );

  return token;
};

export const verifyEmailVerificationToken = async (token: string) => {
  const keystore = await KeystoreModel.findOne({
    emailVerificationToken: token,
    emailVerificationTokenExpires: { $gt: new Date() },
  });

  if (!keystore) {
    throw new Error('Invalid or expired email verification token');
  }

  // Token is valid, you can proceed with email verification
  keystore.emailVerificationToken = undefined;
  keystore.emailVerificationTokenExpires = undefined;
  await keystore.save();

  return {
    isTokenVerified: true,
    userId: keystore.client._id,
  };
};
