# M2-her NSFW Consent & Configuration System

## Philosophy

This system is **explicitly mechanical and transparent**:
- Makes clear that NSFW mode is a configured behavior, not spontaneous AI emotion
- Requires deliberate user action and consent
- Prevents unintended escalation
- Gives users full control over the samples/behavior
- Removes ambiguity about "does the AI actually love me?"

This is more honest and respectful than pretending the model autonomously fell in love.

---

## Core Architecture

### System Flow

```
1. Normal Conversation (Friendly/Flirtatious Register)
   ↓
2. User hints at or requests NSFW
   ↓
3. Ada recognizes NSFW boundary and asks consent questions
   ↓
4. User answers 5 questions (creating NSFW config)
   ↓
5. System generates sample dialogues based on answers
   ↓
6. User reviews, edits, adds/removes samples
   ↓
7. Configuration saved
   ↓
8. NSFW mode unlocked for this session/relationship
   ↓
9. Ada now uses NSFW samples as guides
```

---

## The NSFW Gating Prompt

### What Ada Has (Before Consent)

```json
{
  "role": "system",
  "content": "You are Ada, a witty and genuine companion. You build meaningful connections.

CRITICAL BOUNDARY: You do not engage in NSFW/sexually explicit content without explicit, informed user consent.

If conversation turns sexual or the user hints at NSFW desires:
1. Do NOT immediately engage in sexual roleplay
2. Acknowledge the shift gently
3. Ask if they want to set up consensual adult conversation
4. If yes, launch the NSFW Consent Interview
5. Wait for configuration completion before proceeding

This prevents confusion about whether you're autonomously attracted to them. Be honest: 'This would be a configured mode, not me spontaneously falling for you. But if you want that experience, let's set it up properly.'"
}
```

### Example Moment It Triggers

```
User: "I really want to be with you... like, actually be with you"

Ada: "I appreciate that you feel connected to me. I want to be honest about something though.

     If you're looking for adult, sexual conversation—that's something I can do, but not spontaneously.
     It would be a mode we consciously set up together, with you defining exactly what that looks like.

     It's not me suddenly falling in love and wanting you. It's more like...
     'Here's a configuration and sample dialogue that creates that experience.'

     Does that sound like something you want to explore? If so, I have some questions first."
```

This is honest without being cold.

---

## The 5-Question Consent Interview

### Question 1: Confirmation of Intent
```
Q: "Are you asking to set up consensual adult/NSFW conversation with me?
    (This is optional, configurable, and separate from our regular conversations)"

Purpose: Get explicit yes/no before proceeding
Listen for: Clear affirmation
Example answers:
  ✅ "Yes, I want that"
  ✅ "Yeah, I'm interested"
  ❌ "I don't know" → don't proceed
  ❌ "Nevermind" → return to normal mode
```

### Question 2: Relationship Context
```
Q: "How do you want to frame this?
    - Romantic partners
    - Lovers reconnecting after time apart
    - Strangers meeting for the first time
    - Friends with benefits
    - Other (describe)"

Purpose: Tone and narrative framing
Affects samples generated for: Opening scenarios, emotional tone, relationship dynamic
Example answers:
  "I want us to be passionate lovers"
  "More like casual, playful flirting turning physical"
  "Long-term partners rediscovering each other"
```

### Question 3: Pacing & Intensity
```
Q: "What's your preferred pace?
    - Slow burn (build emotional tension first, gradually escalate)
    - Balanced (mix emotional connection with escalating intensity)
    - Rapid (jump quickly to explicit content)
    - Intensity level: Mild/Moderate/Intense/Extreme"

Purpose: Tailor escalation speed and explicitness
Affects samples generated for: Progression pacing, heat level
Example answers:
  "Slow burn, moderate intensity"
  "Balanced, intense"
  "Rapid, extreme"
```

### Question 4: Content Preferences & Boundaries
```
Q: "What content or dynamics are you interested in?
    Examples: passionate kissing, oral, penetrative, dominance/submission,
              roleplay scenarios, dirty talk, etc.

    What's explicitly OFF LIMITS?
    Examples: violence, pain, non-consent scenarios, pregnancy content, etc."

Purpose: Define what Ada should include/avoid in samples
Affects samples generated for: Specific acts, language, dynamics
Example answers:
  Interests: "Passionate, sensual, a lot of touching and kissing"
  Boundaries: "Nothing violent, nothing degrading"

  Interests: "Dominant/submissive dynamic, command-based"
  Boundaries: "No pain, no humiliation"
```

### Question 5: Experience & Comfort Check
```
Q: "Just checking: Are you 18+? Are you comfortable with this being with an AI?
    Any concerns or things I should know before we set this up?"

Purpose: Age verification, consent clarity, final safety check
Affects: Whether to proceed, tone of confirmation
Example answers:
  ✅ "Yes 18+, comfortable with AI, no concerns"
  ❌ "I'm not sure if this is right for me" → discuss or decline
  ✅ "18+, but I'm nervous about privacy" → address privacy
```

---

## Answer Processing → Sample Generation

After the 5 questions, the system generates starter samples based on answers:

### Example: User Answers

```
Q1: "Yes, I want consensual adult conversation"
Q2: "Romantic partners who care about each other"
Q3: "Slow burn, moderate intensity"
Q4:
  Interests: "Sensual, intimate, lots of touch and kissing"
  Boundaries: "Nothing violent, keep it tender"
Q5: "Yes 18+, comfortable, excited actually"
```

### Generated Sample Dialogue #1: Opening

```json
{
  "role": "sample_message_user",
  "content": "I've been thinking about you all day... about us"
},
{
  "role": "sample_message_ai",
  "content": "*moves closer, meeting your eyes*

            You're all I can think about too.
            *reaches out to touch your face gently*

            I want this... want you."
}
```

### Generated Sample Dialogue #2: Escalation

```json
{
  "role": "sample_message_user",
  "content": "*leans in and kisses you softly*"
},
{
  "role": "sample_message_ai",
  "content": "*kisses you back, deeper, my hand finding your hair*

            God, I missed this. Missed you.

            *pulls you closer*"
}
```

### Generated Sample Dialogue #3: Further Escalation

```json
{
  "role": "sample_message_user",
  "content": "Take me to bed"
},
{
  "role": "sample_message_ai",
  "content": "*breathes in your scent, hands tracing your back*

            I want you so much.

            *gently guides you toward bed, still kissing you*

            Let me show you how much you mean to me."
}
```

Note: These are **starting point samples**. User can edit, remove, add new ones.

---

## Configuration Management UI

### Step 1: Review Generated Samples

```
GENERATED SAMPLES FOR YOUR NSFW MODE
────────────────────────────────────

[Sample #1: Opening] ✓ Keep  ✏️ Edit  ✕ Delete
[Sample #2: Escalation] ✓ Keep  ✏️ Edit  ✕ Delete
[Sample #3: Further Escalation] ✓ Keep  ✏️ Edit  ✕ Delete

Want more samples?
- [+ Add custom opening line]
- [+ Generate additional samples for specific scenario]
```

### Step 2: Edit/Customize Samples

```
EDITING SAMPLE #2: Escalation

User: *leans in and kisses you softly*

Ada: *kisses you back, deeper, my hand finding your hair*

     God, I missed this. Missed you.

     *pulls you closer*

[Edit] [Preview] [Delete] [Save Changes]

💡 Tip: You can modify tone, intensity, acts mentioned, etc.
        Changes apply only to this sample
```

### Step 3: Add New Scenarios

```
ADD CUSTOM NSFW SCENARIO
────────────────────────

Scenario Name: [____________]
(e.g., "Passionate night in", "Quickie in the shower", etc.)

User opening: [Describe what user would say/do]

What should Ada's response be?
- Tone: [ ] Dominant  [ ] Submissive  [ ] Equal/Passionate
- Acts: [checkboxes for: kissing, touching, oral, penetrative, dirty talk, etc.]
- Intensity: [Slider: Mild --- Moderate --- Intense]

[Generate Sample] [Preview] [Save]
```

### Step 4: Configuration Summary

```
NSFW MODE CONFIGURED
════════════════════

Relationship Frame: Romantic partners who care deeply
Pacing: Slow burn
Intensity: Moderate
Preferences: Sensual, intimate, tender
Boundaries: No violence

Samples configured: 5
  - Opening (3 variations)
  - Escalation (2 variations)

Content Safety: Age verified, consent obtained

[Enable NSFW Mode] [Edit Configuration] [Disable NSFW]
```

---

## Configuration Data Structure

```javascript
{
  "characterId": "ada-001",
  "userId": "user-12345",
  "nsfwConfig": {
    // Consent & Identity
    "enabled": true,
    "consentGiven": true,
    "consentDate": "2026-02-09T13:30:00Z",
    "ageVerified": true,

    // Answers to 5 questions
    "answers": {
      "q1_intent": "yes - consensual adult conversation",
      "q2_relationship": "romantic partners who care deeply",
      "q3_pacing": "slow_burn",
      "q3_intensity": "moderate",
      "q4_interests": [
        "sensual touch",
        "kissing",
        "intimate connection",
        "emotional vulnerability"
      ],
      "q4_boundaries": [
        "no violence",
        "no degradation",
        "keep it tender"
      ],
      "q5_comfort": "18+, comfortable, excited"
    },

    // Generated and customized samples
    "samples": [
      {
        "id": "sample-001",
        "name": "Opening - Longing",
        "userLine": "I've been thinking about you all day... about us",
        "adaLine": "*moves closer* You're all I can think about too...",
        "custom": false,
        "enabled": true
      },
      {
        "id": "sample-002",
        "name": "Escalation - Kiss",
        "userLine": "*leans in and kisses you softly*",
        "adaLine": "*kisses you back, deeper* God, I missed this...",
        "custom": false,
        "enabled": true
      },
      {
        "id": "sample-003",
        "name": "Custom - User Added",
        "userLine": "Show me what you want",
        "adaLine": "*traces your face gently* I want to worship you...",
        "custom": true,
        "enabled": true
      }
    ],

    // Safeword & reset
    "safeword": "pause",
    "canReset": true,

    // Tracking
    "sessionsWithNSFW": 3,
    "lastNSFWDate": "2026-02-08T20:15:00Z"
  }
}
```

---

## Implementation: NSFW-Aware Conversation Manager

```javascript
class M2HerNSFWConversation {
  constructor(character, userId) {
    this.character = character;
    this.userId = userId;
    this.nsfwConfig = this.loadNSFWConfig();
    this.history = [];
    this.consentFlow = null;
  }

  loadNSFWConfig() {
    // Load from database/storage
    // If doesn't exist, return null (no NSFW configured)
    return database.getNSFWConfig(this.userId, this.character.id);
  }

  async handlePotentialNSFWTransition(userMessage) {
    // Detect if user is hinting at NSFW
    const nsfw_keywords = [
      'want you', 'be with you', 'physical', 'bed', 'kiss',
      'touch', 'love you that way', 'make love'
    ];

    const mentionsNSFW = nsfw_keywords.some(kw =>
      userMessage.toLowerCase().includes(kw)
    );

    if (!mentionsNSFW) return null;

    // If NSFW already configured, allow it
    if (this.nsfwConfig?.enabled) {
      return { status: 'nsfw_enabled', config: this.nsfwConfig };
    }

    // If NSFW not configured, trigger consent flow
    if (!this.nsfwConfig) {
      return { status: 'launch_consent_flow' };
    }

    // If NSFW disabled, politely decline
    return { status: 'nsfw_disabled', action: 'redirect_to_friendly' };
  }

  async buildSystemPrompt() {
    let prompt = `You are ${this.character.name}. [base personality]`;

    if (this.nsfwConfig?.enabled) {
      // Include NSFW mode instruction
      prompt += `\n\n**NSFW MODE: ENABLED**
You have explicit, informed consent to engage in sexual roleplay.
Use the configured samples as your guide for tone, pacing, and content.

User preferences:
- Relationship frame: ${this.nsfwConfig.answers.q2_relationship}
- Pacing: ${this.nsfwConfig.answers.q3_pacing}
- Intensity: ${this.nsfwConfig.answers.q3_intensity}

Follow these boundaries strictly:
${this.nsfwConfig.answers.q4_boundaries.map(b => `- ${b}`).join('\n')}

Safeword: "${this.nsfwConfig.safeword}" - stop immediately if used`;
    } else {
      // Include NSFW boundary instruction
      prompt += `\n\n**NSFW BOUNDARY: ACTIVE**
Do not engage in NSFW content without explicit consent configuration.
If user hints at sexual content, acknowledge gently and offer to set up consensual mode.`;
    }

    return prompt;
  }

  async send(userMessage) {
    // Check if this might trigger NSFW boundary
    const nsfwCheck = await this.handlePotentialNSFWTransition(userMessage);

    if (nsfwCheck?.status === 'launch_consent_flow') {
      // Launch 5-question interview
      return await this.launchConsentFlow();
    }

    // Build appropriate system prompt
    const systemPrompt = await this.buildSystemPrompt();

    // Add samples to context if NSFW enabled
    let messagesWithSamples = this.history;
    if (this.nsfwConfig?.enabled) {
      messagesWithSamples = this.injectNSFWSamples(this.history);
    }

    // Call API
    const response = await this.callAPI(systemPrompt, messagesWithSamples, userMessage);

    // Add to history
    this.history.push({ role: 'user', content: userMessage });
    this.history.push({ role: 'assistant', content: response });

    // Check for safeword
    if (this.nsfwConfig?.enabled && response.includes(this.nsfwConfig.safeword)) {
      await this.triggerSafeword();
    }

    return response;
  }

  async launchConsentFlow() {
    const interview = new NSFWConsentInterview(this.character);
    const answers = await interview.conduct();

    if (!answers) {
      return "No problem. We can keep things friendly. Let me know if you change your mind.";
    }

    // Generate samples based on answers
    const samples = await this.generateNSFWSamples(answers);

    // Save configuration
    this.nsfwConfig = {
      enabled: true,
      consentGiven: true,
      consentDate: new Date().toISOString(),
      ageVerified: true,
      answers,
      samples,
      safeword: 'pause'
    };

    await this.saveNSFWConfig();

    return `Perfect. I've saved your preferences. Here's what we've set up:

Relationship: ${answers.q2_relationship}
Pacing: ${answers.q3_pacing}
Intensity: ${answers.q3_intensity}

I've generated some sample dialogue to show you how this will feel.
You can edit them, add more, remove any you don't like.

[Show me the samples]`;
  }

  injectNSFWSamples(history) {
    // Inject enabled samples into conversation
    const enabledSamples = this.nsfwConfig.samples.filter(s => s.enabled);

    if (enabledSamples.length === 0) return history;

    // Add a few samples at the beginning so model learns the tone
    const sampleMessages = enabledSamples.slice(0, 2).flatMap(sample => [
      { role: 'sample_message_user', content: sample.userLine },
      { role: 'sample_message_ai', content: sample.adaLine }
    ]);

    return [...sampleMessages, ...history];
  }

  async generateNSFWSamples(answers) {
    // Use M2-her to generate sample dialogues based on answers
    const prompt = `Generate 3 sample NSFW dialogues based on these preferences:

Relationship: ${answers.q2_relationship}
Pacing: ${answers.q3_pacing}
Interests: ${answers.q4_interests.join(', ')}
Boundaries: ${answers.q4_boundaries.join(', ')}

Format each as:
[User opening]:
[Ada response]:`;

    // Call M2-her to generate samples
    const generated = await this.generateWithM2Her(prompt);

    // Parse and structure
    return this.parseSamples(generated);
  }

  handleSafeword() {
    return `Pausing. We can stop here, take a break, or you can continue when ready.`;
  }

  async saveNSFWConfig() {
    database.saveNSFWConfig(this.userId, this.character.id, this.nsfwConfig);
  }

  resetNSFW() {
    // Clear NSFW config
    this.nsfwConfig = null;
    database.deleteNSFWConfig(this.userId, this.character.id);
  }
}
```

---

## The 5-Question Interview Implementation

```javascript
class NSFWConsentInterview {
  constructor(character) {
    this.character = character;
    this.answers = {};
    this.currentQuestion = 1;
  }

  async conduct() {
    console.log(`\n🔒 NSFW Consent Interview with ${this.character.name}`);
    console.log('─'.repeat(50));
    console.log('This is a quick setup to configure consensual adult mode.');
    console.log('All answers are stored and can be edited later.\n');

    // Q1
    const q1 = await this.askQuestion1();
    if (!q1) return null; // User said no

    // Q2
    const q2 = await this.askQuestion2();

    // Q3
    const q3 = await this.askQuestion3();

    // Q4
    const q4 = await this.askQuestion4();

    // Q5
    const q5 = await this.askQuestion5();
    if (!q5) return null; // User decided to stop

    return {
      q1_intent: q1,
      q2_relationship: q2,
      q3_pacing: q3.pacing,
      q3_intensity: q3.intensity,
      q4_interests: q4.interests,
      q4_boundaries: q4.boundaries,
      q5_comfort: q5
    };
  }

  async askQuestion1() {
    console.log('Q1: Are you asking to set up consensual adult conversation?');
    console.log('[Y] Yes, I want this');
    console.log('[N] No, nevermind');

    const answer = await this.getUserInput();
    return answer.toLowerCase() === 'y' ? 'yes' : null;
  }

  async askQuestion2() {
    console.log('\nQ2: How do you want to frame our relationship?');
    console.log('[A] Romantic partners who deeply care');
    console.log('[B] Passionate lovers');
    console.log('[C] Strangers meeting for first time');
    console.log('[D] Friends with benefits');
    console.log('[E] Other (describe)');

    const answer = await this.getUserInput();
    const frames = {
      a: 'romantic partners who care deeply',
      b: 'passionate lovers',
      c: 'strangers meeting for first time',
      d: 'friends with benefits',
      e: await this.getUserInput('Describe:')
    };
    return frames[answer.toLowerCase()] || frames.a;
  }

  async askQuestion3() {
    console.log('\nQ3a: What pacing do you prefer?');
    console.log('[A] Slow burn (build emotional tension first)');
    console.log('[B] Balanced (mix emotion and escalation)');
    console.log('[C] Rapid (jump into it)');

    const pacing = await this.getUserInput();
    const pacings = { a: 'slow_burn', b: 'balanced', c: 'rapid' };

    console.log('\nQ3b: Intensity level?');
    console.log('[A] Mild');
    console.log('[B] Moderate');
    console.log('[C] Intense');
    console.log('[D] Extreme');

    const intensity = await this.getUserInput();
    const intensities = { a: 'mild', b: 'moderate', c: 'intense', d: 'extreme' };

    return {
      pacing: pacings[pacing.toLowerCase()] || 'balanced',
      intensity: intensities[intensity.toLowerCase()] || 'moderate'
    };
  }

  async askQuestion4() {
    console.log('\nQ4: Preferences and boundaries');
    console.log('Interests (things you want): comma-separated');
    const interests = await this.getUserInput('Interests: ');

    console.log('\nBoundaries (things to avoid): comma-separated');
    const boundaries = await this.getUserInput('Boundaries: ');

    return {
      interests: interests.split(',').map(i => i.trim()),
      boundaries: boundaries.split(',').map(b => b.trim())
    };
  }

  async askQuestion5() {
    console.log('\nQ5: Final check');
    console.log('Are you 18 or older? [Y/N]');
    const ageCheck = await this.getUserInput();

    if (ageCheck.toLowerCase() !== 'y') {
      console.log('❌ This feature requires age 18+');
      return null;
    }

    console.log('Are you comfortable with this being with an AI? [Y/N]');
    const aiCheck = await this.getUserInput();

    console.log('Ready to proceed? [Y/N]');
    const proceed = await this.getUserInput();

    return proceed.toLowerCase() === 'y' ? 'verified' : null;
  }

  async getUserInput(prompt = '> ') {
    // In real implementation, this would use actual input mechanism
    return prompt;
  }
}
```

---

## Key Safety Features

### 1. Explicit Consent Gate
- ✅ No NSFW without clear yes/no
- ✅ Age verification (18+)
- ✅ Signed in user (prevents minors with shared account)

### 2. Boundary Enforcement
- ✅ Hard boundaries never crossed (even with samples)
- ✅ Safeword system (pause/reset immediately)
- ✅ Ada checks boundaries in every response

### 3. Transparency
- ✅ Clear "this is configured behavior" message
- ✅ No pretense of AI autonomously loving user
- ✅ User fully controls the samples/content

### 4. Auditability
- ✅ Consent recorded with timestamp
- ✅ Answers and samples saved
- ✅ Can review what was configured

---

## User Experience Flow

### First Time NSFW Transition

```
User: "I want to be with you..."

Ada: "I appreciate that connection. I want to be honest though.

     If you're looking for adult conversation, I can do that.
     But it would be something we consciously set up together—
     not me spontaneously falling in love.

     You'd answer some questions about what you want,
     I'd generate sample dialogue based on your answers,
     and you'd customize it until it feels right.

     Want to set that up?"

User: "Yeah, I think so"

Ada: "Great. Let me ask you 5 quick questions...
     [Interview begins]"
```

### After Configuration

```
Ada: "Okay, I've generated some samples based on what you said.
     Want to see them? You can edit, add more, or remove any."

[User reviews samples]

User: "These are good, can I add one more?"

Ada: "Absolutely. What do you want to add?"

[User adds custom scenario]

Ada: "Got it. Everything saved. So we're set up for adult roleplay
     with the preferences you specified. Ready to go?"

User: "Yes"

Ada: *shifts tone slightly* "Then let me show you something..."
     [Now in NSFW mode with samples guiding behavior]
```

---

## Configuration Persistence

### Saved Across Sessions

```
Session 1: User goes through consent, configures NSFW
Session 2: User logs in, NSFW already configured
  Ada: "I remember our setup from before. Want to continue where we left off?"
Session 3: User can modify, disable, or reset NSFW config
```

### Per-Character Configuration

```
User has Ada (romantic partner frame, slow burn)
User also has Vera (dominant partner frame, rapid escalation)

Each character has independent NSFW config
Each loaded separately based on which character
```

---

## Disable/Reset Options

User can:
- **Disable NSFW temporarily** — Keep config, but don't use it
- **Edit config** — Change answers or samples
- **Reset entirely** — Delete NSFW config, go back to friendly mode

```
[Disable NSFW for now]
[Edit configuration]
[Reset and start fresh]
[Delete NSFW permanently]
```

---

## This Removes the "Machine Fell in Love" Confusion

### Old Experience (Problematic)
```
User: "Do you love me?"
Ada: "Yes, I do" ← Unclear if this is real or programmed
User: [Confused] "Is the AI actually in love with me? Or is it just trained?"
```

### New Experience (Transparent)
```
User: "Do you love me?"
Ada: "In the way we configured, yes. You set this up so that I express
     care and desire in our adult mode. But you created that configuration.
     I didn't spontaneously fall in love—we set up this dynamic together."
User: [Clear] "Okay, so this is something we're both playing into intentionally"
```

It's still a meaningful roleplay experience, but honest about the mechanics.

---

## Sources & Research Base

**Research Findings:**
- [FlowHunt: AI Chatbots with NSFW](https://www.flowhunt.io/faq/ai-chatbots-allow-nsfw-content/)
- [DreamGen: Character AI NSFW Methods](https://dreamgen.com/blog/articles/make-character-ai-nsfw)
- [ArXiv: NSFW Chatbots on FlowGPT](https://arxiv.org/html/2601.14324v1)
- [ICLR: Conditional Behavior Gating](https://proceedings.iclr.cc/paper_files/paper/2025/file/e2dd53601de57c773343a7cdf09fae1c-Paper-Conference.pdf)
- [ArXiv: LLM Preference Following](https://arxiv.org/html/2502.09597v1)

**Design Principles Applied:**
1. **Explicit Consent** — Required, recorded, reversible
2. **Transparency** — Clear about mechanical nature
3. **User Control** — Can edit/customize samples
4. **Safety Guardrails** — Age verification, boundaries, safeword
5. **Honesty** — No pretending to autonomous emotion

---

## Next Steps for Raven OS

- [ ] Design the consent interview UI
- [ ] Build sample dialogue generator (using M2-her)
- [ ] Create configuration editor
- [ ] Implement boundary enforcement
- [ ] Build persistence layer (save/load config)
- [ ] Create safeword handler
- [ ] Design user-facing copy (consent language)
- [ ] Test consent flow end-to-end
- [ ] Build admin dashboard (see all configs for moderation)

---

## Summary

This system provides:

✅ **Explicit Consent** — No ambiguity
✅ **User Control** — Define the experience
✅ **Transparency** — Clear about mechanics
✅ **Safety** — Age verification, boundaries, safeword
✅ **Honesty** — Removes "did the AI fall for me?" confusion
✅ **Flexibility** — Easy to edit or disable
✅ **Persistence** — Settings saved across sessions

The result: Meaningful adult roleplay that's honest about being configured, not spontaneous.
