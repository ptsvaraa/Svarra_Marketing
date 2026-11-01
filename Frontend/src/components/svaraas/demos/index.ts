import type { ComponentType } from 'react';
import type { SvaraaId } from '../../../data/svaraas';
import type { DemoProps } from '../demo-kit';
import { RecallDemo } from './RecallDemo';
import { ReciteDemo } from './ReciteDemo';
import { RemindDemo } from './RemindDemo';
import { RepositoryDemo } from './RepositoryDemo';
import { RescueDemo } from './RescueDemo';
import { RespondDemo } from './RespondDemo';
import { RiddleDemo } from './RiddleDemo';

export const DEMOS: Record<SvaraaId, ComponentType<DemoProps>> = {
  recite: ReciteDemo,
  respond: RespondDemo,
  remind: RemindDemo,
  rescue: RescueDemo,
  recall: RecallDemo,
  repository: RepositoryDemo,
  riddle: RiddleDemo,
};
