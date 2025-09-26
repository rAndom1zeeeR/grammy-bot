import { Context } from 'grammy';
import type { HydrateFlavor } from '@grammyjs/hydrate';

export type MyContext = HydrateFlavor<Context> & {
  update: Context['update'];
};
