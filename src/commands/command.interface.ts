export interface IReceiver {
    execute(context: any, args: any, callback: any): void;
}

export interface ICommand extends IReceiver {
    register(vorpal: any): void;
    execute(context: any, args: any, callback: any): void;
}

export abstract class Command implements ICommand {
    private receiver_: IReceiver;

    constructor(receiver: IReceiver){
        this.receiver_ = receiver;
    }
    
    public register(vorpal: any): void {
        throw new Error("Method not implemented.");
    }

    public execute(context: any, args: any, callback: any): void {
        this.receiver_.execute(context, args, callback);
    }
}

