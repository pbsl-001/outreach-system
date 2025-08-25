// netlify/functions/companies-house.js
// This function handles all Companies House API calls

exports.handler = async (event, context) => {
    // Enable CORS for your application
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Get API key from environment variable
    const API_KEY = process.env.COMPANIES_HOUSE_API_KEY;
    
    if (!API_KEY) {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                error: 'API key not configured',
                message: 'Please set COMPANIES_HOUSE_API_KEY in Netlify environment variables'
            })
        };
    }

    // Parse the request path
    const path = event.path.replace('/.netlify/functions/companies-house', '');
    
    // Log for debugging
    console.log('Request path:', path);
    console.log('API Key present:', !!API_KEY);

    try {
        let endpoint = '';

        // Handle different request types
        if (path.includes('/psc/')) {
            // Get PSC data
            const companyNumber = path.split('/psc/')[1];
            endpoint = `/company/${companyNumber}/persons-with-significant-control`;
        } else if (path.includes('/company/')) {
            // Get company info
            const companyNumber = path.split('/company/')[1];
            endpoint = `/company/${companyNumber}`;
        } else if (path.includes('/officers/')) {
            // Get officers
            const companyNumber = path.split('/officers/')[1];
            endpoint = `/company/${companyNumber}/officers`;
        } else {
            // Default response - API is working
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'Companies House API Function is working',
                    status: 'ready',
                    apiKeyConfigured: true,
                    path: path || '/',
                    instructions: 'Use /psc/{number}, /company/{number}, or /officers/{number}'
                })
            };
        }

        // Make request to Companies House API
        console.log('Making request to Companies House:', endpoint);
        
        const apiUrl = 'https://api.company-information.service.gov.uk' + endpoint;
        const authString = Buffer.from(API_KEY + ':').toString('base64');
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + authString,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        
        console.log('Companies House response status:', response.status);

        // Return the response
        return {
            statusCode: response.status,
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message,
                details: 'Check function logs for more information'
            })
        };
    }
};
