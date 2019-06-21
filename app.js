
const express = require('express');
const bodyParser = require('body-parser');
const dialogflow = require('dialogflow').v2;
const uuid = require('uuid');

const path = require('path');

const port = 3000;
const projectId = 'mytestbot-rwyafw';
const contextsClient = new dialogflow.ContextsClient();

const app1 = express();

async function createContext (sessionId, contextId, lifespanCount = 2, /* parameters */) {

  const sessionPath = contextsClient.sessionPath(projectId, sessionId);
  const contextPath = contextsClient.contextPath(
    projectId,
    sessionId,
    contextId
  );

  const request = {
    parent: sessionPath,
    context: {
      name: contextPath,
      // parameters: jsonToStructProto(parameters),
      lifespanCount
    }
  };

  const [context] = await contextsClient.createContext(request);

  return context;
}

app1.use(bodyParser());

app1.get('/', (req, res) => {
  res.sendFile(path.join(__dirname+'/client/index.html'));
});


app1.post('/send', async (req, res) => {
  // HOW TO AUTHENTICATE
  const sessionClient = new dialogflow.SessionsClient({
    keyFilename: 'MyTestBot-462d48e95485.json'
  });
  // const sessionPath = sessionClient.sessionPath(projectId, sessionId);

  // if you will run bot client from other server- you should be care with CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); // If needed
  res.setHeader('Access-Control-Allow-Credentials', true); // If needed

  const { event, text, context_id } = req.body;
  console.log('. . . INCOMING:', JSON.stringify(req.body, null, 4));

  // A unique identifier for the given session
  const sessionId = uuid.v4();

  // Create a new session
  // const sessionClient = new dialogflow.SessionsClient();

  const sessionPath = sessionClient.sessionPath(projectId, sessionId);
  console.log('client ',sessionClient, 'path ', sessionPath);
  // The text query request.
  const request = {
    session: sessionPath,
    queryInput: {}
  };

  if (event) {
    request.queryInput.event = {
      name: event,
      languageCode: 'en-US'
    };
  }

  if (text) {
    request.queryInput.text = {
      text: text,
      languageCode: 'en-US'
    };
  }

  if (context_id) {
    request.queryParams = {
      contexts: [await createContext(sessionId, context_id)]
    };
  }

  console.log('. . . REQUEST:', JSON.stringify(request, null, 4) );


  const responses = await sessionClient.detectIntent(request);

  console.log('Detected intent');
  const result = responses[0].queryResult;
  console.log(`  Query: ${result.queryText}`);
  console.log(`  Response: ${result.fulfillmentText}`);
  if (result.intent) {
    console.log(`  Intent: ${result.intent.displayName}`);
  } else {
    console.log('No intent matched.');
  }

  res.json(responses);
});

app1.listen(port, () => {
  console.log(`. . . app listening on port ${port}`);
});
