import { runQuery, runInsert, runExec, type Category, type Nominee } from '../db/schema.js';

// Category CRUD operations

export async function getAllCategories(): Promise<Category[]> {
  return runQuery<Category>('SELECT * FROM categories ORDER BY display_order ASC, id ASC');
}

export async function getCategoryById(id: number): Promise<Category | undefined> {
  const results = await runQuery<Category>('SELECT * FROM categories WHERE id = ?', [id]);
  return results[0];
}

export async function createCategory(name: string): Promise<Category> {
  // Get the next display order
  const maxOrder = await runQuery<{ max_order: number | null }>(
    'SELECT MAX(display_order) as max_order FROM categories'
  );
  const displayOrder = (maxOrder[0].max_order ?? -1) + 1;

  const id = await runInsert(
    'INSERT INTO categories (name, display_order) VALUES (?, ?)',
    [name, displayOrder]
  );

  return (await getCategoryById(id))!;
}

export async function updateCategory(id: number, name: string, displayOrder?: number): Promise<Category | undefined> {
  if (displayOrder !== undefined) {
    await runExec(
      'UPDATE categories SET name = ?, display_order = ? WHERE id = ?',
      [name, displayOrder, id]
    );
  } else {
    await runExec(
      'UPDATE categories SET name = ? WHERE id = ?',
      [name, id]
    );
  }
  return getCategoryById(id);
}

export async function deleteCategory(id: number): Promise<void> {
  // Delete all nominees in this category first
  await runExec('DELETE FROM nominees WHERE category_id = ?', [id]);
  // Delete predictions for this category
  await runExec('DELETE FROM predictions WHERE category_id = ?', [id]);
  // Delete the category
  await runExec('DELETE FROM categories WHERE id = ?', [id]);
}

export async function reorderCategories(orderedIds: number[]): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    await runExec(
      'UPDATE categories SET display_order = ? WHERE id = ?',
      [i, orderedIds[i]]
    );
  }
}

// Nominee CRUD operations

export async function getNomineesByCategory(categoryId: number): Promise<Nominee[]> {
  return runQuery<Nominee>('SELECT * FROM nominees WHERE category_id = ? ORDER BY id ASC', [categoryId]);
}

export async function getNomineeById(id: number): Promise<Nominee | undefined> {
  const results = await runQuery<Nominee>('SELECT * FROM nominees WHERE id = ?', [id]);
  return results[0];
}

export async function addNominee(categoryId: number, name: string): Promise<Nominee> {
  const id = await runInsert(
    'INSERT INTO nominees (category_id, name) VALUES (?, ?)',
    [categoryId, name]
  );
  return (await getNomineeById(id))!;
}

export async function deleteNominee(nomineeId: number): Promise<void> {
  // Delete predictions for this nominee first
  await runExec('DELETE FROM predictions WHERE nominee_id = ?', [nomineeId]);
  // Delete the nominee
  await runExec('DELETE FROM nominees WHERE id = ?', [nomineeId]);
}

// Winner management

export async function setWinner(categoryId: number, nomineeId: number): Promise<void> {
  // First clear any existing winner in this category
  await runExec(
    'UPDATE nominees SET is_winner = 0 WHERE category_id = ?',
    [categoryId]
  );
  // Then set the new winner
  await runExec(
    'UPDATE nominees SET is_winner = 1 WHERE id = ? AND category_id = ?',
    [nomineeId, categoryId]
  );
}

export async function clearWinner(categoryId: number): Promise<void> {
  await runExec(
    'UPDATE nominees SET is_winner = 0 WHERE category_id = ?',
    [categoryId]
  );
}

export async function getWinnerByCategory(categoryId: number): Promise<Nominee | undefined> {
  const results = await runQuery<Nominee>(
    'SELECT * FROM nominees WHERE category_id = ? AND is_winner = 1',
    [categoryId]
  );
  return results[0];
}

// Combined queries for efficiency

export interface CategoryWithNominees extends Category {
  nominees: Nominee[];
  winner_id: number | null;
}

export async function getCategoriesWithNominees(): Promise<CategoryWithNominees[]> {
  const categories = await getAllCategories();
  const result: CategoryWithNominees[] = [];

  for (const category of categories) {
    const nominees = await getNomineesByCategory(category.id);
    const winner = nominees.find(n => n.is_winner === 1);
    result.push({
      ...category,
      nominees,
      winner_id: winner?.id ?? null,
    });
  }

  return result;
}
