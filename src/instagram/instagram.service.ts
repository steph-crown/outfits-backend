import { Injectable, Logger } from '@nestjs/common';

export interface InstagramMediaData {
  __typename: string;
  shortcode: string;
  dimensions: {
    height: number;
    width: number;
  };
  display_url: string;
  display_resources: Array<{
    src: string;
    config_width: number;
    config_height: number;
  }>;
  has_audio: boolean;
  video_url?: string;
  video_view_count?: number;
  video_play_count?: number;
  is_video: boolean;
  caption?: string;
  is_paid_partnership: boolean;
  location?: any;
  owner: {
    id: string;
    is_verified: boolean;
    profile_pic_url: string;
    username: string;
    full_name: string;
    is_private: boolean;
  };
  product_type: string;
  video_duration?: number;
  thumbnail_src?: string;
  clips_music_attribution_info?: {
    artist_name: string;
    song_name: string;
    uses_original_audio: boolean;
  };
  edge_sidecar_to_children?: {
    edges: Array<{
      node: InstagramMediaData;
    }>;
  };
}

export interface ProcessedInstagramData {
  id: string;
  shortcode: string;
  type: 'image' | 'video' | 'carousel';
  media: Array<{
    url: string;
    type: 'image' | 'video';
    width: number;
    height: number;
    thumbnail?: string;
  }>;
  title: string;
  description: string;
  sourceUrl: string;
  platform: 'instagram';
  author: {
    username: string;
    fullName: string;
    profilePicture: string;
    isVerified: boolean;
  };
  metadata: {
    likes?: number;
    comments?: number;
    views?: number;
    duration?: number;
    location?: string;
  };
}

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);

  // From GitHub repo - only these 3 variables are needed
  private readonly USER_AGENT =
    process.env.USER_AGENT ||
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
  private readonly X_IG_APP_ID = process.env.X_IG_APP_ID || '936619743392459';

  /**
   * Extract Instagram post/reel ID from URL (from GitHub repo)
   */
  private getId(url: string): string | null {
    const regex =
      /instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(p|reels|reel|stories)\/([A-Za-z0-9-_]+)/;
    const match = url.match(regex);
    return match && match[2] ? match[2] : null;
  }

  /**
   * Get Instagram data using GraphQL (from GitHub repo)
   */
  private async getInstagramGraphqlData(
    url: string,
  ): Promise<InstagramMediaData | null> {
    const igId = this.getId(url);
    if (!igId) return null;

    // Fetch graphql data from instagram post (exact same as GitHub repo)
    const graphql = new URL(`https://www.instagram.com/api/graphql`);
    graphql.searchParams.set('variables', JSON.stringify({ shortcode: igId }));
    graphql.searchParams.set('doc_id', '10015901848480474');
    graphql.searchParams.set('lsd', 'AVqbxe3J_YA');

    const response = await fetch(graphql, {
      method: 'POST',
      headers: {
        'User-Agent': this.USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-IG-App-ID': this.X_IG_APP_ID,
        'X-FB-LSD': 'AVqbxe3J_YA',
        'X-ASBD-ID': '129477',
        'Sec-Fetch-Site': 'same-origin',
      },
    });

    this.logger.log(`Instagram GraphQL response status: ${response.status}`);

    const json = await response.json();
    this.logger.log(
      `Instagram GraphQL response:`,
      JSON.stringify(json, null, 2),
    );

    const items = json?.data?.xdt_shortcode_media;
    this.logger.log(`Extracted media data:`, JSON.stringify(items, null, 2));

    return items;
  }

  /**
   * Process Instagram media data into our standard format
   */
  private processInstagramData(
    data: InstagramMediaData,
    originalUrl: string,
  ): ProcessedInstagramData {
    this.logger.log(
      `Processing Instagram data:`,
      JSON.stringify(data, null, 2),
    );

    const media: Array<{
      url: string;
      type: 'image' | 'video';
      width: number;
      height: number;
      thumbnail?: string;
    }> = [];

    this.logger.log(`Data __typename: ${data.__typename}`);
    this.logger.log(`Data display_url: ${data.display_url}`);
    this.logger.log(`Data video_url: ${data.video_url}`);
    this.logger.log(
      `Data edge_sidecar_to_children length: ${data.edge_sidecar_to_children?.edges?.length || 0}`,
    );

    // Handle single media (image or video) - XDTGraphImage or XDTGraphVideo
    if (data.__typename === 'XDTGraphImage') {
      this.logger.log(`Processing single image`);
      const largestImage = data.display_resources?.reduce((prev, current) =>
        prev.config_width > current.config_width ? prev : current,
      );
      media.push({
        url: largestImage?.src || data.display_url,
        type: 'image',
        width: data.dimensions.width,
        height: data.dimensions.height,
      });
    } else if (data.__typename === 'XDTGraphVideo') {
      this.logger.log(`Processing single video`);
      media.push({
        url: data.video_url || data.display_url,
        type: 'video',
        width: data.dimensions.width,
        height: data.dimensions.height,
        thumbnail: data.thumbnail_src || data.display_url,
      });
    }

    // Handle carousel/sidecar media - XDTGraphSidecar
    if (
      data.edge_sidecar_to_children?.edges &&
      data.edge_sidecar_to_children.edges.length > 0
    ) {
      this.logger.log(
        `Processing carousel with ${data.edge_sidecar_to_children.edges.length} items`,
      );
      data.edge_sidecar_to_children.edges.forEach((item, index) => {
        this.logger.log(`Carousel item ${index}: ${item.node.__typename}`);
        if (item.node.__typename === 'XDTGraphImage') {
          const largestImage = item.node.display_resources?.reduce(
            (prev, current) =>
              prev.config_width > current.config_width ? prev : current,
          );
          media.push({
            url: largestImage?.src || item.node.display_url,
            type: 'image',
            width: item.node.dimensions.width,
            height: item.node.dimensions.height,
          });
        } else if (item.node.__typename === 'XDTGraphVideo') {
          media.push({
            url: item.node.video_url || item.node.display_url,
            type: 'video',
            width: item.node.dimensions.width,
            height: item.node.dimensions.height,
            thumbnail: item.node.thumbnail_src || item.node.display_url,
          });
        }
      });
    }

    // Determine content type
    let type: 'image' | 'video' | 'carousel' = 'image';
    if (data.is_video && media.length === 1) {
      type = 'video';
    } else if (media.length > 1) {
      type = 'carousel';
    }

    // Create title and description
    const title = data.caption
      ? data.caption.substring(0, 100) +
        (data.caption.length > 100 ? '...' : '')
      : `Instagram ${type}`;
    const description =
      data.caption || `Instagram ${type} by @${data.owner.username}`;

    const result: ProcessedInstagramData = {
      id: data.shortcode,
      shortcode: data.shortcode,
      type,
      media,
      title,
      description,
      sourceUrl: originalUrl,
      platform: 'instagram' as const,
      author: {
        username: data.owner.username,
        fullName: data.owner.full_name,
        profilePicture: data.owner.profile_pic_url,
        isVerified: data.owner.is_verified,
      },
      metadata: {
        views: data.video_view_count || data.video_play_count,
        duration: data.video_duration,
        location: data.location?.name,
      },
    };

    this.logger.log(`Final processed result:`, JSON.stringify(result, null, 2));
    this.logger.log(`Media array length: ${media.length}`);

    return result;
  }

  /**
   * Main method to process Instagram URL
   */
  async processInstagramUrl(url: string): Promise<ProcessedInstagramData> {
    try {
      this.logger.log(`Processing Instagram URL: ${url}`);

      // Get data from Instagram using GraphQL (exact same as GitHub repo)
      const rawData = await this.getInstagramGraphqlData(url);
      if (!rawData) {
        throw new Error('Failed to fetch Instagram data');
      }

      // Process the data
      const processedData = this.processInstagramData(rawData, url);

      this.logger.log(
        `Successfully processed Instagram content: ${processedData.type} with ${processedData.media.length} media items`,
      );

      return processedData;
    } catch (error) {
      this.logger.error(`Failed to process Instagram URL ${url}:`, error);
      throw new Error(`Instagram processing failed: ${error.message}`);
    }
  }

  /**
   * Check if URL is a valid Instagram post/reel
   */
  canProcess(url: string): boolean {
    return /instagram\.com\/(p|reel|reels)\//.test(url);
  }
}
