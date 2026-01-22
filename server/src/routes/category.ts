import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getCategoriesWithNominees,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  addNominee,
  deleteNominee,
  getNomineeById,
  setWinner,
  clearWinner,
  bulkImportCategories,
  type BulkImportItem,
} from '../services/category.js';

const router = express.Router();

// Get all categories with nominees (auth required to manage)
router.get('/', requireAuth, async (_req, res) => {
  try {
    const categories = await getCategoriesWithNominees();
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Create a new category
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category = await createCategory(name.trim());
    res.json(category);
  } catch (error: any) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category name/order
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, displayOrder } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category = await updateCategory(id, name.trim(), displayOrder);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Reorder categories
router.post('/reorder', requireAuth, async (req, res) => {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds must be an array' });
    }

    await reorderCategories(orderedIds);
    const categories = await getCategoriesWithNominees();
    res.json(categories);
  } catch (error) {
    console.error('Reorder categories error:', error);
    res.status(500).json({ error: 'Failed to reorder categories' });
  }
});

// Delete category
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const category = await getCategoryById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await deleteCategory(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Add nominee to category
router.post('/:id/nominees', requireAuth, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nominee name is required' });
    }

    const category = await getCategoryById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const nominee = await addNominee(categoryId, name.trim());
    res.json(nominee);
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Nominee already exists in this category' });
    }
    console.error('Add nominee error:', error);
    res.status(500).json({ error: 'Failed to add nominee' });
  }
});

// Remove nominee from category
router.delete('/:categoryId/nominees/:nomineeId', requireAuth, async (req, res) => {
  try {
    const nomineeId = parseInt(req.params.nomineeId);

    const nominee = await getNomineeById(nomineeId);
    if (!nominee) {
      return res.status(404).json({ error: 'Nominee not found' });
    }

    await deleteNominee(nomineeId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete nominee error:', error);
    res.status(500).json({ error: 'Failed to delete nominee' });
  }
});

// Set winner for category
router.post('/:categoryId/nominees/:nomineeId/winner', requireAuth, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const nomineeId = parseInt(req.params.nomineeId);

    const nominee = await getNomineeById(nomineeId);
    if (!nominee || nominee.category_id !== categoryId) {
      return res.status(404).json({ error: 'Nominee not found in this category' });
    }

    await setWinner(categoryId, nomineeId);
    res.json({ success: true });
  } catch (error) {
    console.error('Set winner error:', error);
    res.status(500).json({ error: 'Failed to set winner' });
  }
});

// Clear winner for category
router.delete('/:categoryId/winner', requireAuth, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);

    const category = await getCategoryById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await clearWinner(categoryId);
    res.json({ success: true });
  } catch (error) {
    console.error('Clear winner error:', error);
    res.status(500).json({ error: 'Failed to clear winner' });
  }
});

// Bulk import categories and nominees from JSON
router.post('/bulk-import', requireAuth, async (req, res) => {
  try {
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: 'categories must be an array' });
    }

    // Validate format
    for (let i = 0; i < categories.length; i++) {
      const item = categories[i];
      if (!item.name || typeof item.name !== 'string' || !item.name.trim()) {
        return res.status(400).json({ error: `Item ${i}: name is required and must be a string` });
      }
      if (!Array.isArray(item.nominees)) {
        return res.status(400).json({ error: `Item ${i}: nominees must be an array` });
      }
      for (let j = 0; j < item.nominees.length; j++) {
        if (typeof item.nominees[j] !== 'string' || !item.nominees[j].trim()) {
          return res.status(400).json({ error: `Item ${i}, nominee ${j}: must be a non-empty string` });
        }
      }
    }

    const items: BulkImportItem[] = categories.map(c => ({
      name: c.name.trim(),
      nominees: c.nominees.map((n: string) => n.trim()),
    }));

    const result = await bulkImportCategories(items);
    res.json(result);
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: 'Failed to import categories' });
  }
});

export default router;
