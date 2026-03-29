/**
 * Vercel Serverless Function
 * Root Cause Analysis API Endpoint
 * HSG245 Incident Investigation using OpenAI
 * 
 * Endpoints:
 * - POST /api/analyze - Perform root cause analysis
 * - GET  /api/analyze - Health check
 */

export default async function handler(req, res) {
  // Health check endpoint
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'healthy',
      service: 'Root Cause Analysis API',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  }
  // CORS headers - Allow frontend to access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      status: 'error',
      message: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const incidentData = req.body;
    
    console.log('📥 Received incident data:', JSON.stringify(incidentData, null, 2));

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured in Vercel environment variables');
    }

    // Call OpenAI API for HSG245 analysis
    console.log('🤖 Calling OpenAI API...');
    
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: `You are a UK Health & Safety expert conducting HSG245 root cause analysis. 
You provide structured incident investigations following HSG245 framework.
Always return valid JSON in the specified format.`
          },
          {
            role: 'user',
            content: `Conduct a comprehensive HSG245 root cause analysis for this incident:

INCIDENT DATA:
${JSON.stringify(incidentData, null, 2)}

Provide your analysis in this EXACT JSON format:
{
  "part1_overview": {
    "incident_type": "specific incident type (e.g., Slip/trip/fall, Equipment failure, etc.)",
    "date_time": "incident date and time",
    "location": "where it happened",
    "brief_details": {
      "what": "what happened",
      "where": "specific location details",
      "who": "who was involved"
    },
    "immediate_actions_taken": ["action 1", "action 2"]
  },
  "part2_assessment": {
    "type_of_event": "Accident or Ill health or Near-miss or Undesired circumstance",
    "actual_potential_harm": "Fatal or major or Serious or Minor or Damage only",
    "riddor_reportable": "Y or N",
    "riddor_reasoning": "explanation why RIDDOR reportable or not",
    "accident_book_entry": "Y or N",
    "investigation_level": "High level or Medium level or Low level or Basic",
    "priority": "High or Medium or Low",
    "investigation_team": ["team member 1", "team member 2"]
  },
  "part3_investigation": {
    "immediate_causes": ["immediate cause 1", "immediate cause 2"],
    "underlying_causes": ["underlying cause 1", "underlying cause 2"],
    "root_causes": ["root cause 1", "root cause 2"],
    "contributing_factors": ["factor 1", "factor 2"]
  },
  "part4_recommendations": {
    "immediate_actions": ["urgent action 1", "urgent action 2"],
    "short_term_actions": ["short term action 1", "short term action 2"],
    "long_term_actions": ["long term action 1", "long term action 2"],
    "responsible_persons": ["person/role 1", "person/role 2"],
    "target_dates": ["date for action 1", "date for action 2"]
  }
}

IMPORTANT: Return ONLY valid JSON, no markdown, no explanations.`
          }
        ]
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const openaiData = await openaiResponse.json();
    console.log('✅ OpenAI response received');
    
    const analysisText = openaiData.choices[0].message.content.trim();
    console.log('📄 Raw analysis:', analysisText);

    // Parse JSON response
    let analysis;
    try {
      // Remove markdown code blocks if present
      const cleanedText = analysisText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      analysis = JSON.parse(cleanedText);
      console.log('✅ JSON parsed successfully');
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      
      // Try to extract JSON from text
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analysis = JSON.parse(jsonMatch[0]);
          console.log('✅ JSON extracted and parsed');
        } catch (e) {
          throw new Error('Failed to parse AI response as JSON');
        }
      } else {
        throw new Error('No JSON found in AI response');
      }
    }

    // Add metadata
    const fullReport = {
      status: 'success',
      incident_id: incidentData.id || `INC-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...analysis
    };

    console.log('📊 Analysis complete');
    return res.status(200).json(fullReport);

  } catch (error) {
    console.error('❌ Analysis error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
