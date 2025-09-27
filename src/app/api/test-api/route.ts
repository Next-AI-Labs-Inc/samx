import { NextRequest, NextResponse } from 'next/server';
import { SamApiService } from '@/lib/services/sam-api';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing SAM.gov API key and connection...');
    
    // Check if API key is available
    const apiKey = process.env.SAM_API_KEY;
    console.log('API Key available:', !!apiKey);
    console.log('API Key length:', apiKey?.length || 0);
    console.log('API Key starts with:', apiKey?.substring(0, 8) + '...' || 'none');
    console.log('API Key format check:', {
      hasSpaces: apiKey?.includes(' '),
      hasQuotes: apiKey?.includes('"') || apiKey?.includes("'"),
      actualLength: apiKey?.length,
      expectedLength: 'around 40 chars'
    });
    
    if (!apiKey) {
      return NextResponse.json({
        error: 'No API key found in environment variables',
        details: 'Check that SAM_API_KEY is set in .env.local',
        envCheck: {
          NODE_ENV: process.env.NODE_ENV,
          hasApiKey: false
        }
      }, { status: 400 });
    }

    // Try to initialize the service
    console.log('🔧 Initializing SAM API service...');
    const samApi = new SamApiService(apiKey);
    
    // Test a very simple API call
    console.log('📡 Testing basic API connectivity...');
    
    try {
      const testResponse = await samApi.getApiInfo();
      console.log('API Info response:', testResponse);
      
      return NextResponse.json({
        success: true,
        message: 'SAM.gov API key is valid and working!',
        apiKey: {
          provided: true,
          length: apiKey.length,
          prefix: apiKey.substring(0, 8) + '...'
        },
        apiInfo: testResponse,
        timestamp: new Date().toISOString()
      });
      
    } catch (apiError: any) {
      console.error('❌ API call failed:', apiError);
      
      return NextResponse.json({
        error: 'API call failed',
        details: apiError.message,
        apiKey: {
          provided: true,
          length: apiKey.length,
          prefix: apiKey.substring(0, 8) + '...'
        },
        errorType: apiError.response?.status || 'Network Error',
        errorData: apiError.response?.data || null,
        troubleshooting: {
          possibleCauses: [
            'Invalid API key (must be from api.data.gov, not SAM.gov login)',
            'API key has spaces or quotes',
            'Rate limit exceeded (1,000/hour for free keys)',
            'Network connectivity issue'
          ],
          checkUrl: 'https://api.data.gov/signup/',
          testUrl: `https://api.sam.gov/opportunities/v2/search?api_key=YOUR_KEY&noticeType=solicitation&limit=1`
        }
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('🚨 Test API error:', error);
    
    return NextResponse.json({
      error: 'Failed to test API',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}