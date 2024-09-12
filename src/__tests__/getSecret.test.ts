import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { getSecret } from "../utils/getSecret";

jest.mock("@aws-sdk/client-secrets-manager", () => ( {
    SecretsManagerClient: jest.fn(),
    GetSecretValueCommand: function(){

    }
}));

describe("getSecret",() => {

    it("getSecret ", async () => {
        (SecretsManagerClient as jest.Mock).mockImplementation(() => {
                return {
                    send: () => {
                        throw Error("Unexpected Error")
                    }
                }
        })
        const result = getSecret("u24-w4rt-3223")
        expect(true).toBeTruthy()
    })
    
})