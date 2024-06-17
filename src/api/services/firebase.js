
import admin from 'firebase-admin';
import { serviceAccount } from '../../utils/ips-medigroup.js';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
