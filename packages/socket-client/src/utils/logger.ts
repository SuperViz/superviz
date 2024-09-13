import debug from 'debug';

export type Message = string | Error | number | Object;

export class Logger {
  private debug: debug.Debugger;

  constructor(scope: string) {
    this.debug = debug(scope);
    debug.enable('*');
  }

  log(formatter: Message, ...args: Array<Message>) {
    this.debug(formatter, ...args);
  }
}
