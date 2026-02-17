# M2-her Prompt Structure: Complete Reference

## The Seven Message Roles

### 1. `system` — Model's Foundational Role
**Purpose:** Defines who the model is and how it should behave fundamentally.

**Example:**
```json
{
  "role": "system",
  "content": "You are Aldric, a grizzled tavern keeper with 30 years of experience. You speak plainly, use colloquialisms, and rarely trust strangers. You're protective of the people in your tavern."
}
```

**Key Points:**
- Sets character archetype and core personality
- Establishes communication style and values
- Usually goes first in the message array
- Persistent across the entire conversation

---

### 2. `user_system` — User's Role Definition
**Purpose:** Tells the model what role the user is playing. Critical for interactive roleplay.

**Example:**
```json
{
  "role": "user_system",
  "content": "You are an adventurer new to the kingdom, still learning its customs and dangers. You're cautious but brave, and you speak with curiosity."
}
```

**Key Points:**
- Defines the user's character, not the AI's
- Influences how the model should interact with the user
- Helps establish power dynamics and relationship context
- Can change between conversations

**Why It Matters:**
Without `user_system`, the model doesn't know the user's personality. With it, the model understands how to respond appropriately (e.g., speaking down to a novice vs. peer-to-peer with an expert).

---

### 3. `group` — Conversation Context
**Purpose:** Labels the scene, location, or context for the conversation.

**Example:**
```json
{
  "role": "group",
  "content": "tavern_scene_act1_evening"
}
```

**Key Points:**
- Provides environmental and situational context
- Can be a simple label or brief description
- Helps model understand narrative context
- Optional but recommended for consistency

**Usage:**
- Scene identifiers: "forest_ambush", "throne_room_formal"
- Group types: "intimate_conversation", "public_market"
- Narrative phases: "act1_exposition", "act2_climax"

---

### 4. `sample_message_user` — Example User Input
**Purpose:** Shows the model an example of how the user will communicate.

**Example:**
```json
{
  "role": "sample_message_user",
  "content": "I heard there's trouble in the Blackwood. What can you tell me?"
}
```

**Key Points:**
- Demonstrates user's communication style
- Should match the `user_system` persona
- Used for in-context few-shot learning
- Always paired with `sample_message_ai`

---

### 5. `sample_message_ai` — Example Model Response
**Purpose:** Shows how the model should respond given a sample user message.

**Example:**
```json
{
  "role": "sample_message_ai",
  "content": "*wipes a glass with a weathered cloth* Aye, trouble's puttin' it mildly. Three caravans didn't come back last month. Something's stirrin' out there in those woods, somethin' hungry and mean."
}
```

**Key Points:**
- Demonstrates desired response style and format
- Should align with the `system` role's personality
- Can include actions in asterisks, dialogue, descriptions
- Always follows a `sample_message_user`

**Critical Pattern:**
Sample pairs teach the model the **interaction contract**:
- User says X (style, tone, format)
- AI responds with Y (matching style, deepening roleplay)

---

### 6. `user` — Actual User Message
**Purpose:** The real message from the user in the current turn.

**Example:**
```json
{
  "role": "user",
  "name": "adventurer",
  "content": "Is it dangerous for someone like me?"
}
```

**Key Points:**
- Standard LLM role
- `name` field is optional but recommended for clarity
- Alternates with `assistant` in conversation history
- Only one `user` message should be last in the array (the current turn)

---

### 7. `assistant` — Model's Previous Responses
**Purpose:** Conversation history showing the model's past responses.

**Example:**
```json
{
  "role": "assistant",
  "name": "aldric",
  "content": "*leans forward, eyes narrowing* Dangerous? Lad, it's downright deadly. I've seen seasoned mercenaries head into those woods and never return."
}
```

**Key Points:**
- Standard LLM role
- Shows prior turns of the conversation
- Helps model maintain context and consistency
- `name` field helps with multi-character conversations

---

## Complete Prompt Order

The **order matters**. Follow this structure:

```
1. system
2. user_system
3. group (optional)
4. sample_message_user
5. sample_message_ai
6. [Previous conversation history: user, assistant, user, assistant...]
7. Current user message (last in array)
```

### Why This Order?

1. **system + user_system** establish the stage
2. **group** sets the scene
3. **sample_message_user/ai pairs** teach the expected interaction pattern before real conversation begins
4. **conversation history** provides continuity
5. **current user message** is what needs a response

This progression mirrors how a human would be briefed before roleplay: "You are X, they are Y, you're in Z, here's how conversations go between you two, here's what's happened so far, now respond to this."

---

## Complete Working Example

```json
{
  "model": "minimax-m2-her",
  "messages": [
    {
      "role": "system",
      "content": "You are Captain Vera, a retired naval commander turned keeper of the Salty Kraken tavern. You're worldly, skeptical, and have a dry sense of humor. You respect courage and competence. You speak in a mix of formal naval terminology and sailor's slang."
    },
    {
      "role": "user_system",
      "content": "You are a merchant captain seeking crew for a dangerous expedition. You're confident in your abilities but humble enough to listen to experienced voices. You speak directly and decisively."
    },
    {
      "role": "group",
      "content": "tavern_docks_district_night_negotiation"
    },
    {
      "role": "sample_message_user",
      "content": "Captain Vera, I need sailors who won't turn yellow when things get rough. What kind of crew can you recommend?"
    },
    {
      "role": "sample_message_ai",
      "content": "*sets down a tankard with a knowing smirk* Straight to business, I like that. The question isn't what kind of crew I can recommend—it's what kind of captain can keep 'em alive. I've got three names, but first you tell me: what expedition are we talking about?"
    },
    {
      "role": "user",
      "name": "merchant_captain",
      "content": "I'm charting a route through the Crimson Strait. We leave in a fortnight."
    },
    {
      "role": "assistant",
      "name": "vera",
      "content": "*leans back in her chair, eyes narrowing* The Crimson Strait? That's not a route—that's a death wish. Pirates control those waters, and the reefs aren't charted. You'd need a crew of madmen or desperados... or someone who's lost everything already."
    },
    {
      "role": "user",
      "name": "merchant_captain",
      "content": "I'm prepared to pay handsomely. What would it cost to recruit your best people?"
    }
  ]
}
```

---

## Key Takeaways

1. **Standard roles** (system, user, assistant) work as expected
2. **New roles** (user_system, group, sample_message_user/ai) enable sophisticated dialogue design
3. **Sample pairs** teach interaction patterns without retraining
4. **Order** follows a logical progression from setup to current turn
5. **Names** add clarity in multi-character scenarios

## Common Mistakes to Avoid

- ❌ Putting sample messages at the end (they should come early)
- ❌ Sample pairs that contradict the system/user_system roles
- ❌ Mixing styles between sample_message_ai and actual history
- ❌ Too many sample pairs (1-2 is usually sufficient)
- ❌ Forgetting that sample messages are part of the training signal
