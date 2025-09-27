import axios, { AxiosInstance } from 'axios';
import { SamApiResponse, SamOpportunity, Contract } from '../types/contract';
import { v4 as uuidv4 } from 'uuid';

export class SamApiService {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl = 'https://api.sam.gov/opportunities/v2/search';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SAM_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('SAM.gov API key is required');
    }

    this.client = axios.create({
      timeout: 30000, // 30 second timeout
      headers: {
        'Accept': 'application/json'
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`SAM.gov API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`SAM.gov API Response: ${response.status} for ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('SAM.gov API Error:', error.response?.status, error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Search for opportunities with filters
   */
  async searchOpportunities(params: {
    keywords?: string;
    naicsCode?: string;
    postedFrom?: string;
    postedTo?: string;
    responseDeadlineFrom?: string;
    responseDeadlineTo?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<SamApiResponse> {
    try {
      const searchParams = new URLSearchParams();

      // REQUIRED: Add API key as query parameter (not header!)
      searchParams.append('api_key', this.apiKey);
      
      // REQUIRED: Add ptype parameter for opportunities
      searchParams.append('ptype', 'o');

      // REQUIRED: Add PostedFrom and PostedTo (SAM.gov requires MM/dd/yyyy format)
      let defaultPostedFrom = params.postedFrom || '09/01/2025';
      let defaultPostedTo = params.postedTo || new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
      
      // Ensure dates are in MM/dd/yyyy format (SAM.gov requirement)
      const formatDateForSam = (dateStr: string): string => {
        // If already in MM/dd/yyyy format, return as-is
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
          return dateStr;
        }
        // If in yyyy-MM-dd format, convert to MM/dd/yyyy
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const [year, month, day] = dateStr.split('-');
          return `${month}/${day}/${year}`;
        }
        // If it's a Date object or other format, parse and format
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date format: ${dateStr}. Expected MM/dd/yyyy or yyyy-MM-dd`);
        }
        return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
      };
      
      defaultPostedFrom = formatDateForSam(defaultPostedFrom);
      defaultPostedTo = formatDateForSam(defaultPostedTo);
      
      searchParams.append('postedFrom', defaultPostedFrom);
      searchParams.append('postedTo', defaultPostedTo);

      // Add search parameters
      if (params.keywords) {
        searchParams.append('q', params.keywords);
      }
      
      if (params.naicsCode) {
        searchParams.append('naicsCode', params.naicsCode);
      }

      if (params.responseDeadlineFrom) {
        searchParams.append('responseDeadlineFrom', params.responseDeadlineFrom);
      }

      if (params.responseDeadlineTo) {
        searchParams.append('responseDeadlineTo', params.responseDeadlineTo);
      }

      // Pagination
      searchParams.append('limit', (params.limit || 25).toString());
      if (params.offset) {
        searchParams.append('offset', params.offset.toString());
      }

      const url = `${this.baseUrl}?${searchParams.toString()}`;
      console.log('🌐 SAM.gov API URL:', url.replace(this.apiKey, 'API_KEY_HIDDEN'));

      const response = await this.client.get(url);
      
      console.log(`Retrieved ${response.data?.opportunitiesData?.length || 0} opportunities from SAM.gov`);
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching opportunities from SAM.gov:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        // Handle specific SAM.gov API errors
        const responseData = error.response.data;
        
        // Handle throttling/rate limiting (429 status)
        if (error.response.status === 429 || responseData?.message?.includes('throttled') || responseData?.message?.includes('quota')) {
          const nextAccessTime = responseData.nextAccessTime;
          const description = responseData.description || 'API quota exceeded';
          
          // Create a throttling error with retry information
          const throttleError = new Error(`SAM.gov throttled: ${description}`);
          (throttleError as any).isThrottled = true;
          (throttleError as any).nextAccessTime = nextAccessTime;
          (throttleError as any).retryAfterMs = nextAccessTime ? 
            new Date(nextAccessTime).getTime() - Date.now() : 
            24 * 60 * 60 * 1000; // Default 24 hours
            
          throw throttleError;
        }
        
        // Handle date format errors
        if (responseData?.errorMessage?.includes('Invalid Date')) {
          throw new Error(`SAM.gov date format error: ${responseData.errorMessage}`);
        }
        
        // Handle general API errors
        if (responseData?.errorMessage) {
          throw new Error(`SAM.gov API: ${responseData.errorMessage}`);
        }
        
        // Handle errors with message field (like throttling)
        if (responseData?.message) {
          throw new Error(`SAM.gov: ${responseData.message}`);
        }
      }
      throw new Error(`SAM.gov API error: ${error.response?.status || error.message}`);
    }
  }

  /**
   * Search with automatic retry on throttling
   */
  async searchOpportunitiesWithRetry(params: {
    keywords?: string;
    naicsCode?: string;
    postedFrom?: string;
    postedTo?: string;
    responseDeadlineFrom?: string;
    responseDeadlineTo?: string;
    limit?: number;
    offset?: number;
    onThrottled?: (retryAfterMs: number, nextAccessTime?: string) => void;
    onRetrying?: () => void;
  } = {}): Promise<SamApiResponse> {
    try {
      return await this.searchOpportunities(params);
    } catch (error: any) {
      // Check if this is a throttling error
      if (error.isThrottled && error.retryAfterMs) {
        const retryAfterMs = error.retryAfterMs;
        const nextAccessTime = error.nextAccessTime;
        
        // Notify caller about throttling
        if (params.onThrottled) {
          params.onThrottled(retryAfterMs, nextAccessTime);
        }
        
        // If retry is less than 5 minutes, wait and retry automatically
        if (retryAfterMs > 0 && retryAfterMs <= 5 * 60 * 1000) {
          console.log(`🕐 Waiting ${Math.ceil(retryAfterMs / 1000)} seconds before retrying...`);
          
          await new Promise(resolve => setTimeout(resolve, retryAfterMs + 1000)); // Add 1 second buffer
          
          if (params.onRetrying) {
            params.onRetrying();
          }
          
          // Remove the throttling callbacks to avoid infinite recursion
          const { onThrottled, onRetrying, ...retryParams } = params;
          return await this.searchOpportunities(retryParams);
        }
      }
      
      // Re-throw if not throttled or retry time too long
      throw error;
    }
  }

  /**
   * Get recent opportunities (posted in the last N days)
   * Optimized for minimal API calls with maximum data retrieval
   */
  async getRecentOpportunities(limit = 1000): Promise<SamApiResponse> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Format date as MM/dd/yyyy for SAM.gov API
    const postedFrom = thirtyDaysAgo.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
    
    return this.searchOpportunities({
      postedFrom,
      limit
    });
  }

  /**
   * Get opportunities modified since a specific date (for incremental sync)
   */
  async getOpportunitiesSince(lastSyncDate: Date, limit = 1000): Promise<SamApiResponse> {
    // Format date as MM/dd/yyyy for SAM.gov API
    const modifiedFrom = lastSyncDate.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
    
    // Use modifiedFrom parameter if available, otherwise fall back to postedFrom
    return this.searchOpportunities({
      postedFrom: modifiedFrom,
      limit
    });
  }

  /**
   * Get opportunities with smart date range based on last sync
   */
  async getOpportunitiesIncremental(params: {
    lastSyncDate?: Date;
    limit?: number;
    maxDaysBack?: number;
  } = {}): Promise<SamApiResponse> {
    const {
      lastSyncDate,
      limit = 1000, // Maximize single API call efficiency
      maxDaysBack = 90 // Don't go back more than 90 days
    } = params;
    
    let fromDate: Date;
    
    if (lastSyncDate) {
      // Incremental sync: get data since last sync (minus 1 day buffer for safety)
      fromDate = new Date(lastSyncDate);
      fromDate.setDate(fromDate.getDate() - 1); // 1-day overlap buffer
      
      // Don't go back more than maxDaysBack days
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() - maxDaysBack);
      
      if (fromDate < maxDate) {
        fromDate = maxDate;
      }
    } else {
      // Initial sync: get last 30 days
      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);
    }
    
    const postedFrom = fromDate.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit', 
      year: 'numeric'
    });
    
    console.log(`🗓️ Fetching opportunities from ${postedFrom} (${lastSyncDate ? 'incremental' : 'initial'} sync)`);
    
    return this.searchOpportunities({
      postedFrom,
      limit
    });
  }

  /**
   * Convert SAM.gov opportunity to our Contract interface
   */
  transformOpportunityToContract(opportunity: SamOpportunity): Contract {
    const contactInfo = opportunity.pointOfContact?.map(contact => 
      `${contact.fullName} (${contact.type}): ${contact.email} ${contact.phone || ''}`.trim()
    ).join('; ') || undefined;

    const placeOfPerformance = opportunity.placeOfPerformance ? [
      opportunity.placeOfPerformance.city?.name,
      opportunity.placeOfPerformance.state?.name,
      opportunity.placeOfPerformance.country?.name
    ].filter(Boolean).join(', ') : undefined;

    const now = new Date().toISOString();

    return {
      id: opportunity.noticeId || uuidv4(),
      solicitationNumber: opportunity.solicitationNumber || opportunity.noticeId || uuidv4(),
      title: opportunity.title || 'Untitled Opportunity',
      description: opportunity.description,
      agency: opportunity.organizationHierarchy?.agency?.name,
      office: opportunity.organizationHierarchy?.office?.name,
      naicsCode: opportunity.naicsCode,
      naicsDescription: undefined, // SAM.gov doesn't provide this directly
      postedDate: opportunity.activeDate,
      responseDueDate: opportunity.responseDeadLine,
      archiveDate: opportunity.archiveDate,
      contractAwardDate: opportunity.awardDate,
      awardAmount: opportunity.award?.amount,
      setAsideCode: opportunity.typeOfSetAside,
      setAsideDescription: opportunity.typeOfSetAsideDescription,
      placeOfPerformance,
      contactInfo,
      samUrl: opportunity.uiLink,
      status: 'active',
      lastUpdated: now,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing SAM.gov API connection...');
      const result = await this.searchOpportunities({ limit: 1 });
      console.log('SAM.gov API connection successful');
      return true;
    } catch (error) {
      console.error('SAM.gov API connection failed:', error);
      return false;
    }
  }

  /**
   * Get API usage information
   */
  async getApiInfo(): Promise<any> {
    try {
      // Use proper SAM.gov API format with required parameters
      const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
      const testUrl = `https://api.sam.gov/opportunities/v2/search?api_key=${this.apiKey}&ptype=o&postedFrom=09/01/2025&postedTo=${today}&limit=1`;
      console.log('🔍 Testing SAM.gov API with:', testUrl.replace(this.apiKey, 'API_KEY_HIDDEN'));
      
      const response = await this.client.get(testUrl);
      return {
        status: 'connected',
        statusCode: response.status,
        rateLimit: response.headers['x-ratelimit-limit'],
        rateLimitRemaining: response.headers['x-ratelimit-remaining'],
        rateLimitReset: response.headers['x-ratelimit-reset'],
        dataReceived: !!response.data?.opportunitiesData
      };
    } catch (error: any) {
      console.error('❌ SAM.gov API test failed:', error.response?.status, error.response?.data);
      return {
        status: 'error',
        error: error.message,
        statusCode: error.response?.status,
        responseData: error.response?.data
      };
    }
  }
}