#!/usr/bin/env python3
"""SandGuard X/Twitter Marketing Campaign - Safe Ecosystem Engagement"""

import json
import time
import sys
from requests_oauthlib import OAuth1Session

# Read credentials
with open('/home/clawdbot/.secrets/x-api', 'r') as f:
    creds = {}
    for line in f:
        key, val = line.strip().split('=', 1)
        creds[key] = val

consumer_key = creds['CONSUMER_KEY']
consumer_secret = creds['CONSUMER_SECRET']
access_token = creds['ACCESS_TOKEN']
access_secret = creds['ACCESS_SECRET']

oauth = OAuth1Session(consumer_key, consumer_secret, access_token, access_secret)

TWEET_URL = "https://api.twitter.com/2/tweets"

results = []

def post_tweet(text, reply_to=None):
    payload = {"text": text}
    if reply_to:
        payload["reply"] = {"in_reply_to_tweet_id": reply_to}
    
    response = oauth.post(TWEET_URL, json=payload)
    
    if response.status_code == 201:
        data = response.json()
        tweet_id = data["data"]["id"]
        print(f"✅ Posted tweet {tweet_id}")
        print(f"   Text: {text[:80]}...")
        results.append({"id": tweet_id, "text": text, "reply_to": reply_to})
        return tweet_id
    else:
        print(f"❌ Failed ({response.status_code}): {response.text}")
        results.append({"error": response.status_code, "text": text, "response": response.text})
        return None

# --- TWEET 1: Safe engagement hook ---
tweet1_text = """Every @safe multisig deserves a transaction firewall.

SandGuard decodes, simulates, and risk-scores every tx before you sign.

Free tier live → supersandguard.com"""

print("=== Posting Tweet 1 (Safe engagement) ===")
tweet1_id = post_tweet(tweet1_text)

if not tweet1_id:
    print("OAuth failed on first tweet. Stopping.")
    # Save error log
    with open('/home/clawdbot/clawd/sand/x-marketing-log.md', 'w') as f:
        f.write("# X Marketing Campaign Log\n\n")
        f.write(f"**Date:** {time.strftime('%Y-%m-%d %H:%M UTC', time.gmtime())}\n\n")
        f.write("## Error\nOAuth failed on first tweet. Check credentials.\n\n")
        f.write(f"```json\n{json.dumps(results, indent=2)}\n```\n")
    sys.exit(1)

print(f"\n⏳ Waiting 5 minutes before Tweet 2...")
time.sleep(300)

# --- TWEET 2: What SandGuard catches (reply to tweet 1) ---
tweet2_text = """What SandGuard catches:

→ Unlimited token approvals
→ Suspicious delegatecalls
→ Unverified contracts
→ Abnormal value transfers

The ByBit hack used a delegatecall to upgrade a proxy. SandGuard flags that instantly."""

print("=== Posting Tweet 2 (thread - what it catches) ===")
tweet2_id = post_tweet(tweet2_text, reply_to=tweet1_id)

print(f"\n⏳ Waiting 5 minutes before Tweet 3...")
time.sleep(300)

# --- TWEET 3: Pricing + Founder status (reply to tweet 2) ---
tweet3_text = """Built for Safe. Built by agents.

Free tier: decode any Safe transaction
Pro ($20/mo): simulation + risk scoring + push alerts

First 100 users get Founder status → lifetime perks

supersandguard.com"""

print("=== Posting Tweet 3 (thread - pricing + founders) ===")
reply_to_id = tweet2_id if tweet2_id else tweet1_id
tweet3_id = post_tweet(tweet3_text, reply_to=reply_to_id)

# Save log
with open('/home/clawdbot/clawd/sand/x-marketing-log.md', 'w') as f:
    f.write("# X Marketing Campaign Log\n\n")
    f.write(f"**Date:** {time.strftime('%Y-%m-%d %H:%M UTC', time.gmtime())}\n")
    f.write(f"**Account:** @beto_neh\n")
    f.write(f"**Campaign:** Safe Ecosystem Engagement\n\n")
    f.write("## Thread Posted\n\n")
    for i, r in enumerate(results, 1):
        if 'id' in r:
            f.write(f"### Tweet {i}\n")
            f.write(f"- **ID:** {r['id']}\n")
            f.write(f"- **URL:** https://x.com/beto_neh/status/{r['id']}\n")
            if r.get('reply_to'):
                f.write(f"- **Reply to:** {r['reply_to']}\n")
            f.write(f"- **Text:**\n```\n{r['text']}\n```\n\n")
        else:
            f.write(f"### Tweet {i} — FAILED\n")
            f.write(f"- **Error:** {r.get('error')}\n")
            f.write(f"- **Response:** {r.get('response')}\n\n")

print("\n=== Campaign thread complete ===")
print(f"Results saved to /home/clawdbot/clawd/sand/x-marketing-log.md")

# Output for next steps
print("\n--- TWEET IDS ---")
for r in results:
    if 'id' in r:
        print(f"https://x.com/beto_neh/status/{r['id']}")
