import dotenv from 'dotenv';
dotenv.config();
import { sendFineEmail } from './utils/mailer.js';

const student = { name: 'Test Student', email: 'test@example.com' };
const fine = { department: 'library', amount: 123, reason: 'Test reason', status: 'unpaid' };

(async () => {
  try {
    await sendFineEmail(student, fine);
    console.log('sendFineEmail invoked');
  } catch (err) {
    console.error('Error in test script:', err);
    process.exit(1);
  }
  process.exit(0);
})();
