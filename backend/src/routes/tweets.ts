import { Router } from 'express';
import { query, queryOne } from '../config/database';
import twitterService, { StoredTweet } from '../services/twitter';

const router = Router();

// Get all tweets with optional date filtering
router.get('/', async (req, res) => {
  try {
    const { date, project_id, converted } = req.query;
    
    let sqlQuery = 'SELECT * FROM tweets WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (date) {
      paramCount++;
      sqlQuery += ` AND DATE(created_at) = $${paramCount}`;
      params.push(date);
    }

    if (project_id) {
      paramCount++;
      sqlQuery += ` AND assigned_project_id = $${paramCount}`;
      params.push(project_id);
    }

    if (converted !== undefined) {
      paramCount++;
      sqlQuery += ` AND converted_to_devlog = $${paramCount}`;
      params.push(converted === 'true');
    }

    sqlQuery += ' ORDER BY created_at DESC';

    const tweets = await query<StoredTweet>(sqlQuery, params);
    res.json(tweets);
  } catch (error) {
    console.error('Error fetching tweets:', error);
    res.status(500).json({ error: 'Failed to fetch tweets' });
  }
});

// Get tweets grouped by date
router.get('/grouped', async (req, res) => {
  try {
    const tweets = await query<StoredTweet & { date: string }>(
      `SELECT *, DATE(created_at) as date 
       FROM tweets 
       ORDER BY created_at DESC`
    );

    // Group tweets by date
    const grouped = tweets.reduce((acc, tweet) => {
      const date = tweet.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(tweet);
      return acc;
    }, {} as Record<string, StoredTweet[]>);

    res.json(grouped);
  } catch (error) {
    console.error('Error fetching grouped tweets:', error);
    res.status(500).json({ error: 'Failed to fetch grouped tweets' });
  }
});

// Sync tweets from Twitter
router.post('/sync', async (req, res) => {
  try {
    const result = await twitterService.syncTweets();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error syncing tweets:', error);
    res.status(500).json({ error: 'Failed to sync tweets' });
  }
});

// Assign tweet to project
router.post('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { project_id } = req.body;

    const tweet = await queryOne<StoredTweet>(
      'UPDATE tweets SET assigned_project_id = $1 WHERE id = $2 RETURNING *',
      [project_id || null, id]
    );

    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found' });
    }

    res.json(tweet);
  } catch (error) {
    console.error('Error assigning tweet to project:', error);
    res.status(500).json({ error: 'Failed to assign tweet to project' });
  }
});

// Convert tweet to devlog entry
router.post('/:id/convert', async (req, res) => {
  try {
    const { id } = req.params;
    const { entry_type = 'thoughts' } = req.body;

    // Get the tweet
    const tweet = await queryOne<StoredTweet>(
      'SELECT * FROM tweets WHERE id = $1',
      [id]
    );

    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found' });
    }

    if (!tweet.assigned_project_id) {
      return res.status(400).json({ error: 'Tweet must be assigned to a project first' });
    }

    if (tweet.converted_to_devlog) {
      return res.status(400).json({ error: 'Tweet already converted to devlog' });
    }

    // Extract hashtags as tags
    const hashtagRegex = /#(\w+)/g;
    const matches = tweet.text.match(hashtagRegex);
    const tags = matches ? matches.map(tag => tag.substring(1)) : [];

    // Create devlog entry with tweet content
    let content = tweet.text;
    
    // Add media URLs to content if present
    if (tweet.media_urls && tweet.media_urls.length > 0) {
      content += '\n\nMedia:\n';
      tweet.media_urls.forEach((url: string) => {
        content += `- ${url}\n`;
      });
    }

    // Add metrics to content
    if (tweet.metrics && Object.keys(tweet.metrics).length > 0) {
      content += `\n\nEngagement: ${tweet.metrics.like_count || 0} likes, ${tweet.metrics.retweet_count || 0} retweets`;
    }

    // Create devlog entry with tweet's original timestamp
    const devlogEntry = await queryOne(
      `INSERT INTO devlog_entries (
        project_id, title, content, entry_type, tags, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $6)
      RETURNING *`,
      [
        tweet.assigned_project_id,
        `Tweet from ${new Date(tweet.created_at).toLocaleDateString()}`,
        content,
        entry_type,
        tags,
        tweet.created_at // Use tweet's original timestamp
      ]
    );

    // Mark tweet as converted
    await query(
      'UPDATE tweets SET converted_to_devlog = true WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      tweet,
      devlog_entry: devlogEntry
    });
  } catch (error) {
    console.error('Error converting tweet to devlog:', error);
    res.status(500).json({ error: 'Failed to convert tweet to devlog' });
  }
});

// Batch convert multiple tweets
router.post('/batch-convert', async (req, res) => {
  try {
    const { tweet_ids, entry_type = 'thoughts' } = req.body;

    if (!Array.isArray(tweet_ids) || tweet_ids.length === 0) {
      return res.status(400).json({ error: 'tweet_ids array is required' });
    }

    const results = [];
    const errors = [];

    for (const tweetId of tweet_ids) {
      try {
        // Get the tweet
        const tweet = await queryOne<StoredTweet>(
          'SELECT * FROM tweets WHERE id = $1',
          [tweetId]
        );

        if (!tweet || !tweet.assigned_project_id || tweet.converted_to_devlog) {
          errors.push({ id: tweetId, error: 'Invalid tweet state' });
          continue;
        }

        // Extract hashtags as tags
        const hashtagRegex = /#(\w+)/g;
        const matches = tweet.text.match(hashtagRegex);
        const tags = matches ? matches.map(tag => tag.substring(1)) : [];

        // Create devlog entry
        let content = tweet.text;
        if (tweet.media_urls && tweet.media_urls.length > 0) {
          content += '\n\nMedia:\n';
          tweet.media_urls.forEach((url: string) => {
            content += `- ${url}\n`;
          });
        }

        const devlogEntry = await queryOne(
          `INSERT INTO devlog_entries (
            project_id, title, content, entry_type, tags, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $6)
          RETURNING *`,
          [
            tweet.assigned_project_id,
            `Tweet from ${new Date(tweet.created_at).toLocaleDateString()}`,
            content,
            entry_type,
            tags,
            tweet.created_at
          ]
        );

        // Mark tweet as converted
        await query(
          'UPDATE tweets SET converted_to_devlog = true WHERE id = $1',
          [tweetId]
        );

        results.push({ tweet, devlog_entry: devlogEntry });
      } catch (error) {
        errors.push({ id: tweetId, error: String(error) });
      }
    }

    res.json({
      success: true,
      converted: results.length,
      errors: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('Error batch converting tweets:', error);
    res.status(500).json({ error: 'Failed to batch convert tweets' });
  }
});

export default router;