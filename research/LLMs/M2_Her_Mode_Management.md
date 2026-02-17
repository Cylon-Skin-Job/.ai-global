# M2-her Mode Management & Context Isolation

## Research Foundation & Methodology

### Research Steps Taken

1. **Initial Query**: Searched for "LLM dynamic role switching mid-conversation system prompt context isolation"
   - Goal: Understand general LLM behavior around mode switching
   - Findings: Models trained with static system messages; mid-conversation changes can cause drift

2. **Model-Specific Query**: Searched for "MiniMax M2 conversation mode switching change system role behavior consistency"
   - Goal: Understand M2-her's specific capabilities and limitations
   - Findings: M2-her has "strict voice/identity separation" but isn't immune to confusion

3. **Synthesis**: Combined general LLM principles with M2-her's specific strengths to develop practical patterns

### Key Sources Referenced

- [GitHub Community Discussion: LLM Context in Multi-Turn Conversations](https://github.com/orgs/community/discussions/163655)
- [LangChain: Context Engineering in Agents](https://docs.langchain.com/oss/python/langchain/context-engineering)
- [Medium: LLM ChatCompletion System Prompt Inconsistency](https://medium.com/@vaibkumr/llm-chatcompletion-system-prompt-inconsistency-issue-how-to-improve-conversational-rag-systems-e3a391252629)
- [WaterCrawl: Role Prompting for LLMs](https://watercrawl.dev/blog/Role-Prompting)
- [ArXiv: LLMs Get Lost in Multi-Turn Conversations](https://arxiv.org/html/2505.06120v1)
- [Clarifai: Agentic Prompt Engineering](https://www.clarifai.com/blog/agentic-prompt-engineering)
- [MiniMax Official: M2-her Deep Dive](https://www.minimax.io/news/a-deep-dive-into-the-minimax-m2-her-2)

---

## The Challenge: Mode Switching in M2-her

### The Problem

When you change system/user_system roles mid-conversation:

```
Turn 1-5 (Calendar Mode):
  System: "You are a calendar assistant"
  Sample: "Create events, manage schedules"
  History: "I scheduled your meeting"

Turn 6 (Database Mode - system changed):
  System: "You are a database expert"
  History: Still includes "I scheduled your meeting"
  Conflict: Model sees two conflicting signals
  Result: Possible behavior drift or confusion
```

### Why It Happens

- **Training Data**: M2-her was trained with static system messages (same system role for entire conversations)
- **In-Context Learning**: The model learns from ALL history, including old mode behavior
- **Sample Influence**: Old samples from previous modes can influence new mode behavior
- **Consistency Drive**: M2-her's design optimizes for consistency, which can lock in old mode patterns

### M2-her's Advantages

Despite this, M2-her handles this better than many models because:
- Specifically trained for "strict voice/identity separation"
- Strong long-conversation stability (maintains quality past turn 20)
- Capable of learning new patterns from samples in current mode

---

## Solutions: Four Architectural Approaches

### Approach 1: Explicit Mode Markers (Recommended for Simplicity)

**Strategy**: Tell the model clearly which mode it's in and that it should ignore previous modes.

**Implementation**:

```json
{
  "role": "system",
  "content": "You are Ada, an adaptive executive assistant. You maintain the same warm, professional personality across all modes.\n\n**ACTIVE MODE: CALENDAR_MANAGEMENT**\n\nIn this mode, your focus is exclusively on scheduling, calendar events, and time management. Ignore any previous database queries or data analysis tasks. Use calendar tools only. Sample behavior: Confirm meeting details before creating events."
}
```

When switching modes:

```json
{
  "role": "system",
  "content": "You are Ada, an adaptive executive assistant. You maintain the same warm, professional personality across all modes.\n\n**ACTIVE MODE: DATABASE_QUERIES**\n\nIn this mode, your focus is exclusively on data retrieval, analysis, and reporting. Ignore any previous calendar scheduling tasks. Use database tools only. Sample behavior: Ask clarifying questions about data requirements."
}
```

**Pros:**
- Simple to implement
- Clear mode transitions
- Single conversation stream (no history isolation needed)

**Cons:**
- Model must reconcile old history with new mode
- Longer conversations may accumulate confusion
- Tokens spent on mode reminders

**Best For**: Short to medium conversations (under 20 turns per mode)

---

### Approach 2: Conversation Summarization at Mode Boundaries

**Strategy**: Summarize what happened in the previous mode, then start fresh.

**Implementation**:

```json
[
  { "role": "system", "content": "You are Ada..." },
  // ... turns 1-5 in Calendar Mode ...
  {
    "role": "assistant",
    "content": "Is there anything else you'd like to schedule?"
  },
  // Mode transition point
  {
    "role": "user",
    "content": "No more calendar work. I need database analysis now.\n\n**Summary of Previous Work**: Scheduled 3 meetings for this week. Q1 planning is Friday 10am-12pm.\n\n**New Task**: Analyze revenue by region for Q1."
  }
]
```

This way:
- Old history is preserved but summarized
- Model knows previous mode is done
- Clear boundary marker

**Pros:**
- Maintains context continuity
- Clear mode boundaries
- Compact representation of previous mode

**Cons:**
- Requires manual summarization
- Tokens spent on summary
- Two-phase response (old mode confirmation + new mode answer)

**Best For**: Medium conversations with 2-3 mode switches

---

### Approach 3: Separate Conversation Histories Per Mode (Recommended for Production)

**Strategy**: Keep isolated conversation histories, share state explicitly.

**Implementation**:

```javascript
class M2HerModeManager {
  constructor(characterName, basePersonality) {
    this.character = characterName;
    this.basePersonality = basePersonality;
    this.currentMode = null;
    this.modeHistories = {};      // Separate history per mode
    this.sharedState = {};         // Shared across modes
  }

  switchMode(modeName, modeConfig) {
    this.currentMode = modeName;

    // Create new history for this mode if first time
    if (!this.modeHistories[modeName]) {
      this.modeHistories[modeName] = [
        {
          role: 'system',
          content: this.buildSystemPrompt(modeName, modeConfig)
        },
        {
          role: 'user_system',
          content: modeConfig.userRole
        }
      ];

      // Add shared context as first message
      if (Object.keys(this.sharedState).length > 0) {
        this.modeHistories[modeName].push({
          role: 'user',
          content: `[Shared Context from Previous Modes]\n${this.formatSharedState()}`
        });
        this.modeHistories[modeName].push({
          role: 'assistant',
          content: 'I understand. I have the context from your previous work. Ready to help with ' + modeName + '.'
        });
      }
    }

    return this.modeHistories[modeName];
  }

  buildSystemPrompt(modeName, modeConfig) {
    return `You are ${this.character}. ${this.basePersonality}

**OPERATING MODE: ${modeName.toUpperCase()}**
${modeConfig.description}

**Tools available in this mode**: ${modeConfig.tools.join(', ')}
**Sample interaction pattern**: ${modeConfig.sampleBehavior}

Do not perform tasks from other modes. Each mode has different tools and objectives.`;
  }

  formatSharedState() {
    return Object.entries(this.sharedState)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join('\n');
  }

  async send(userMessage) {
    const history = this.modeHistories[this.currentMode];

    // Call API with mode-specific history only
    const response = await this.callAPI(history, userMessage);

    // Record in mode-specific history
    history.push({ role: 'user', content: userMessage });
    history.push({ role: 'assistant', content: response });

    return response;
  }

  updateSharedState(key, value) {
    this.sharedState[key] = value;
  }

  getModeHistory() {
    return this.modeHistories[this.currentMode];
  }

  getAllModes() {
    return Object.keys(this.modeHistories);
  }
}
```

**Usage Example**:

```javascript
const ada = new M2HerModeManager(
  'Ada',
  'You are professional, warm, and highly organized.'
);

// --- CALENDAR MODE ---
ada.switchMode('calendar', {
  description: 'Manage schedules and create calendar events',
  userRole: 'You need help organizing your weekly schedule',
  tools: ['create_calendar_event', 'query_calendar', 'update_event'],
  sampleBehavior: 'Confirm times and attendees before creating'
});

await ada.send('Schedule Q1 planning for Friday at 10am');
// Response focuses on calendar work only

ada.updateSharedState('q1_planning_date', '2026-02-13 10:00');

// --- SWITCH TO DATABASE MODE ---
ada.switchMode('database', {
  description: 'Query and analyze business data',
  userRole: 'You want insights from your company data',
  tools: ['query_database', 'aggregate_data', 'export_results'],
  sampleBehavior: 'Ask what metrics matter most'
});

await ada.send('Show me Q1 revenue by product');
// Response focuses on database work
// Ada remembers: 'q1_planning_date: 2026-02-13 10:00'
// But doesn't reference calendar operations

// --- BACK TO CALENDAR MODE ---
ada.switchMode('calendar', null); // null = reuse previous config
await ada.send('When is my Q1 planning again?');
// Response draws from calendar history
// Knows Q1 planning is Friday 10am (from shared state)
```

**Pros:**
- **No confusion**: Each mode has isolated history
- **Clean mode switching**: Model never sees old mode operations
- **Scalable**: Works with many mode switches
- **State sharing**: Can reference facts from previous modes
- **Token efficient**: No mode reminders needed

**Cons:**
- More complex implementation
- Need to manage shared state carefully
- Must explicitly pass relevant context between modes

**Best For**: Production systems with frequent mode switches (Raven OS recommendation)

---

### Approach 4: Separate Chat Sessions Per Mode (Maximum Isolation)

**Strategy**: Different session IDs per mode; only context bridge is API calls.

**Implementation**:

```javascript
class MultiModeConversationBridge {
  constructor(character, basePersonality) {
    this.character = character;
    this.basePersonality = basePersonality;
    this.sessions = {};
    this.sharedMemory = {};
  }

  createSession(modeName, modeConfig) {
    this.sessions[modeName] = {
      id: `session_${modeName}_${Date.now()}`,
      history: [
        {
          role: 'system',
          content: `${this.basePersonality}\n\nMode: ${modeName}\n${modeConfig.description}`
        }
      ],
      config: modeConfig
    };
  }

  async send(modeName, userMessage) {
    const session = this.sessions[modeName];
    if (!session) throw new Error(`Session ${modeName} not found`);

    // Inject shared memory into user message
    const enrichedMessage = `${userMessage}\n\n[Shared Memory: ${JSON.stringify(this.sharedMemory)}]`;

    session.history.push({ role: 'user', content: userMessage });
    const response = await this.callAPI(session.history, enrichedMessage);
    session.history.push({ role: 'assistant', content: response });

    // Extract any memory updates from response
    // (would need parsing logic)

    return response;
  }
}
```

**Pros:**
- **Absolute isolation**: No cross-mode confusion possible
- **Clearest behavior**: Each mode is completely independent

**Cons:**
- **Lost conversational flow**: Doesn't feel like one conversation
- **Complex state management**: Must manually maintain shared memory
- **User experience**: Mode switches feel jarring
- **High implementation overhead**

**Best For**: Completely unrelated tasks (e.g., scheduling vs. fiction writing)

---

## Recommended Pattern for Raven OS: Approach 3

**Why Approach 3 (Separate Histories) is Best:**

1. **Clean Mode Separation**: No history bleed between modes
2. **Natural Conversation**: Still feels like talking to Ada
3. **Scalable**: Works with unlimited modes
4. **State Sharing**: Ada remembers facts you told her
5. **Token Efficient**: No wasteful mode reminders
6. **M2-her Friendly**: Plays to the model's strengths (character consistency)

---

## Sample Behavior Across Modes

### Critical: Update Samples with Mode

**Calendar Mode Sample**:
```json
{
  "role": "sample_message_user",
  "content": "Add a meeting Friday at 2pm"
},
{
  "role": "sample_message_ai",
  "content": "*nods* I'll create that. How long should I block off? [Tool: create_calendar_event]"
}
```

**Database Mode Sample** (same character, different samples):
```json
{
  "role": "sample_message_user",
  "content": "Show me Q1 revenue"
},
{
  "role": "sample_message_ai",
  "content": "I'll query that for you. Should I break it down by product or region? [Tool: query_database]"
}
```

The model learns from samples, so **always update samples when switching modes**. Old samples can leak into new mode behavior.

---

## Implementation Checklist

### For Raven OS Integration

- [ ] Define all modes your characters will operate in
- [ ] Create mode configuration objects (tools, descriptions, samples)
- [ ] Build M2HerModeManager class (copy from Approach 3)
- [ ] Design shared state schema (what facts persist across modes)
- [ ] Define mode switching triggers (user request? automatic?)
- [ ] Create sample messages for each mode per character
- [ ] Test mode transitions with sample conversations
- [ ] Monitor for behavior drift (logging/monitoring)
- [ ] Build UI to show current mode to user

---

## Common Pitfalls & How to Avoid Them

| Pitfall | Problem | Solution |
|---------|---------|----------|
| **Forgetting to change samples** | Old mode behavior leaks into new mode | Always update samples when switching |
| **Shared state gets polluted** | Unrelated facts from old modes confuse new mode | Design careful shared state schema |
| **Mode switch feels jarring** | User doesn't understand why behavior changed | Make mode switches explicit and visible |
| **Too many mode switches** | Model gets overwhelmed tracking modes | Keep mode switches purposeful (fewer, longer) |
| **History gets too long** | Tokens wasted, performance degrades | Archive old mode history if needed |
| **Shared state gets stale** | Facts from 20 turns ago aren't relevant | Periodically clean up or prioritize shared state |

---

## Testing Mode Switches

### Test Conversation

```
MODE 1: INFORMATION_GATHERING
User: "What's our Q1 revenue target?"
Ada: "Let me check. [Tool: query_database] Our Q1 target is $2M."
[Shared State: q1_revenue_target = $2M]

MODE SWITCH → SCHEDULING

User: "Add a meeting to discuss Q1 results"
Ada: "I'll schedule that. When works? [asks for time, doesn't reference database queries]"
User: "Friday at 10am"
Ada: "[Tool: create_calendar_event]"
[Shared State: now includes q1_meeting_date = Friday 10am]

MODE SWITCH → BACK TO DATABASE

User: "By the way, how are we tracking toward that Q1 goal?"
Ada: "[Tool: query_database] We're 60% toward the $2M target."
[Remembers target from earlier via shared state, uses database tool]
[Does NOT try to reference calendar from previous mode]
```

**Expected Behavior**:
- ✅ Ada maintains personality across modes
- ✅ No reference to calendar operations while in database mode
- ✅ Shared state (Q1 target) persists and is used appropriately
- ✅ Correct tools used for each mode
- ❌ NOT: "I remember scheduling a meeting, so let me help with that database query"

---

## Staleness Monitoring

See **M2_Her_Context.md** for how to check this documentation for staleness and what to verify.

---

## Summary

For Raven OS, implement **Approach 3: Separate Conversation Histories Per Mode** with:

1. **Mode Manager Class**: Isolates conversation histories per mode
2. **Shared State Bridge**: Facts and decisions persist across modes
3. **Per-Mode Samples**: Different samples for different modes
4. **Clear System Prompts**: Explicit mode indication prevents confusion
5. **Explicit Transitions**: User knows when switching modes

This gives you the best of both worlds:
- **No Mode Confusion**: Each mode has clean history
- **Natural Conversation**: Still feels like talking to one character
- **Rich Context**: Ada remembers important facts from previous modes
- **Scalable Design**: Works with 2 modes or 20 modes

---

## References & Further Reading

- [GitHub Discussion: LLM Context in Multi-Turn](https://github.com/orgs/community/discussions/163655)
- [LangChain Context Engineering](https://docs.langchain.com/oss/python/langchain/context-engineering)
- [ArXiv: LLMs Get Lost in Multi-Turn Conversations](https://arxiv.org/html/2505.06120v1)
- [MiniMax M2-her Official Deep Dive](https://www.minimax.io/news/a-deep-dive-into-the-minimax-m2-her-2)
