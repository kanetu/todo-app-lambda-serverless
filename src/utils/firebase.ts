import firebaseAdmin from "firebase-admin"
import serviceAccount from '../../todo-serverless-firebase-sa.json';

firebaseAdmin.initializeApp({ credential: firebaseAdmin.credential.cert(serviceAccount as unknown as string) });

type Content = {
  title: string;
  body: string;
}

const sendSingleNotificationService = async (token: string, content: Content) => {
  const message = {
    notification: {
      title: content.title,
      body: content.body,
    },
    token: token
  };

  try {

    const response = await firebaseAdmin.messaging().send(message);
    return { response: response, success: true }
  } catch (error) {

    console.log(error);
    return { error: error, success: false }
  }
}


const sendBulkNotificationsService = async (content: Content, keys: string[]) => {
  const message = {
    notification: {
      title: content.title,
      body: content.body,
    },
    tokens: keys
  };

  try {
    const response = await firebaseAdmin.messaging().sendMulticast(message);
    return { response: response, success: true }
  } catch (error) {
    console.log(error);
    return { error: error, success: false }
  }
}

export {
  sendSingleNotificationService,
  sendBulkNotificationsService
}