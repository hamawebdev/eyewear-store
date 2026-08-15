import * as migration_20260815_205953_initial from './20260815_205953_initial';

export const migrations = [
  {
    up: migration_20260815_205953_initial.up,
    down: migration_20260815_205953_initial.down,
    name: '20260815_205953_initial'
  },
];
