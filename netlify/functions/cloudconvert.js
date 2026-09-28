import { corsHeaders } from './utils.js';

export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }
  
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const CLOUDCONVERT_API_KEY = process.env.CLOUDCONVERT_API_KEY;
  if (!CLOUDCONVERT_API_KEY) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Missing CloudConvert API Key' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { action, jobId, inputFormat, outputFormat, fileName } = body;

    // Acción 1: Crear el Job y generar la URL de subida
    if (action === 'create-job') {
      const response = await fetch('https://api.cloudconvert.com/v2/jobs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "tasks": {
            "import-1": {
              "operation": "import/upload"
            },
            "task-1": {
              "operation": "convert",
              "input": "import-1",
              "input_format": inputFormat.toLowerCase(),
              "output_format": outputFormat.toLowerCase()
            },
            "export-1": {
              "operation": "export/url",
              "input": "task-1"
            }
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error creating CloudConvert job');
      }

      // Encontrar la tarea de importación (upload) para dársela al frontend
      const importTask = data.data.tasks.find(t => t.operation === 'import/upload');
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          jobId: data.data.id,
          uploadUrl: importTask.result.form.url,
          uploadParameters: importTask.result.form.parameters
        })
      };
    } 
    
    // Acción 2: Chequear el estado del Job
    else if (action === 'check-status') {
      if (!jobId) throw new Error('Missing jobId');

      const response = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error checking status');

      const jobStatus = data.data.status; // 'waiting', 'processing', 'finished', 'error'
      let downloadUrl = null;
      let errorMessage = jobStatus === 'error' ? 'Conversion failed in the cloud' : null;

      if (jobStatus === 'finished') {
        const exportTask = data.data.tasks.find(t => t.operation === 'export/url');
        if (exportTask && exportTask.result && exportTask.result.files && exportTask.result.files.length > 0) {
          downloadUrl = exportTask.result.files[0].url;
        }
      } else if (jobStatus === 'error') {
        const errorMessages = data.data.tasks
          .filter(t => t.status === 'error' && t.message)
          .map(t => `${t.operation}: ${t.message}`);
        
        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join(' | ');
        }
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: jobStatus,
          downloadUrl: downloadUrl,
          message: errorMessage
        })
      };
    }

    // Acción 3: Debug formatos
    else if (action === 'debug-formats') {
      const response = await fetch(`https://api.cloudconvert.com/v2/convert/formats?filter[input_format]=${inputFormat.toLowerCase()}&filter[output_format]=${outputFormat.toLowerCase()}`, {
        headers: {
          'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`
        }
      });
      const data = await response.json();
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(data)
      };
    }

    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid action' }) };

  } catch (error) {
    console.error('CloudConvert Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' })
    };
  }
};
