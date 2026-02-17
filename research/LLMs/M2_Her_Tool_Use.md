# M2-her Tool Use & Function Calling

## Overview

M2-her inherits full agentic capabilities from the M2 family while maintaining dialogue optimization. This means you can have **characters that talk naturally AND execute tools** (calendar events, API calls, data retrieval, etc.) without switching models.

---

## Function Schema Definition

### Basic Structure

All tools follow the OpenAI-compatible function schema:

```json
{
  "type": "function",
  "function": {
    "name": "function_name",
    "description": "What this function does",
    "parameters": {
      "type": "object",
      "properties": {
        "param_name": {
          "type": "string|number|boolean|array",
          "description": "What this parameter is for",
          "enum": ["option1", "option2"] // optional
        }
      },
      "required": ["mandatory_params"]
    }
  }
}
```

### Key Fields

| Field | Purpose | Example |
|-------|---------|---------|
| `type` | Always "function" | "function" |
| `name` | Function identifier (snake_case) | "create_calendar_event" |
| `description` | What the function does | "Creates an event in the user's calendar" |
| `properties` | Parameter definitions | Object with each param spec |
| `required` | Mandatory parameters | Array of parameter names |

---

## Complete Function Examples

### Example 1: Calendar Event Creation

```json
{
  "type": "function",
  "function": {
    "name": "create_calendar_event",
    "description": "Create a new event in the user's calendar",
    "parameters": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "Event title/name"
        },
        "date": {
          "type": "string",
          "description": "Event date in YYYY-MM-DD format"
        },
        "start_time": {
          "type": "string",
          "description": "Event start time in HH:MM format (24-hour)"
        },
        "end_time": {
          "type": "string",
          "description": "Event end time in HH:MM format (24-hour)"
        },
        "description": {
          "type": "string",
          "description": "Event description or notes"
        },
        "location": {
          "type": "string",
          "description": "Physical or virtual location"
        },
        "attendees": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Email addresses of attendees to invite"
        },
        "calendar": {
          "type": "string",
          "enum": ["work", "personal", "shared"],
          "description": "Which calendar to add event to"
        }
      },
      "required": ["title", "date", "start_time"]
    }
  }
}
```

### Example 2: Web Search

```json
{
  "type": "function",
  "function": {
    "name": "web_search",
    "description": "Search the web for information",
    "parameters": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "Search query"
        },
        "max_results": {
          "type": "number",
          "description": "Maximum number of results to return (1-10)",
          "default": 5
        },
        "date_range": {
          "type": "string",
          "enum": ["past_day", "past_week", "past_month", "past_year", "any"],
          "description": "Limit results to a specific time period"
        }
      },
      "required": ["query"]
    }
  }
}
```

### Example 3: Send Message/Notification

```json
{
  "type": "function",
  "function": {
    "name": "send_message",
    "description": "Send a message or notification to a user or channel",
    "parameters": {
      "type": "object",
      "properties": {
        "recipient": {
          "type": "string",
          "description": "User ID, email, or channel name"
        },
        "message": {
          "type": "string",
          "description": "Message content"
        },
        "message_type": {
          "type": "string",
          "enum": ["email", "sms", "slack", "in_app"],
          "description": "How to send the message"
        },
        "urgent": {
          "type": "boolean",
          "description": "Mark as high priority"
        }
      },
      "required": ["recipient", "message", "message_type"]
    }
  }
}
```

### Example 4: Data Query/Retrieval

```json
{
  "type": "function",
  "function": {
    "name": "query_database",
    "description": "Query data from the system database",
    "parameters": {
      "type": "object",
      "properties": {
        "table": {
          "type": "string",
          "enum": ["users", "events", "projects", "tasks"],
          "description": "Which table to query"
        },
        "filter": {
          "type": "object",
          "description": "Filter conditions (key-value pairs)"
        },
        "limit": {
          "type": "number",
          "description": "Maximum rows to return"
        }
      },
      "required": ["table"]
    }
  }
}
```

---

## API Request with Tools

### Request Structure

```json
{
  "model": "minimax-m2-her",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant that can manage calendars and tasks."
    },
    {
      "role": "user",
      "content": "Add a meeting with the team on Friday at 2pm for 1 hour"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "create_calendar_event",
        "description": "Create a new calendar event",
        "parameters": {
          "type": "object",
          "properties": {
            "title": { "type": "string" },
            "date": { "type": "string" },
            "start_time": { "type": "string" },
            "end_time": { "type": "string" }
          },
          "required": ["title", "date", "start_time", "end_time"]
        }
      }
    }
  ],
  "temperature": 0.7,
  "max_tokens": 500
}
```

### Response with Tool Call

```json
{
  "id": "chatcmpl-abc123",
  "model": "minimax-m2-her",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "<think>The user wants a team meeting on Friday at 2pm for 1 hour. I need to determine the date (next Friday) and call the create_calendar_event function.</think>\n\nI'll schedule that team meeting for you right away.",
        "tool_calls": [
          {
            "id": "call_abc123",
            "type": "function",
            "function": {
              "name": "create_calendar_event",
              "arguments": "{\"title\": \"Team Meeting\", \"date\": \"2026-02-13\", \"start_time\": \"14:00\", \"end_time\": \"15:00\"}"
            }
          }
        ]
      }
    }
  ]
}
```

---

## Tool Response Handling (Multi-Turn)

### The Tool Call Loop

```
1. Send request with user message + available tools
   ↓
2. Model returns response with tool_calls
   ↓
3. Execute the tool(s)
   ↓
4. Return tool results to model
   ↓
5. Model generates final response with context
```

### Handling Tool Results

When the model calls a tool, you **must return the results** in a special format:

```json
{
  "model": "minimax-m2-her",
  "messages": [
    // ... previous conversation ...
    {
      "role": "user",
      "content": "Add a meeting with the team on Friday at 2pm for 1 hour"
    },
    {
      "role": "assistant",
      "content": "<think>...</think>\n\nI'll schedule that team meeting for you right away.",
      "tool_calls": [
        {
          "id": "call_abc123",
          "type": "function",
          "function": {
            "name": "create_calendar_event",
            "arguments": "{\"title\": \"Team Meeting\", \"date\": \"2026-02-13\", \"start_time\": \"14:00\", \"end_time\": \"15:00\"}"
          }
        }
      ]
    },
    {
      "role": "tool",
      "tool_call_id": "call_abc123",
      "name": "create_calendar_event",
      "content": "{\"success\": true, \"event_id\": \"evt_12345\", \"message\": \"Event created successfully\"}"
    }
  ],
  "tools": [ /* same tools array */ ]
}
```

### Key Points

- **Include the full previous assistant message** with tool_calls
- **Add a tool result message** with matching tool_call_id
- **Tool result is a message with role: "tool"**
- **Model then generates final response** with this context

---

## Sample Messages Guiding Tool Use

### Pattern 1: Simple Tool Call

```json
{
  "role": "sample_message_user",
  "content": "Can you add a reminder for my dentist appointment next Tuesday at 10am?"
}
```

```json
{
  "role": "sample_message_ai",
  "content": "I'll create that reminder for you. Setting up a dentist appointment for Tuesday at 10am.\n\n[Tool: create_calendar_event with title='Dentist Appointment', date='2026-02-18', start_time='10:00']"
}
```

### Pattern 2: Conditional Tool Use

```json
{
  "role": "sample_message_user",
  "content": "What meetings do I have scheduled for tomorrow?"
}
```

```json
{
  "role": "sample_message_ai",
  "content": "Let me check your calendar for tomorrow.\n\n[Tool: query_calendar with date='2026-02-10']\n\nYou have three meetings scheduled: 9am standup, 2pm project review, and 4pm one-on-one."
}
```

### Pattern 3: Multi-Step Tool Use

```json
{
  "role": "sample_message_user",
  "content": "I need to reschedule my 2pm meeting to 4pm and notify attendees"
}
```

```json
{
  "role": "sample_message_ai",
  "content": "I'll reschedule that meeting and notify everyone.\n\n[Tool: update_calendar_event with event_id, new_time='16:00']\n[Tool: send_message to attendees with notification]\n\nDone! The meeting has been moved to 4pm and I've sent notifications to all attendees."
}
```

---

## Implementation Pattern: Conversation with Tools

### Node.js Example

```javascript
class M2HerWithTools {
  constructor(systemRole, userSystemRole, tools) {
    this.systemRole = systemRole;
    this.userSystemRole = userSystemRole;
    this.tools = tools;
    this.history = [
      { role: 'system', content: systemRole }
    ];
    if (userSystemRole) {
      this.history.push({ role: 'user_system', content: userSystemRole });
    }
  }

  async send(userMessage, toolExecutor) {
    // Add user message
    this.history.push({
      role: 'user',
      content: userMessage
    });

    // Call API with tools
    let response = await this.callAPI();

    // Check if model called tools
    while (response.tool_calls && response.tool_calls.length > 0) {
      // Add assistant message with tool calls
      this.history.push({
        role: 'assistant',
        content: response.content,
        tool_calls: response.tool_calls
      });

      // Execute tools
      const toolResults = await Promise.all(
        response.tool_calls.map(async (call) => {
          const result = await toolExecutor.execute(
            call.function.name,
            JSON.parse(call.function.arguments)
          );

          return {
            role: 'tool',
            tool_call_id: call.id,
            name: call.function.name,
            content: JSON.stringify(result)
          };
        })
      );

      // Add tool results
      this.history.push(...toolResults);

      // Get follow-up response from model with tool results
      response = await this.callAPI();
    }

    // Add final assistant response
    if (response.content) {
      this.history.push({
        role: 'assistant',
        content: response.content
      });
    }

    return response.content;
  }

  async callAPI() {
    const axios = require('axios');

    try {
      const apiResponse = await axios.post(
        'https://api.minimax.io/v1/text/chatcompletion_v2',
        {
          model: 'minimax-m2-her',
          messages: this.history,
          tools: this.tools,
          temperature: 0.8,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const choice = apiResponse.data.choices[0];
      return {
        content: choice.message.content,
        tool_calls: choice.message.tool_calls || []
      };
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  }
}
```

### Usage

```javascript
// Define tools
const tools = [
  {
    type: 'function',
    function: {
      name: 'create_calendar_event',
      description: 'Create a calendar event',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          date: { type: 'string' },
          start_time: { type: 'string' },
          end_time: { type: 'string' }
        },
        required: ['title', 'date', 'start_time', 'end_time']
      }
    }
  }
];

// Create tool executor
class ToolExecutor {
  async execute(toolName, args) {
    if (toolName === 'create_calendar_event') {
      // Actually create event in your calendar system
      return {
        success: true,
        event_id: 'evt_123',
        message: `Event "${args.title}" created for ${args.date} at ${args.start_time}`
      };
    }
  }
}

// Use it
const conversation = new M2HerWithTools(
  'You are a helpful assistant that can manage calendars',
  'You are asking for help scheduling meetings',
  tools
);

const toolExecutor = new ToolExecutor();
const response = await conversation.send(
  'Add a meeting on Friday at 2pm',
  toolExecutor
);

console.log(response);
// Output: "Done! I've scheduled the meeting for Friday at 2pm"
```

---

## Character-Based Tool Use

### Designing Characters That Use Tools

**Pattern: Assistant with Personality**

```json
{
  "role": "system",
  "content": "You are Ada, a capable executive assistant with a warm personality. You're organized, proactive, and speak with professional confidence. You can manage calendars, send messages, and retrieve information. When handling tasks, you explain what you're doing in a natural, conversational way."
}
```

This lets M2-her:
- Maintain Ada's distinct personality
- Call calendar tools when needed
- Explain tool usage conversationally

### Example Interaction

**User:** "Ada, I need to block off time for the Q1 planning session next week"

**Ada's Response:**
```
<think>
The user wants to block time for Q1 planning next week. I need to:
1. Figure out what "next week" means (specific date)
2. Determine an appropriate duration for a planning session
3. Create the calendar event with a clear title

I should ask for clarification on the exact day and time, or suggest something reasonable.
</think>

I'd be happy to help with that! To get this on your calendar, I need a couple of details:
- Which day next week works best? (Monday-Friday)
- How long should I block off? (Usually 2-3 hours for planning?)

Once you let me know, I'll get it scheduled right away.
```

**User:** "Thursday, 2 hours, starting at 10am"

**Ada's Response:**
```
<think>
Perfect. Next Thursday (Feb 13) from 10am to 12pm for Q1 planning. I'll create that event now.
</think>

Got it! Creating a 2-hour Q1 planning session for Thursday at 10am.

[Tool: create_calendar_event with:
  title: "Q1 Planning Session"
  date: "2026-02-13"
  start_time: "10:00"
  end_time: "12:00"
]

All set! I've blocked off Thursday from 10am to 12pm for your Q1 planning. Is there anything else you'd like me to add?
```

---

## Best Practices

### ✅ DO

- **Define clear, specific tool descriptions** — Help the model understand when to use each tool
- **Use required parameters** — Force the model to provide essential info
- **Include examples in samples** — Show how tools appear in responses
- **Handle errors gracefully** — Tool execution might fail; plan for it
- **Maintain character voice** — Even with tool calls, stay in character
- **Return complete tool results** — The model needs this to reason about next steps

### ❌ DON'T

- **Define vague tool names** — Be specific: not "do_thing", use "send_message"
- **Create tools for everything** — If something is informational, just tell the model
- **Skip sample messages** — Samples guide tool-calling behavior strongly
- **Forget to return full assistant message** — You must include the original tool_calls when returning results
- **Use tools for quick answers** — If you can answer without a tool, do that instead
- **Ignore rate limiting** — Tool execution can hit rate limits

---

## Limitations & Considerations

| Aspect | Details |
|--------|---------|
| **Max Tools** | 128 function definitions per request |
| **Thinking** | Model uses `<think>...</think>` tags; these count toward tokens |
| **Tool ID Matching** | Must match tool_call_id exactly when returning results |
| **Cost** | Tool calls and results count as tokens (can increase costs) |
| **Execution Time** | Model must wait for tool results before continuing |
| **Error Handling** | Model adapts to tool failures based on result content |

---

## Testing Tool Integration

### Quick Test: Calendar Event

```bash
curl -X POST https://api.minimax.io/v1/text/chatcompletion_v2 \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "minimax-m2-her",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant that can create calendar events."
      },
      {
        "role": "user",
        "content": "Create a meeting next Tuesday at 3pm"
      }
    ],
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "create_calendar_event",
          "description": "Create a calendar event",
          "parameters": {
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "date": { "type": "string" },
              "start_time": { "type": "string" }
            },
            "required": ["title", "date", "start_time"]
          }
        }
      }
    ]
  }'
```

---

## Next Steps for Raven OS

- [ ] Define core tools needed for Raven OS (calendar, messaging, data query, etc.)
- [ ] Create tool library with standardized schemas
- [ ] Build tool executor that maps M2-her calls to real backend functions
- [ ] Design characters that naturally use tools without losing personality
- [ ] Implement error handling and graceful tool failure responses
- [ ] Test multi-step workflows (e.g., schedule + notify attendees)
- [ ] Monitor token usage with tool calls vs. without

---

## References

- [MiniMax Tool Use & Interleaved Thinking](https://platform.minimax.io/docs/guides/text-m2-function-call)
- [Tool Calling Guide](https://github.com/MiniMax-AI/MiniMax-M2/blob/main/docs/tool_calling_guide.md)
- [Function Calling OpenAI Schema](https://platform.openai.com/docs/guides/function-calling)
