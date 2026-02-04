#!/bin/bash
# Real-time monitoring dashboard for Mission Control

cd "$(dirname "$0")/.."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Function to get system stats
get_stats() {
    curl -s http://localhost:3333/api/health 2>/dev/null
}

# Function to get agent status
get_agents() {
    curl -s http://localhost:3333/api/sessions 2>/dev/null
}

# Clear screen and show header
show_header() {
    clear
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${WHITE}                  🎛️  MISSION CONTROL MONITOR                  ${CYAN}║${NC}"
    echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC} Node: clawdbot                     Press Ctrl+C to exit     ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Main monitoring loop
monitor_loop() {
    while true; do
        show_header
        
        # Get current stats
        STATS=$(get_stats)
        AGENTS=$(get_agents)
        
        if [ $? -eq 0 ] && [ -n "$STATS" ]; then
            # Parse stats
            CPU=$(echo "$STATS" | jq -r '.system.cpu // 0')
            MEMORY=$(echo "$STATS" | jq -r '.system.memory // 0')
            GATEWAY=$(echo "$STATS" | jq -r '.gateway // "unknown"')
            UPTIME=$(echo "$STATS" | jq -r '.system.uptime // 0')
            
            # Calculate uptime
            UPTIME_HOURS=$((UPTIME / 3600))
            UPTIME_MINS=$(((UPTIME % 3600) / 60))
            
            # Status colors
            if [ "$GATEWAY" = "healthy" ]; then
                GATEWAY_COLOR=$GREEN
                STATUS_ICON="✅"
            else
                GATEWAY_COLOR=$RED
                STATUS_ICON="❌"
            fi
            
            # Memory color
            if [ "$MEMORY" -gt 90 ]; then
                MEM_COLOR=$RED
            elif [ "$MEMORY" -gt 75 ]; then
                MEM_COLOR=$YELLOW
            else
                MEM_COLOR=$GREEN
            fi
            
            # CPU color
            if [ "$CPU" -gt 90 ]; then
                CPU_COLOR=$RED
            elif [ "$CPU" -gt 75 ]; then
                CPU_COLOR=$YELLOW
            else
                CPU_COLOR=$GREEN
            fi
            
            # System Status
            echo -e "${WHITE}📊 SYSTEM STATUS${NC}"
            echo -e "${CYAN}┌────────────────────────────────────────────────────────────┐${NC}"
            echo -e "${CYAN}│${NC} Status: $STATUS_ICON ${GATEWAY_COLOR}$GATEWAY${NC}                                    ${CYAN}│${NC}"
            echo -e "${CYAN}│${NC} CPU: ${CPU_COLOR}$CPU%${NC} ████████████                          ${CYAN}│${NC}"
            echo -e "${CYAN}│${NC} RAM: ${MEM_COLOR}$MEMORY%${NC} ████████████                          ${CYAN}│${NC}"
            echo -e "${CYAN}│${NC} Uptime: ${WHITE}${UPTIME_HOURS}h ${UPTIME_MINS}m${NC}                               ${CYAN}│${NC}"
            echo -e "${CYAN}└────────────────────────────────────────────────────────────┘${NC}"
            echo ""
            
            # Agent Status
            echo -e "${WHITE}🤖 AGENT STATUS${NC}"
            echo -e "${CYAN}┌────────────────────────────────────────────────────────────┐${NC}"
            
            if [ -n "$AGENTS" ]; then
                ACTIVE_SESSIONS=$(echo "$AGENTS" | jq -r '.sessions[] | select(.isActive == true) | .key' 2>/dev/null | wc -l)
                TOTAL_SESSIONS=$(echo "$AGENTS" | jq -r '.sessions | length' 2>/dev/null)
                
                echo -e "${CYAN}│${NC} Active Sessions: ${GREEN}$ACTIVE_SESSIONS${NC} / $TOTAL_SESSIONS                      ${CYAN}│${NC}"
                echo -e "${CYAN}│${NC}                                                          ${CYAN}│${NC}"
                
                # Show individual sessions
                echo "$AGENTS" | jq -r '.sessions[]? | [.key, .isActive, .messageCount] | @tsv' 2>/dev/null | head -3 | while IFS=$'\t' read -r key active messages; do
                    if [ "$active" = "true" ]; then
                        echo -e "${CYAN}│${NC} ${GREEN}●${NC} ${key:0:25}... (${messages} msg)                  ${CYAN}│${NC}"
                    else
                        echo -e "${CYAN}│${NC} ${YELLOW}○${NC} ${key:0:25}... (${messages} msg)                  ${CYAN}│${NC}"
                    fi
                done
            else
                echo -e "${CYAN}│${NC} ${RED}No agent data available${NC}                              ${CYAN}│${NC}"
            fi
            
            echo -e "${CYAN}└────────────────────────────────────────────────────────────┘${NC}"
            
        else
            echo -e "${RED}❌ Cannot connect to Mission Control server${NC}"
            echo -e "   Make sure the server is running on port 3333"
        fi
        
        echo ""
        echo -e "${WHITE}⚡ Quick Commands:${NC}"
        echo "   • Web UI: http://192.168.86.40:3333"
        echo "   • Health: ./scripts/health-check.sh"
        echo "   • Restart: ./scripts/restart.sh"
        echo ""
        echo -e "${PURPLE}$(date '+%Y-%m-%d %H:%M:%S') - Refreshing in 5 seconds...${NC}"
        
        sleep 5
    done
}

# Handle Ctrl+C
trap 'echo -e "\n${CYAN}Monitoring stopped. Goodbye! 👋${NC}"; exit 0' INT

# Start monitoring
echo -e "${GREEN}Starting Mission Control monitor...${NC}"
sleep 1
monitor_loop