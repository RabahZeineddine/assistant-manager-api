import clone from 'clone'

export class Helper {

    static clone(any) {
        try {
            return clone(any)
        } catch (error) {
            return any
        }
    }
}