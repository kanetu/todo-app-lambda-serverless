import { sendBulkNotificationsService, sendSingleNotificationService } from "../utils/firebase";

import * as firebaseAdmin from "firebase-admin"
jest.mock("../../todo-serverless-firebase-sa.json", () => ({ jane: "kane" }), { virtual: true });


jest.mock("firebase-admin", () => ({
    credential: {
        cert: jest.fn()
    },
    messaging: jest.fn(),
    initializeApp: jest.fn()
}));

describe("firebase", () => {

    it("send single notification successfully", async () => {
        (firebaseAdmin.messaging as jest.Mock).mockImplementation(() => ({
            send: () => ({
                id: "sample id"
            })
        }))
        const result = await sendSingleNotificationService("t0k3n", {
            title: "Sample title",
            body: "Sample body"
        })
        expect(result).toEqual({ response: { id: 'sample id' }, success: true })
        expect(firebaseAdmin.messaging).toHaveBeenCalled();
    })

    it("send single notification unsuccessfully", async () => {
        (firebaseAdmin.messaging as jest.Mock).mockImplementation(() => ({
            send: () => {
                throw Error("Unexpected Error")
            }
        }))

        try {
            await sendSingleNotificationService("t0k3n", {
                title: "Sample title",
                body: "Sample body"
            })
        } catch (error) {
            expect((error as Error).name).toBe("Error")
            expect((error as Error).message).toBe("Unexpected Error")
        }

    })


    it("send bulk notifications successfully", async () => {
        (firebaseAdmin.messaging as jest.Mock).mockImplementation(() => ({
            sendMulticast: () => ({
                id: "sample id"
            })
        }))
        const result = await sendBulkNotificationsService({
            title: "Sample title",
            body: "Sample body"
        }, ["t0k3n"])
        expect(result).toEqual({ response: { id: 'sample id' }, success: true })
        expect(firebaseAdmin.messaging).toHaveBeenCalled();
    })

    it("send bulk notifications unsuccessfully", async () => {
        (firebaseAdmin.messaging as jest.Mock).mockImplementation(() => ({
            sendMulticast: () => {
                throw Error("Unexpected Error")
            }
        }))

        try {
            await sendBulkNotificationsService({
                title: "Sample title",
                body: "Sample body"
            }, ["t0k3n"])
        } catch (error) {
            expect((error as Error).name).toBe("Error")
            expect((error as Error).message).toBe("Unexpected Error")
        }

    })
})