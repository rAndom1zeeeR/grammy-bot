import { Context } from 'grammy';
import type { HydrateFlavor } from '@grammyjs/hydrate';

interface User {
  id: number;
  username: string | undefined;
  first_name: string | undefined;
  last_name: string | undefined;
}

export type MyContext = HydrateFlavor<Context> & {
  update: Context['update'];
  user?: User;
};
