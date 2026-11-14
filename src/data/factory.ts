import type { BrickConfig } from '../config';
import type { DataClient } from './DataClient';
import { creerMemoryClient } from './memoryClient';
import { creerFlaskClient } from './flaskClient';

export function creerDataClient(config: BrickConfig): DataClient {
  switch (config.sourceDonnees) {
    case 'memory':
      return creerMemoryClient();
    case 'flask':
      return creerFlaskClient();
  }
}
