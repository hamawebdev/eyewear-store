import * as migration_20260815_205953_initial from './20260815_205953_initial';
import * as migration_20260821_173935_category_labels from './20260821_173935_category_labels';
import * as migration_20260831_230000_media_image_sizes from './20260831_230000_media_image_sizes';

export const migrations = [
  {
    up: migration_20260815_205953_initial.up,
    down: migration_20260815_205953_initial.down,
    name: '20260815_205953_initial'
  },
  {
    up: migration_20260821_173935_category_labels.up,
    down: migration_20260821_173935_category_labels.down,
    name: '20260821_173935_category_labels'
  },
  {
    up: migration_20260831_230000_media_image_sizes.up,
    down: migration_20260831_230000_media_image_sizes.down,
    name: '20260831_230000_media_image_sizes'
  },
];
