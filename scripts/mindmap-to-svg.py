#!/usr/bin/env python3
"""
Convert a markdown outline to a radial mindmap SVG.
Usage: python3 mindmap-to-svg.py input.md output.svg [--width 3840] [--height 2160]
"""
import re, sys, math

def parse_md(text):
    """Parse markdown headers/bullets into a tree."""
    root = {'text': '', 'children': [], 'level': 0}
    stack = [root]
    
    for line in text.strip().split('\n'):
        line = line.rstrip()
        if not line:
            continue
        
        # Headers
        m = re.match(r'^(#{1,6})\s+(.*)', line)
        if m:
            level = len(m.group(1))
            text = m.group(2).strip()
            node = {'text': text, 'children': [], 'level': level}
            while len(stack) > 1 and stack[-1]['level'] >= level:
                stack.pop()
            stack[-1]['children'].append(node)
            stack.append(node)
            continue
        
        # Bullets
        m = re.match(r'^(\s*)[-*]\s+(.*)', line)
        if m:
            indent = len(m.group(1))
            text = m.group(2).strip()
            level = 7 + indent // 2
            node = {'text': text, 'children': [], 'level': level}
            while len(stack) > 1 and stack[-1]['level'] >= level:
                stack.pop()
            stack[-1]['children'].append(node)
            stack.append(node)
    
    return root['children'][0] if root['children'] else root

# Colors for branches
COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7']

def layout_tree(node, x, y, angle_start, angle_end, radius, depth=0):
    """Radial layout."""
    elements = []
    node['x'] = x
    node['y'] = y
    node['depth'] = depth
    
    children = node.get('children', [])
    if not children:
        return elements
    
    n = len(children)
    angle_step = (angle_end - angle_start) / max(n, 1)
    
    for i, child in enumerate(children):
        angle = angle_start + angle_step * (i + 0.5)
        r = radius
        cx = x + r * math.cos(angle)
        cy = y + r * math.sin(angle)
        child['x'] = cx
        child['y'] = cy
        child['depth'] = depth + 1
        child['color'] = COLORS[i % len(COLORS)] if depth == 0 else node.get('color', COLORS[0])
        
        elements.append((node, child))
        
        sub_spread = angle_step * 0.9
        child_radius = radius * 0.7 if depth < 2 else radius * 0.6
        elements += layout_tree(child, cx, cy, angle - sub_spread/2, angle + sub_spread/2, child_radius, depth + 1)
    
    return elements

def escape_svg(text):
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')

def render_svg(root, width=3840, height=2160):
    cx, cy = width / 2, height / 2
    root['x'] = cx
    root['y'] = cy
    root['depth'] = 0
    root['color'] = '#ffffff'
    
    edges = layout_tree(root, cx, cy, -math.pi, math.pi, min(width, height) * 0.28)
    
    # Collect all nodes
    all_nodes = [root]
    def collect(n):
        all_nodes.append(n)
        for c in n.get('children', []):
            collect(c)
    for c in root.get('children', []):
        collect(c)
    
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">']
    svg.append(f'<rect width="{width}" height="{height}" fill="#ffffff"/>')
    svg.append('<defs><filter id="glow"><feGaussianBlur stdDeviation="3" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>')
    
    # Edges
    for parent, child in edges:
        color = child.get('color', '#666')
        opacity = max(0.15, 0.6 - child['depth'] * 0.12)
        stroke_w = max(1, 4 - child['depth'] * 0.8)
        # Curved lines
        mx = (parent['x'] + child['x']) / 2
        my = (parent['y'] + child['y']) / 2
        svg.append(f'<path d="M{parent["x"]:.0f},{parent["y"]:.0f} Q{mx:.0f},{parent["y"]:.0f} {child["x"]:.0f},{child["y"]:.0f}" fill="none" stroke="{color}" stroke-width="{stroke_w}" opacity="{opacity}"/>')
    
    # Nodes
    for n in all_nodes:
        text = escape_svg(n['text'])
        depth = n.get('depth', 0)
        color = n.get('color', '#ffffff')
        
        if depth == 0:
            # Root
            svg.append(f'<circle cx="{n["x"]:.0f}" cy="{n["y"]:.0f}" r="60" fill="#f0f0f5" stroke="#6366f1" stroke-width="3" filter="url(#glow)"/>')
            svg.append(f'<text x="{n["x"]:.0f}" y="{n["y"]:.0f}" text-anchor="middle" dominant-baseline="central" fill="#111" font-family="system-ui,sans-serif" font-size="28" font-weight="bold">{text}</text>')
        elif depth == 1:
            # Main branches
            rw = max(len(text) * 9, 80)
            svg.append(f'<rect x="{n["x"]-rw/2:.0f}" y="{n["y"]-20:.0f}" width="{rw}" height="40" rx="20" fill="{color}" opacity="0.2"/>')
            svg.append(f'<rect x="{n["x"]-rw/2:.0f}" y="{n["y"]-20:.0f}" width="{rw}" height="40" rx="20" fill="none" stroke="{color}" stroke-width="2" opacity="0.5"/>')
            svg.append(f'<text x="{n["x"]:.0f}" y="{n["y"]:.0f}" text-anchor="middle" dominant-baseline="central" fill="#222" font-family="system-ui,sans-serif" font-size="22" font-weight="600">{text}</text>')
        elif depth == 2:
            svg.append(f'<circle cx="{n["x"]:.0f}" cy="{n["y"]:.0f}" r="5" fill="{color}" opacity="0.6"/>')
            svg.append(f'<text x="{n["x"]+10:.0f}" y="{n["y"]:.0f}" dominant-baseline="central" fill="#333" font-family="system-ui,sans-serif" font-size="18">{text}</text>')
        else:
            svg.append(f'<circle cx="{n["x"]:.0f}" cy="{n["y"]:.0f}" r="3" fill="{color}" opacity="0.4"/>')
            svg.append(f'<text x="{n["x"]+8:.0f}" y="{n["y"]:.0f}" dominant-baseline="central" fill="#555" font-family="system-ui,sans-serif" font-size="14">{text}</text>')
    
    svg.append('</svg>')
    return '\n'.join(svg)

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('input', help='Input markdown file')
    parser.add_argument('output', help='Output SVG file')
    parser.add_argument('--width', type=int, default=3840)
    parser.add_argument('--height', type=int, default=2160)
    args = parser.parse_args()
    
    with open(args.input) as f:
        md = f.read()
    
    root = parse_md(md)
    svg = render_svg(root, args.width, args.height)
    
    with open(args.output, 'w') as f:
        f.write(svg)
    print(f'Generated {args.output} ({args.width}x{args.height})')
