

export default class File {


    constructor(buffer: Buffer, name: string, type: string, path: string) {
        this.buffer = buffer
        this.name = name
        this.type = type
        this.path = path
    }

    private buffer: Buffer
    private name: string
    private type: string
    private path: string

    public getBuffer(): Buffer {
        return this.buffer
    }

    public setBuffer(buffer: Buffer): void {
        this.buffer = buffer
    }

    public getName(): string {
        return this.name
    }

    public setName(name: string): void {
        this.name = name
    }

    public getType(): string {
        return this.type
    }

    public setType(type: string): void {
        this.type = type
    }

    public getPath(): string {
        return this.path
    }

    public setPath(path: string): void {
        this.path = path
    }



}
