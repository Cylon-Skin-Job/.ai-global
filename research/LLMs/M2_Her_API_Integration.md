# M2-her API Integration Guide

## API Basics

### Endpoint
```
POST https://api.minimax.io/v1/text/chatcompletion_v2
```

### Authentication
```
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

---

## Request Structure

### Minimal Request

```json
{
  "model": "minimax-m2-her",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ]
}
```

### Full-Featured Request

```json
{
  "model": "minimax-m2-her",
  "messages": [
    {
      "role": "system",
      "content": "You are Captain Vera, a retired naval commander turned tavern keeper."
    },
    {
      "role": "user_system",
      "content": "You are a merchant captain seeking crew for a dangerous expedition."
    },
    {
      "role": "group",
      "content": "tavern_docks_district_night"
    },
    {
      "role": "sample_message_user",
      "content": "Captain Vera, I need sailors who won't turn yellow when things get rough."
    },
    {
      "role": "sample_message_ai",
      "content": "*sets down a tankard with a knowing smirk* The question isn't what kind of crew I can recommend—it's what kind of captain can keep 'em alive."
    },
    {
      "role": "user",
      "name": "merchant_captain",
      "content": "I'm charting a route through the Crimson Strait. We leave in a fortnight."
    }
  ],
  "temperature": 0.8,
  "top_p": 0.95,
  "max_tokens": 500,
  "stream": false
}
```

---

## Request Parameters

### Required

| Parameter | Type | Description |
|-----------|------|-------------|
| `model` | string | Must be `"minimax-m2-her"` |
| `messages` | array | Array of message objects with roles and content |

### Optional

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `temperature` | float | 0.8 | Controls randomness (0.0-2.0). Lower = more deterministic. |
| `top_p` | float | 0.95 | Nucleus sampling (0.0-1.0). Controls diversity. |
| `max_tokens` | int | 1024 | Maximum tokens in response. |
| `stream` | boolean | false | If true, returns streaming response. |

### Temperature Guidance

- **0.3-0.5**: Focused, consistent (good for factual responses)
- **0.7-0.9**: Balanced (good for roleplay, default = 0.8)
- **1.0+**: Creative, varied (good for brainstorming)

For M2-her roleplay, **0.7-0.9 is typically optimal**.

---

## Response Structure

### Successful Response

```json
{
  "id": "chatcmpl-abc123xyz",
  "created": 1707419234,
  "model": "minimax-m2-her",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "*leans back in her chair* Crimson Strait? That's not a route—that's a death wish. You'd need a crew of madmen or desperados."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 287,
    "completion_tokens": 42,
    "total_tokens": 329
  }
}
```

### Key Response Fields

| Field | Description |
|-------|-------------|
| `choices[0].message.content` | The actual response text from the model |
| `usage.prompt_tokens` | Tokens used in your request |
| `usage.completion_tokens` | Tokens generated in the response |
| `usage.total_tokens` | Total cost (prompt + completion) |
| `finish_reason` | Why generation stopped (usually "stop") |

---

## Error Handling

### Common Errors

**401 Unauthorized**
```json
{
  "error": {
    "message": "Invalid API key",
    "type": "invalid_request_error"
  }
}
```
*Solution: Check your API key in the Authorization header*

**429 Rate Limited**
```json
{
  "error": {
    "message": "Rate limit exceeded",
    "type": "rate_limit_error"
  }
}
```
*Solution: Implement exponential backoff between retries*

**400 Bad Request**
```json
{
  "error": {
    "message": "Invalid message role: 'user_system'",
    "type": "invalid_request_error"
  }
}
```
*Solution: Verify all roles are spelled correctly (user_system, sample_message_user, etc.)*

---

## Implementation Patterns

### Pattern 1: Basic Synchronous Call (Node.js)

```javascript
const axios = require('axios');

async function callM2Her(messages) {
  try {
    const response = await axios.post(
      'https://api.minimax.io/v1/text/chatcompletion_v2',
      {
        model: 'minimax-m2-her',
        messages: messages,
        temperature: 0.8,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
}
```

### Pattern 2: With Retry Logic

```javascript
async function callM2HerWithRetry(messages, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await callM2Her(messages);
    } catch (error) {
      lastError = error;

      if (error.response?.status === 429) {
        // Rate limited: exponential backoff
        const delayMs = Math.pow(2, attempt) * 1000;
        console.log(`Rate limited. Waiting ${delayMs}ms before retry...`);
        await new Promise(r => setTimeout(r, delayMs));
      } else if (error.response?.status >= 500) {
        // Server error: retry with backoff
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        await new Promise(r => setTimeout(r, delayMs));
      } else {
        // Client error: don't retry
        throw error;
      }
    }
  }

  throw lastError;
}
```

### Pattern 3: Streaming Response

```javascript
async function callM2HerStreaming(messages, onChunk) {
  const response = await axios.post(
    'https://api.minimax.io/v1/text/chatcompletion_v2',
    {
      model: 'minimax-m2-her',
      messages: messages,
      stream: true,
      temperature: 0.8
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: 'stream'
    }
  );

  return new Promise((resolve, reject) => {
    let fullText = '';

    response.data.on('data', (chunk) => {
      // Parse streaming format: data: {json}
      const lines = chunk.toString().split('\n');

      lines.forEach(line => {
        if (line.startsWith('data: ')) {
          try {
            const json = JSON.parse(line.slice(6));
            const content = json.choices[0].delta?.content || '';
            fullText += content;
            if (onChunk) onChunk(content);
          } catch (e) {
            // Skip non-JSON lines
          }
        }
      });
    });

    response.data.on('end', () => resolve(fullText));
    response.data.on('error', reject);
  });
}
```

---

## Conversation Management

### Building a Stateful Conversation

```javascript
class M2HerConversation {
  constructor(systemRole, userSystemRole, groupContext) {
    this.history = [
      { role: 'system', content: systemRole },
      { role: 'user_system', content: userSystemRole },
      { role: 'group', content: groupContext }
    ];
  }

  addSampleConversation(userSample, aiSample) {
    this.history.push(
      { role: 'sample_message_user', content: userSample },
      { role: 'sample_message_ai', content: aiSample }
    );
  }

  async send(userMessage) {
    // Add current user message
    this.history.push({
      role: 'user',
      content: userMessage
    });

    // Call API
    const response = await callM2Her(this.history);

    // Add assistant response to history
    this.history.push({
      role: 'assistant',
      content: response
    });

    return response;
  }

  getHistory() {
    return this.history;
  }

  reset() {
    // Reset while keeping system context
    const systemContext = this.history.slice(0, 3);
    this.history = systemContext;
  }
}
```

### Usage

```javascript
const conversation = new M2HerConversation(
  "You are Captain Vera, a tavern keeper.",
  "You are a merchant captain.",
  "tavern_docks_night"
);

conversation.addSampleConversation(
  "Tell me about your tavern.",
  "*polishes a glass* Been here twenty years. It's an honest place."
);

const response = await conversation.send("What's the best crew you know?");
console.log(response);
```

---

## Pricing & Tokens

### Cost Model

- **Input tokens**: $0.30 per million (¥2.1 per million)
- **Output tokens**: $1.20 per million (¥8.4 per million)

### Estimating Costs

**Rough token counts:**
- 1 word ≈ 1.3 tokens
- 1 character ≈ 0.25 tokens
- Sample messages: typically 50-200 tokens
- System/user_system: typically 50-150 tokens each

**Example calculation:**
```
System: 100 tokens × $0.30 / 1M = $0.00003
User_system: 80 tokens × $0.30 / 1M = $0.000024
Sample pair: 150 tokens × $0.30 / 1M = $0.000045
History: 500 tokens × $0.30 / 1M = $0.00015
User message: 30 tokens × $0.30 / 1M = $0.000009
Total input: 860 tokens ≈ $0.00026

Average response: 150 tokens × $1.20 / 1M = $0.00018

Total: ~$0.00044 per request
```

---

## Best Practices

1. **Reuse system context** — Don't rebuild entire message array each turn
2. **Limit conversation history** — Very long histories get expensive
3. **Use streaming for long responses** — Better UX and perceives faster
4. **Implement retry logic** — Network failures happen
5. **Monitor token usage** — Track via response.usage
6. **Sample messages are powerful** — Use them to enforce consistent behavior
7. **Temperature matters** — Adjust for dialogue consistency vs. creativity
8. **Cache API responses** — Identical requests should be cached

---

## Testing

### Quick Test

```bash
curl -X POST https://api.minimax.io/v1/text/chatcompletion_v2 \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "minimax-m2-her",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello"}
    ]
  }'
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Response doesn't match sample tone | Ensure sample_ai comes right after sample_user |
| Character inconsistency | Add more history or use higher temp for stability |
| Responses feel generic | Strengthen system role description |
| API slow | Consider streaming or reducing max_tokens |
| High costs | Reduce sample message length or cache responses |

---

## Next Steps for Raven OS

- [ ] Secure API key management strategy
- [ ] Build conversation manager class
- [ ] Design prompt builder for character creation
- [ ] Implement token tracking/budgeting
- [ ] Create character template format
- [ ] Build UI for prompt testing
