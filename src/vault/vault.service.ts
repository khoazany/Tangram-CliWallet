import { Injectable } from '@nestjs/common';

@Injectable()
export class Vault {
  root(): string {
    return 'Hello World!';
  }
}