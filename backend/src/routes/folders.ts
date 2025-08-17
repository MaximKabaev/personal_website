import { Router } from 'express';
import { query, queryOne, Folder } from '../config/database';
import { protectRoute } from '../middleware/auth';

const router = Router();

// Get all folders with hierarchy
router.get('/', async (req, res) => {
  try {
    const { parent_id } = req.query;
    
    let queryText = 'SELECT * FROM folders';
    const params: any[] = [];
    
    if (parent_id === 'null') {
      queryText += ' WHERE parent_id IS NULL';
    } else if (parent_id) {
      queryText += ' WHERE parent_id = $1';
      params.push(parent_id);
    }
    
    queryText += ' ORDER BY display_order ASC, name ASC';
    
    const folders = await query<Folder>(queryText, params);
    res.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Get folder tree (nested structure)
router.get('/tree', async (req, res) => {
  try {
    const folders = await query<Folder>(
      'SELECT * FROM folders ORDER BY display_order ASC, name ASC'
    );
    
    // Build tree structure
    const buildTree = (parentId: string | null = null): any[] => {
      return folders
        .filter(f => f.parent_id === parentId)
        .map(folder => ({
          ...folder,
          children: buildTree(folder.id)
        }));
    };
    
    const tree = buildTree(null);
    res.json(tree);
  } catch (error) {
    console.error('Error fetching folder tree:', error);
    res.status(500).json({ error: 'Failed to fetch folder tree' });
  }
});

// Get single folder
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Check if identifier is a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    let queryText: string;
    let params: any[];
    
    if (isUUID) {
      queryText = 'SELECT * FROM folders WHERE id = $1';
      params = [identifier];
    } else {
      queryText = 'SELECT * FROM folders WHERE slug = $1';
      params = [identifier];
    }
    
    const folder = await queryOne<Folder>(queryText, params);
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    res.json(folder);
  } catch (error) {
    console.error('Error fetching folder:', error);
    res.status(500).json({ error: 'Failed to fetch folder' });
  }
});

// Create new folder (protected)
router.post('/', protectRoute, async (req, res) => {
  try {
    const { name, slug, parent_id, display_order } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({ error: 'name and slug are required' });
    }
    
    const folder = await queryOne<Folder>(
      `INSERT INTO folders (name, slug, parent_id, display_order)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, slug, parent_id || null, display_order || 0]
    );
    
    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Update folder (protected)
router.put('/:id', protectRoute, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Build dynamic UPDATE query
    const updateFields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at');
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [id, ...updateFields.map(field => updates[field])];
    
    const folder = await queryOne<Folder>(
      `UPDATE folders SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    res.json(folder);
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

// Delete folder (protected)
router.delete('/:id', protectRoute, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await queryOne(
      'DELETE FROM folders WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (!result) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

export default router;