import { Context } from 'grammy';
import type { HydrateFlavor } from '@grammyjs/hydrate';
import type { User } from './user.js';

export type MyContext = HydrateFlavor<Context> & {
  update: Context['update'];
  user?: User;
  isNewUser?: boolean;
};
