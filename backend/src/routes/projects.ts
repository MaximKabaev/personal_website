import { Router } from 'express';
import { query, queryOne, Project } from '../config/database';

const router = Router();

// Get all projects with optional folder filtering
router.get('/', async (req, res) => {
  try {
    const { folder_id, status } = req.query;
    
    let queryText = 'SELECT * FROM projects WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (folder_id) {
      queryText += ` AND folder_id = $${paramIndex++}`;
      params.push(folder_id);
    }
    
    if (status) {
      queryText += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    
    queryText += ' ORDER BY display_order ASC, created_at DESC';
    
    const projects = await query<Project>(queryText, params);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project by ID or slug
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Check if identifier is a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    let queryText: string;
    let params: any[];
    
    if (isUUID) {
      queryText = 'SELECT * FROM projects WHERE id = $1';
      params = [identifier];
    } else {
      queryText = 'SELECT * FROM projects WHERE slug = $1';
      params = [identifier];
    }
    
    const project = await queryOne<Project>(queryText, params);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Get project by folder and slug (for nested URLs)
router.get('/by-path/:folderSlug/:projectSlug', async (req, res) => {
  try {
    const { folderSlug, projectSlug } = req.params;
    
    // First get the folder
    const folder = await queryOne(
      'SELECT id FROM folders WHERE slug = $1',
      [folderSlug]
    );
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    // Then get the project
    const project = await queryOne<Project>(
      'SELECT * FROM projects WHERE folder_id = $1 AND slug = $2',
      [folder.id, projectSlug]
    );
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error fetching project by path:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    const { name, slug, description, folder_id, status, tech_stack, github_url, demo_url, display_order } = req.body;
    
    const project = await queryOne<Project>(
      `INSERT INTO projects (name, slug, description, folder_id, status, tech_stack, github_url, demo_url, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, slug, description, folder_id, status || 'active', tech_stack || [], github_url, demo_url, display_order || 0]
    );
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Build dynamic UPDATE query
    const updateFields = Object.keys(updates).filter(key => key !== 'id');
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [id, ...updateFields.map(field => updates[field])];
    
    const project = await queryOne<Project>(
      `UPDATE projects SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await queryOne(
      'DELETE FROM projects WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (!result) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;