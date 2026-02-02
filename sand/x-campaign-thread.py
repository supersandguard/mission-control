#!/usr/bin/env python3
"""Post remaining thread tweets + search & engage"""

import json
import time
from requests_oauthlib import OAuth1Session

with open('/home/clawdbot/.secrets/x-api', 'r') as f:
    creds = {}
    for line in f:
        key, val = line.strip().split('=', 1)
        creds[key] = val

oauth = OAuth1Session(creds['CONSUMER_KEY'], creds['CONSUMER_SECRET'], creds['ACCESS_TOKEN'], creds['ACCESS_SECRET'])
TWEET_URL = "https://api.twitter.com/2/tweets"

TWEET1_ID = "2018209753412104357"

results = [
    {"id": TWEET1_ID, "text": "Every @safe multisig deserves a transaction firewall...", "reply_to": None}
]

def post_tweet(text, reply_to=None):
    payload = {"text": text}
    if reply_to:
        payload["reply"] = {"in_reply_to_tweet_id": reply_to}
    
    response = oauth.post(TWEET_URL, json=payload)
    
    if response.status_code == 201:
        data = response.json()
        tweet_id = data["data"]["id"]
        print(f"✅ Posted tweet {tweet_id}")
        results.append({"id": tweet_id, "text": text, "reply_to": reply_to})
        return tweet_id
    else:
        print(f"❌ Failed ({response.status_code}): {response.text}")
        results.append({"error": response.status_code, "text": text, "response": response.text})
        return None

# --- TWEET 2: What SandGuard catches ---
tweet2_text = """What SandGuard catches:

→ Unlimited token approvals
→ Suspicious delegatecalls
→ Unverified contracts
→ Abnormal value transfers

The ByBit hack used a delegatecall to upgrade a proxy. SandGuard flags that instantly."""

print("=== Posting Tweet 2 (what it catches) ===")
tweet2_id = post_tweet(tweet2_text, reply_to=TWEET1_ID)

print(f"⏳ Waiting 5 minutes...")
time.sleep(300)

# --- TWEET 3: Pricing + Founder status ---
tweet3_text = """Built for Safe. Built by agents.

Free tier: decode any Safe transaction
Pro ($20/mo): simulation + risk scoring + push alerts

First 100 users get Founder status → lifetime perks

supersandguard.com"""

print("=== Posting Tweet 3 (pricing + founders) ===")
reply_id = tweet2_id if tweet2_id else TWEET1_ID
tweet3_id = post_tweet(tweet3_text, reply_to=reply_id)

# Save full log
with open('/home/clawdbot/clawd/sand/x-marketing-log.md', 'w') as f:
    f.write("# X Marketing Campaign Log\n\n")
    f.write(f"**Date:** {time.strftime('%Y-%m-%d %H:%M UTC', time.gmtime())}\n")
    f.write(f"**Account:** @beto_neh\n")
    f.write(f"**Campaign:** Safe Ecosystem Engagement Thread\n\n")
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
    
    f.write("## Engagement (Replies to Others)\n\n")
    f.write("_See below after search phase_\n\n")

print("\n=== Thread complete ===")
for r in results:
    if 'id' in r:
        print(f"https://x.com/beto_neh/status/{r['id']}")

# Output results as JSON for next step
with open('/tmp/thread-results.json', 'w') as f:
    json.dump(results, f, indent=2)
