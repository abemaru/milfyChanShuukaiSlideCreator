import { fabric } from 'fabric';

declare module 'fabric' {
  namespace fabric {
    interface IObjectOptions {
      id?: string;
    }

    interface Object {
      id?: string;
    }
  }
}
