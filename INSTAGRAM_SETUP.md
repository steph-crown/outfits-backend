# Instagram Integration Setup

## ⚠️ Important Notes

The Instagram scraping functionality uses Instagram's private GraphQL API, which requires session-specific tokens that **expire regularly**. This is not a reliable long-term solution.

## Environment Variables

Add these to your `.env` file:

```env
# Instagram Scraping Configuration (from GitHub repo)
USER_AGENT=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36
X_IG_APP_ID=936619743392459
```

## How to Get Fresh Values

1. **Open Instagram** in your browser
2. **Open Developer Tools** (F12)
3. **Go to Network tab**
4. **Refresh the page**
5. **Look for graphql requests** in the network tab
6. **Copy the values** from the request headers:
   - `X-FB-LSD` → `INSTAGRAM_LSD`
   - `X-ASBD-ID` → `INSTAGRAM_ASBD_ID`
   - `X-IG-App-ID` → `INSTAGRAM_APP_ID`

## Limitations

- **Session tokens expire** (usually within hours/days)
- **Instagram may block** your IP if you make too many requests
- **Terms of Service** - Instagram may prohibit this usage
- **Rate limiting** - Instagram has strict rate limits

## Better Alternatives

Consider using:

1. **Instagram Basic Display API** (official, but limited)
2. **Instagram Graph API** (for business accounts)
3. **User manual upload** (screenshot and crop)
4. **Third-party services** (like RapidAPI Instagram scrapers)

## Testing

The service will try to fetch fresh session data automatically, but manual updates may be required when tokens expire.

```bash
# Test the endpoint
curl -X POST http://localhost:3001/api/instagram/process \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/p/EXAMPLE/"}'
```
