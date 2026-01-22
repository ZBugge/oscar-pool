import bcrypt from 'bcryptjs';
import { runQuery, runInsert, type Admin } from '../db/schema.js';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAdmin(username: string, password: string): Promise<Admin> {
  const hashedPassword = bcrypt.hashSync(password, 10);

  const id = await runInsert(
    'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
    [username, hashedPassword]
  );

  const admin = (await getAdminById(id))!;
  return admin;
}

export async function getAdminByUsername(username: string): Promise<Admin | undefined> {
  const results = await runQuery<Admin>('SELECT * FROM admins WHERE username = ?', [username]);
  return results[0];
}

export async function getAdminById(id: number): Promise<Admin | undefined> {
  const results = await runQuery<Admin>('SELECT * FROM admins WHERE id = ?', [id]);
  return results[0];
}

export async function authenticateAdmin(username: string, password: string): Promise<Admin | null> {
  const admin = await getAdminByUsername(username);

  if (!admin) {
    return null;
  }

  const isValid = await verifyPassword(password, admin.password_hash);

  return isValid ? admin : null;
}
