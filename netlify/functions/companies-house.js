// This file handles all Companies House API calls
exports.handler = async (event, context) => {
    // Allow your website to talk to this function
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    // Handle browser pre-flight checks
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Get your API key from Netlify (we'll set this up later)
    const API_KEY = process.env.COMPANIES_HOUSE_API_KEY;
    
    if (!API_KEY) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'API key not configured yet. Please set it in Netlify.' 
            })
        };
    }

    // Get what was requested
    const path = event.path.replace('/.netlify/functions/companies-house', '');

    try {
        let endpoint = '';

        // Handle different types of requests
        if (path.includes('/company/')) {
            // Get company information
            const companyNumber = path.split('/company/')[1];
            endpoint = `/company/${companyNumber}`;
        } else if (path.includes('/psc/')) {
            // Get PSC (people) information
            const companyNumber = path.split('/psc/')[1];
            endpoint = `/company/${companyNumber}/persons-with-significant-control`;
        } else if (path.includes('/officers/')) {
            // Get officers information
            const companyNumber = path.split('/officers/')[1];
            endpoint = `/company/${companyNumber}/officers`;
        } else {
            // Default response
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'Companies House API is ready',
                    status: 'working'
                })
            };
        }

        // Make the actual request to Companies House
        const apiUrl = 'https://api.company-information.service.gov.uk' + endpoint;
        
        // Create the authorization
        const authString = Buffer.from(API_KEY + ':').toString('base64');
        
        // Fetch the data
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + authString
            }
        });

        const data = await response.json();

        // Send the data back to your website
        return {
            statusCode: response.ok ? 200 : response.status,
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        // If something goes wrong, return an error
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Something went wrong',
                details: error.message 
            })
        };
    }
};