# MiniMax M2-her: Master Context Document

## Overview

MiniMax M2-her is a dialogue-first large language model specifically engineered for:
- Immersive roleplay and character-driven interactions
- Consistent personality and tone across multi-turn conversations
- In-context learning from sample dialogue patterns
- Rich conversational scenarios with multiple participants

## Key Characteristics

| Feature | Details |
|---------|---------|
| **Model Type** | Mixture of Experts (MoE) |
| **Total Parameters** | 230 billion |
| **Active Parameters** | 10 billion |
| **Specialization** | Dialogue, roleplay, character consistency |
| **Cost** | ~8% of Claude Sonnet |
| **Speed** | ~2x faster than Claude Sonnet |
| **Training** | Agentic Data Synthesis + Online RLHF |

## Unique Technical Advantages

### 1. In-Context Few-Shot Learning
Unlike standard LLMs, M2-her was specifically trained to accept and learn from sample dialogue patterns at inference time. This allows you to:
- Provide example interactions showing desired tone and style
- Have the model adapt without retraining
- Maintain consistency across long conversations

### 2. Rich Message Role System
Seven distinct message roles enable sophisticated prompt engineering:
- **system** — Model's role and foundational behavior
- **user_system** — User's role and persona
- **group** — Conversation context/scene identifier
- **sample_message_user** — Example user input
- **sample_message_ai** — Example model output
- **user/assistant** — Actual conversation history

### 3. Agentic Data Synthesis Training
The model was trained on synthetic dialogues created by:
- Expert models simulating both character and user roles
- A "Dynamic Chat Planning Module" controlling emotional tone and direction
- Multi-attribute reward models filtering quality
- An "LLM-as-judge script doctor" ensuring consistency

### 4. Online Preference Learning with Safeguards
Training included:
- Causal Denoising Protocol to isolate genuine quality signals
- Early stopping to prevent reward hacking
- Quality Floor filters to prevent model degradation
- Iterative deployment cycles to prevent mode collapse

## Why This Matters for Raven OS

The sample message capability is powerful because:
1. You don't need to retrain the model
2. You can define character behavior through examples
3. The model learns interaction patterns at runtime
4. Multiple characters can have distinct personas through different sample sets

## Documentation Structure

- **M2_Her_Prompt_Structure.md** — Complete reference on prompt construction
- **M2_Her_Sample_Conversation_Patterns.md** — Real-world usage examples
- **M2_Her_API_Integration.md** — Integration and API reference
- **M2_Her_Tool_Use.md** — Function calling, tool schemas, agent capabilities
- **M2_Her_Mode_Management.md** — Mode switching, context isolation, architecture patterns
- **M2_Her_Tonal_Registers.md** — Emotional tone shifts, consent tracking, character consistency
- **M2_Her_NSFW_Consent_System.md** — Explicit consent flow, 5-question interview, sample management

---

## Maintaining Documentation Freshness

### When to Check for Staleness

Run this check:
- **Before any major implementation** (before coding Raven OS integration)
- **Quarterly** (every 3 months) for routine updates
- **After MiniMax releases** (new model versions, API changes)
- **If M2-her behavior seems different** (unexpected responses in production)

### Staleness Checklist

#### API & Model Changes
- [ ] Visit https://platform.minimax.io/docs/api-reference/text-chat
- [ ] Verify message role types are still: system, user_system, group, sample_message_user, sample_message_ai, user, assistant
- [ ] Check if new message role types have been added
- [ ] Verify API endpoint is still `/v1/text/chatcompletion_v2`
- [ ] Check pricing (should be ~$0.30/$1.20 per million tokens)
- [ ] Look for new tool-calling features or changes

#### Training & Architecture Changes
- [ ] Check MiniMax news for M2-her updates (https://www.minimax.io/news/)
- [ ] Look for M2.1 or M2.2 release notes
- [ ] Verify "Agentic Data Synthesis" is still the training methodology
- [ ] Check if RLHF approach has changed

#### Performance & Limits
- [ ] Verify model still handles ~20+ turns without degradation
- [ ] Check max token limits (if increased, update examples)
- [ ] Confirm speed is still ~2x Claude Sonnet
- [ ] Verify cost is still ~8% of Claude Sonnet

#### Tool Calling Features
- [ ] Verify function calling still supported
- [ ] Check if MCP integration is still available
- [ ] Look for new tool types or capabilities
- [ ] Verify `<think></think>` tag behavior unchanged

### How to Verify (Step-by-Step)

**Step 1: Check Official Sources**
```bash
# Visit these URLs and compare to documentation
- https://platform.minimax.io/docs/guides/text-m2-function-call
- https://www.minimax.io/news/
- https://github.com/MiniMax-AI/MiniMax-M2/blob/main/docs/tool_calling_guide.md
```

**Step 2: Test with Sample Request**
```bash
# Make a test API call to verify nothing broke
curl -X POST https://api.minimax.io/v1/text/chatcompletion_v2 \
  -H "Authorization: Bearer $MINIMAX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "minimax-m2-her",
    "messages": [{"role": "system", "content": "Test"}]
  }'
# If this succeeds, basic API still works
```

**Step 3: Review Release Notes**
```bash
# Check GitHub for recent releases
# https://github.com/MiniMax-AI/MiniMax-M2/releases
```

**Step 4: Document Findings**
Create a brief note in your session/research notes:
- Date checked: YYYY-MM-DD
- Status: ✅ All verified / ⚠️ Changes found
- Changes needed: (list any updates)

### What to Update If Staleness Found

#### If Message Role Types Changed
- Update **M2_Her_Prompt_Structure.md** table in "The Seven Message Roles"
- Update examples in **M2_Her_Sample_Conversation_Patterns.md**
- Update API examples in **M2_Her_API_Integration.md**

#### If API Endpoint Changed
- Update all `https://api.minimax.io/v1/text/chatcompletion_v2` references
- Check for breaking changes in request/response format
- Update code examples in **M2_Her_API_Integration.md** and **M2_Her_Tool_Use.md**

#### If Tool Calling Changed
- Update **M2_Her_Tool_Use.md** function schema section
- Update implementation patterns
- Update example code

#### If Training Methodology Changed
- Update **M2_Her_Context.md** "Agentic Data Synthesis Training" section
- Update **M2_Her_Mode_Management.md** if mode handling was affected

#### If New Capabilities Added
- Create new documentation file (e.g., **M2_Her_[New_Feature].md**)
- Link from **M2_Her_Context.md**
- Add to documentation structure section

---

## Research Documentation

### How This Documentation Was Created

#### Phase 1: Initial Exploration (M2-her Overview)
- **Query 1**: "Mini Max M2 'her'"
- **Query 2**: "Mini Max M2 model AI"
- **Result**: Identified M2-her as dialogue-optimized variant of M2, learned basic capabilities

#### Phase 2: Prompt Engineering Deep Dive (Prompt Structure)
- **Query 3**: "MiniMax M2-her API prompt structure sample conversation format"
- **WebFetch**: https://www.minimax.io/news/a-deep-dive-into-the-minimax-m2-her-2
- **Result**: Detailed understanding of 7 message roles, training methodology, in-context learning

#### Phase 3: Tool Capabilities Research (Tool Use)
- **Query 4**: "MiniMax M2-her tool use function calling capabilities"
- **Query 5**: "MiniMax M2-her agent tools API integration support"
- **WebFetch**: https://github.com/MiniMax-AI/MiniMax-M2
- **Result**: Discovered M2-her supports full function calling, MCP, tool use

#### Phase 4: Mode Management Investigation (Mode Switching)
- **Query 6**: "LLM dynamic role switching mid-conversation system prompt context isolation"
- **Query 7**: "MiniMax M2 conversation mode switching change system role behavior consistency"
- **Research Finding**: General LLM principle: static system messages trained; dynamic changes cause drift
- **Result**: Developed 4 architectural approaches, recommended Approach 3 for Raven OS

### Research Methodology

**Information Sources Hierarchy**:
1. **Official Documentation** (MiniMax platform, GitHub repos)
2. **Research Papers** (ArXiv, academic sources)
3. **Community Discussion** (GitHub issues, forums)
4. **Blog Posts & Tutorials** (Medium, dev blogs)

**Verification Process**:
- Cross-referenced findings across multiple sources
- Prioritized official documentation over secondary sources
- Tested concepts against known LLM behavior principles
- Focused on M2-her specific capabilities vs. general LLM characteristics

**Assumptions Made**:
- M2-her behavior follows OpenAI-compatible API standards
- Message role system as documented is complete
- Training methodology described is current (as of early 2025)
- Performance metrics accurate as of documentation date

### Original Research Questions Answered

| Question | Answer | Source |
|----------|--------|--------|
| What is M2-her? | Dialogue-first LLM for roleplay & character interaction | MiniMax official docs |
| How do prompts work? | 7 message roles enable sophisticated control | M2-her Deep Dive paper |
| Can it use tools? | Yes, full function calling & MCP support | Tool Use API docs |
| Can modes switch mid-chat? | Yes, but needs careful architecture | LLM research + testing |
| Best approach for Raven OS? | Separate conversation histories per mode | Multi-source synthesis |

---

## Next Steps

- [ ] Understand prompt structure fundamentals
- [ ] Design sample conversation templates for Raven OS characters
- [ ] Plan API integration approach
- [ ] Design context manager for managing prompts
- [ ] Implement Mode Management approach for characters
- [ ] Set up staleness check schedule
- [ ] Create Raven OS character template using M2-her docs
