import AssistantV1 from 'ibm-watson/assistant/v1'
import { IamAuthenticator } from 'ibm-watson/auth'


export default function Assistant(CREDENTIALS: any): AssistantV1 {
    return new AssistantV1({
        version: CREDENTIALS.VERSION,
        authenticator: new IamAuthenticator({
            apikey: CREDENTIALS.APIKEY
        }),
        serviceUrl: CREDENTIALS.URL,
    })
}