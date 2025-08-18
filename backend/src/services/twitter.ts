import { TwitterApi, TweetV2 } from 'twitter-api-v2';
import { pool } from '../config/database';

export interface StoredTweet {
  id: string;
  tweet_id: string;
  text: string;
  author_username: string;
  created_at: Date;
  imported_at: Date;
  assigned_project_id: string | null;
  converted_to_devlog: boolean;
  media_urls: any[];
  metrics: any;
  raw_data: any;
}

class TwitterService {
  private client: TwitterApi;
  private userId: string;
  private username: string;

  constructor() {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    if (!bearerToken) {
      throw new Error('TWITTER_BEARER_TOKEN is required');
    }

    this.userId = process.env.TWITTER_USER_ID || '';
    this.username = process.env.TWITTER_USERNAME || 'MaximKabaev21';
    
    // Initialize Twitter client with bearer token for app-only auth
    this.client = new TwitterApi(bearerToken);
  }

  /**
   * Get user ID from username if not provided
   */
  async ensureUserId(): Promise<string> {
    if (this.userId) return this.userId;

    try {
      const user = await this.client.v2.userByUsername(this.username);
      if (user.data) {
        this.userId = user.data.id;
        console.log(`Found user ID for @${this.username}: ${this.userId}`);
        return this.userId;
      }
      throw new Error(`User @${this.username} not found`);
    } catch (error) {
      console.error('Error fetching user ID:', error);
      throw error;
    }
  }

  /**
   * Fetch tweets for a specific date range
   */
  async fetchTweetsByDateRange(startDate: Date, endDate: Date): Promise<TweetV2[]> {
    try {
      const userId = await this.ensureUserId();
      
      const tweets = await this.client.v2.userTimeline(userId, {
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        max_results: 100,
        'tweet.fields': ['created_at', 'author_id', 'public_metrics', 'attachments', 'entities'],
        'media.fields': ['url', 'preview_image_url'],
        expansions: ['attachments.media_keys']
      });

      const allTweets: TweetV2[] = [];
      for await (const tweet of tweets) {
        allTweets.push(tweet);
      }

      return allTweets;
    } catch (error) {
      console.error('Error fetching tweets:', error);
      throw error;
    }
  }

  /**
   * Fetch tweets for today
   */
  async fetchTodaysTweets(): Promise<TweetV2[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return this.fetchTweetsByDateRange(startOfDay, endOfDay);
  }

  /**
   * Fetch tweets since last import
   */
  async fetchNewTweets(): Promise<TweetV2[]> {
    try {
      // Get the timestamp of the last imported tweet
      const result = await pool.query(
        'SELECT MAX(created_at) as last_tweet_date FROM tweets WHERE author_username = $1',
        [this.username]
      );

      const lastTweetDate = result.rows[0]?.last_tweet_date;
      const startDate = lastTweetDate ? new Date(lastTweetDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default to last 7 days
      const endDate = new Date();

      console.log(`Fetching tweets from ${startDate.toISOString()} to ${endDate.toISOString()}`);
      return this.fetchTweetsByDateRange(startDate, endDate);
    } catch (error) {
      console.error('Error fetching new tweets:', error);
      throw error;
    }
  }

  /**
   * Store tweets in database
   */
  async storeTweets(tweets: TweetV2[]): Promise<StoredTweet[]> {
    const storedTweets: StoredTweet[] = [];

    for (const tweet of tweets) {
      try {
        // Extract media URLs if present
        const mediaUrls: string[] = [];
        if (tweet.attachments?.media_keys && (tweet as any).includes?.media) {
          for (const mediaKey of tweet.attachments.media_keys) {
            const media = (tweet as any).includes.media.find((m: any) => m.media_key === mediaKey);
            if (media && 'url' in media) {
              mediaUrls.push(media.url);
            }
          }
        }

        // Store tweet in database
        const result = await pool.query(
          `INSERT INTO tweets (
            tweet_id, text, author_username, created_at, media_urls, metrics, raw_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (tweet_id) DO UPDATE SET
            text = EXCLUDED.text,
            metrics = EXCLUDED.metrics,
            media_urls = EXCLUDED.media_urls,
            raw_data = EXCLUDED.raw_data
          RETURNING *`,
          [
            tweet.id,
            tweet.text,
            this.username,
            tweet.created_at,
            JSON.stringify(mediaUrls),
            JSON.stringify(tweet.public_metrics || {}),
            JSON.stringify(tweet)
          ]
        );

        storedTweets.push(result.rows[0]);
      } catch (error) {
        console.error(`Error storing tweet ${tweet.id}:`, error);
      }
    }

    console.log(`Stored ${storedTweets.length} tweets`);
    return storedTweets;
  }

  /**
   * Sync tweets (fetch and store)
   */
  async syncTweets(): Promise<{ imported: number; updated: number }> {
    try {
      const tweets = await this.fetchNewTweets();
      const stored = await this.storeTweets(tweets);
      
      return {
        imported: stored.filter(t => t.imported_at).length,
        updated: tweets.length - stored.filter(t => t.imported_at).length
      };
    } catch (error) {
      console.error('Error syncing tweets:', error);
      throw error;
    }
  }
}

export default new TwitterService();