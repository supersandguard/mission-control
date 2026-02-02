#!/usr/bin/env python3
"""Engage with Safe ecosystem tweets - thoughtful replies"""

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

results = []

def post_reply(text, reply_to):
    payload = {
        "text": text,
        "reply": {"in_reply_to_tweet_id": reply_to}
    }
    response = oauth.post(TWEET_URL, json=payload)
    
    if response.status_code == 201:
        data = response.json()
        tweet_id = data["data"]["id"]
        print(f"✅ Reply posted: {tweet_id}")
        results.append({"id": tweet_id, "text": text, "reply_to": reply_to, "status": "posted"})
        return tweet_id
    else:
        print(f"❌ Failed ({response.status_code}): {response.text}")
        results.append({"error": response.status_code, "text": text, "reply_to": reply_to, "response": response.text})
        return None

# === Reply 1: @safe's self-custody PMF tweet ===
# Original: "The first and most powerful form of PMF in crypto is self-custody"
reply1 = """Self-custody solved ownership. The next PMF is self-verification.

Most multisig signers approve transactions they can't fully decode. That's the gap — you own your keys but can't read your calldata.

We built SandGuard to close it: decode + simulate + risk-score every Safe tx before signing."""

print("=== Reply 1: @safe self-custody PMF tweet ===")
post_reply(reply1, "2017539357650137514")

print("⏳ Waiting 6 minutes...")
time.sleep(360)

# === Reply 2: @davitKh55's Safe wallet recommendation ===
# Original: "If you're still using a single-key wallet for your life savings, you're living on the edge... pros use Safe{Wallet}"
reply2 = """Multisig is step 1. But even with 3/5 signatures, if nobody decodes the calldata, you're still blind signing.

ByBit had a Safe multisig. Multiple signers. Hardware wallets. Still lost $1.4B because the UI was spoofed and nobody verified what the tx actually did.

Transaction verification is the missing layer."""

print("=== Reply 2: @davitKh55 Safe wallet tweet ===")
post_reply(reply2, "2017224781058228279")

print("⏳ Waiting 6 minutes...")
time.sleep(360)

# === Reply 3: @safe's "Every second, someone transacts with their Safe" ===
reply3 = """And every one of those transactions has calldata that most signers never read.

Decoding + simulating before signing should be as default as the multisig itself."""

print("=== Reply 3: @safe 'Every second' tweet ===")
post_reply(reply3, "2016862027151516000")

# === Follow @safe and @safegov ===
print("\n⏳ Waiting 2 minutes then following accounts...")
time.sleep(120)

# Get @safe user ID (8467082) and follow
follow_url = "https://api.twitter.com/2/users/2002520604277403648/following"

for username, user_id in [("safe", "8467082"), ("safegov", None)]:
    if user_id is None:
        # Look up safegov
        import os
        bearer = open(os.path.expanduser('~/.secrets/x-bearer')).read().strip().replace('BEARER_TOKEN=', '')
        import requests
        r = requests.get(
            f"https://api.twitter.com/2/users/by/username/{username}",
            headers={"Authorization": f"Bearer {bearer}"}
        )
        if r.status_code == 200:
            user_id = r.json()["data"]["id"]
        else:
            print(f"❌ Could not look up @{username}")
            continue
    
    payload = {"target_user_id": user_id}
    r = oauth.post(follow_url, json=payload)
    if r.status_code in (200, 201):
        data = r.json()
        following = data.get("data", {}).get("following", False)
        pending = data.get("data", {}).get("pending_follow", False)
        print(f"✅ Follow @{username}: following={following}, pending={pending}")
    else:
        print(f"⚠️ Follow @{username}: {r.status_code} - {r.text[:200]}")

# Save results
with open('/tmp/engage-results.json', 'w') as f:
    json.dump(results, f, indent=2)

print(f"\n=== Engagement complete: {len([r for r in results if 'id' in r])} replies posted ===")
