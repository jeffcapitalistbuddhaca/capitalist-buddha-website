import * as admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS || '{}');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://conscious-business-course.firebaseio.com',
});

const db = admin.firestore();

export async function getFirebaseUser(email: string, password?: string) {
  const enrollmentsRef = db.collection('enrollments');
  const query = enrollmentsRef.where('email', '==', email);
  const snapshot = await query.get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const user = doc.data();

  if (password && user.password !== password) {
    return null;
  }

  return {
    email: user.email,
    expirationDate: user.expirationDate,
  };
}

export async function createFirebaseEnrollment(enrollment: any) {
  const enrollmentsRef = db.collection('enrollments');
  const newDoc = await enrollmentsRef.add({
    email: enrollment.email,
    password: enrollment.password,
    enrollmentDate: enrollment.enrollmentDate,
    expirationDate: enrollment.expirationDate,
    paymentIntentId: enrollment.paymentIntentId,
  });

  return { id: newDoc.id, ...enrollment };
}

export async function sendConfirmationEmail(email: string, password: string, expirationDate: Date) {
  const emailContent = `Welcome to your new course!

Your login credentials:
Email: ${email}
Password: ${password}

Your access expires on: ${expirationDate.toLocaleDateString()}

We will confirm the date/time of our weekly live sessions as we get closer to the start date.

Login at: https://capitalistbuddha.ca`;

  return fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { email: 'noreply@capitalistbuddha.ca', name: 'Capitalist Buddha' },
      to: [{ email }],
      subject: 'Your Capitalist Buddha Course Access',
      textContent: emailContent,
    }),
  });
}
