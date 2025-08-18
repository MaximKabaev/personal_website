import { Router } from 'express';
import { query, queryOne, DevlogEntry } from '../config/database';
import { protectRoute } from '../middleware/auth';

const router = Router();

// Get all devlog entries (with optional filtering)
router.get('/', async (req, res) => {
  try {
    const { project_id, entry_type, limit = 10, offset = 0 } = req.query;
    
    let queryText = `
      SELECT de.*, 
             p.id as project_id, p.name as project_name, p.slug as project_slug
      FROM devlog_entries de
      LEFT JOIN projects p ON de.project_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (project_id) {
      queryText += ` AND de.project_id = $${paramIndex++}`;
      params.push(project_id);
    }
    
    if (entry_type) {
      queryText += ` AND de.entry_type = $${paramIndex++}`;
      params.push(entry_type);
    }
    
    queryText += ` ORDER BY de.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(Number(limit), Number(offset));
    
    const entries = await query(queryText, params);
    
    // Format the response to include project as nested object
    const formattedEntries = entries.map(entry => ({
      id: entry.id,
      project_id: entry.project_id,
      title: entry.title,
      content: entry.content,
      entry_type: entry.entry_type,
      tags: entry.tags,
      images: entry.images || [],
      created_at: entry.created_at,
      updated_at: entry.updated_at,
      project: entry.project_name ? {
        id: entry.project_id,
        name: entry.project_name,
        slug: entry.project_slug
      } : null
    }));
    
    res.json(formattedEntries);
  } catch (error) {
    console.error('Error fetching devlog entries:', error);
    res.status(500).json({ error: 'Failed to fetch devlog entries' });
  }
});

// Get recent entries across all projects
router.get('/recent', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const entries = await query(
      `SELECT de.*, 
              p.id as project_id, p.name as project_name, p.slug as project_slug, p.folder_id
       FROM devlog_entries de
       LEFT JOIN projects p ON de.project_id = p.id
       ORDER BY de.created_at DESC
       LIMIT $1`,
      [Number(limit)]
    );
    
    // Format the response
    const formattedEntries = entries.map(entry => ({
      id: entry.id,
      project_id: entry.project_id,
      title: entry.title,
      content: entry.content,
      entry_type: entry.entry_type,
      tags: entry.tags,
      images: entry.images || [],
      created_at: entry.created_at,
      updated_at: entry.updated_at,
      project: {
        id: entry.project_id,
        name: entry.project_name,
        slug: entry.project_slug,
        folder_id: entry.folder_id
      }
    }));
    
    res.json(formattedEntries);
  } catch (error) {
    console.error('Error fetching recent entries:', error);
    res.status(500).json({ error: 'Failed to fetch recent entries' });
  }
});

// Get entries for a specific project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    const entries = await query<DevlogEntry>(
      `SELECT * FROM devlog_entries 
       WHERE project_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [projectId, Number(limit), Number(offset)]
    );
    
    res.json(entries);
  } catch (error) {
    console.error('Error fetching project entries:', error);
    res.status(500).json({ error: 'Failed to fetch project entries' });
  }
});

// Get single devlog entry
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const entry = await queryOne(
      `SELECT de.*, 
              p.id as project_id, p.name as project_name, p.slug as project_slug
       FROM devlog_entries de
       LEFT JOIN projects p ON de.project_id = p.id
       WHERE de.id = $1`,
      [id]
    );
    
    if (!entry) {
      return res.status(404).json({ error: 'Devlog entry not found' });
    }
    
    // Format the response
    const formattedEntry = {
      id: entry.id,
      project_id: entry.project_id,
      title: entry.title,
      content: entry.content,
      entry_type: entry.entry_type,
      tags: entry.tags,
      images: entry.images || [],
      created_at: entry.created_at,
      updated_at: entry.updated_at,
      project: {
        id: entry.project_id,
        name: entry.project_name,
        slug: entry.project_slug
      }
    };
    
    res.json(formattedEntry);
  } catch (error) {
    console.error('Error fetching devlog entry:', error);
    res.status(500).json({ error: 'Failed to fetch devlog entry' });
  }
});

// Create new devlog entry (protected)
router.post('/', protectRoute, async (req, res) => {
  try {
    const { project_id, title, content, entry_type, tags, images } = req.body;
    
    if (!project_id || !title || !content) {
      return res.status(400).json({ error: 'project_id, title, and content are required' });
    }
    
    const entry = await queryOne<DevlogEntry>(
      `INSERT INTO devlog_entries (project_id, title, content, entry_type, tags, images)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [project_id, title, content, entry_type || 'progress', tags || [], JSON.stringify(images || [])]
    );
    
    res.status(201).json(entry);
  } catch (error) {
    console.error('Error creating devlog entry:', error);
    res.status(500).json({ error: 'Failed to create devlog entry' });
  }
});

// Update devlog entry (protected)
router.put('/:id', protectRoute, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Build dynamic UPDATE query
    const updateFields = Object.keys(updates).filter(key => key !== 'id' && key !== 'project_id' && key !== 'created_at' && key !== 'updated_at');
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [id, ...updateFields.map(field => {
      // Special handling for images field to ensure proper JSON serialization
      if (field === 'images' && Array.isArray(updates[field])) {
        return JSON.stringify(updates[field]);
      }
      return updates[field];
    })];
    
    const entry = await queryOne<DevlogEntry>(
      `UPDATE devlog_entries SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );
    
    if (!entry) {
      return res.status(404).json({ error: 'Devlog entry not found' });
    }
    
    res.json(entry);
  } catch (error) {
    console.error('Error updating devlog entry:', error);
    res.status(500).json({ error: 'Failed to update devlog entry' });
  }
});

// Delete devlog entry (protected)
router.delete('/:id', protectRoute, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await queryOne(
      'DELETE FROM devlog_entries WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (!result) {
      return res.status(404).json({ error: 'Devlog entry not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting devlog entry:', error);
    res.status(500).json({ error: 'Failed to delete devlog entry' });
  }
});

export default router;