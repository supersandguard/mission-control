#!/bin/bash
export PATH="$HOME/.foundry/bin:$PATH"
RPC="https://eth.llamarpc.com"
WALLET="0xCc75959A8Fa6ed76F64172925c0799ad94ab0B84"
PRIVKEY="0x58cc336ef4ee5a2b3eba6ced236fb8cdd59dba0e7f0b58acb90746397320a418"
MINTER="0x0635e2f2926b306356b5b3f5cb6489107796b085"
PROJECT_ID=0
ALBERTO="0xfd20df09db039286e54670a4f32e99fbc51a146d"
CORE="0x0000186a8ba59c7f63423b0e528e384000008ac9"
MINT_PRICE="0.015ether"

echo "=== Signal Boards Mint Script ==="
echo "Wallet: $WALLET"
echo "Minter: $MINTER"
echo "Send NFT to: $ALBERTO"
echo ""

# Check balance
BALANCE=$(cast balance $WALLET --rpc-url $RPC 2>&1)
echo "Current balance: $BALANCE wei ($(cast from-wei $BALANCE 2>/dev/null) ETH)"

# Step 1: Mint
echo ""
echo "=== MINTING ==="
TX=$(cast send $MINTER "purchase(uint256)" $PROJECT_ID \
  --value $MINT_PRICE \
  --private-key $PRIVKEY \
  --rpc-url $RPC \
  2>&1)
echo "Mint TX: $TX"

# Get token ID from transaction receipt
MINT_TXHASH=$(echo "$TX" | grep "transactionHash" | awk '{print $2}')
echo "TX Hash: $MINT_TXHASH"

# Wait for confirmation
sleep 5
RECEIPT=$(cast receipt $MINT_TXHASH --rpc-url $RPC 2>&1)
echo "Receipt: $RECEIPT"

# Find token ID from Transfer event logs
# ERC721 Transfer event: Transfer(address,address,uint256)
# Topic0: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
TOKEN_ID=$(cast receipt $MINT_TXHASH --rpc-url $RPC 2>&1 | grep -A5 "0xddf252" | tail -1)
echo "Token ID (raw): $TOKEN_ID"

echo ""
echo "=== DONE - Check output above ==="
echo "If mint succeeded, transfer NFT manually with:"
echo "cast send $CORE 'safeTransferFrom(address,address,uint256)' $WALLET $ALBERTO <TOKEN_ID> --private-key $PRIVKEY --rpc-url $RPC"
