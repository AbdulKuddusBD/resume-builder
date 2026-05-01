# Optional Firebase Cloud Functions AI Proxy

Use this only if you want real GPT/OpenAI/Gemini AI.

Do not put AI API keys in frontend files.

Recommended flow:

1. Create Firebase Functions project.
2. Store API key in function config or secret manager.
3. Deploy HTTPS function.
4. Put the deployed URL in `js/firebase-config.js`:

```js
export const AI_CONFIG = {
  endpoint: "https://your-function-url"
};
```

The frontend sends:

```json
{
  "task": "summary",
  "resume": {}
}
```

Return:

```json
{
  "summary": "Generated summary text"
}
```
