# Failed Attempts Log: Rating Stars vs Inventory Alignment

## Issue Description
The text "(136 Reviews)" in the Rating Stars block and "23 in stock" in the Inventory block are not vertically aligned. The Inventory text appears slightly lower than the Rating Stars text. Both blocks are in the same grid row in the Product Information section.

## Failed Attempts

### Attempt 1: Add display: flex and align-items: center to Rating Stars block
**What I did:**
```css
#ProductInfo-{{ section.id }} [data-block-type="rating_stars"] {
  display: flex !important;
  align-items: center !important;
}
```

**Why it failed:**
This caused the Rating Stars block and Inventory block to merge onto the same line, displaying as "(136 Reviews)23 in stock" instead of remaining in their separate grid positions. Changing the display property of a grid item from its default to flex disrupted the grid layout.

### Attempt 2: Add line-height: 1 to both blocks
**What I did:**
```css
#ProductInfo-{{ section.id }} [data-block-type="rating_stars"] .rating-stars__label {
  line-height: 1 !important;
  vertical-align: middle !important;
  display: inline-block !important;
}

#ProductInfo-{{ section.id }} [data-block-type="inventory"] {
  line-height: 1 !important;
}
```

**Why it failed:**
Did not solve the alignment issue. The text was still at different vertical positions. The line-height adjustment wasn't the root cause.

### Attempt 3: Add height: 100% and align-items: center to inner container
**What I did:**
```css
#ProductInfo-{{ section.id }} [data-block-type="rating_stars"] .rating-stars-and-text {
  height: 100% !important;
  align-items: center !important;
}
```

**Why it failed:**
The .rating-stars-and-text container already has flex-center class which includes align-items: center. Adding these properties didn't change the alignment because the inner flex container was already centered - the issue is at the block level.

## Root Cause Analysis

The actual problem appears to be that:
1. The Inventory block uses `display: flex` with `align-items: center` at the block level
2. The Rating Stars block relies on an inner flex container (.rating-stars-and-text) for alignment
3. Both blocks have different internal structures that result in different text baselines

The Rating Stars block structure:
- Block level: default display (not flex)
- Inner: .rating-stars-and-text (flex container with stars + text)

The Inventory block structure:
- Block level: flex container with icon + text
- Inner: direct children (no inner flex wrapper)

## What Should Actually Be Fixed

The fix needs to ensure both blocks position their text at the same vertical offset WITHOUT:
1. Changing the block display to flex (causes grid collapse)
2. Affecting the internal layout of either block

Possible approaches to try:
1. Check if both blocks have the same computed height and padding
2. Add consistent padding-top or margin-top to align text baselines
3. Check if the Inventory block's flex alignment needs adjustment
4. Look at the actual computed styles in DevTools to see the exact pixel difference

## Lessons Learned

1. Don't add `display: flex` to grid items without considering the layout impact
2. CSS `line-height` and `vertical-align` don't always solve alignment issues
3. Need to understand the DOM structure of both elements before applying fixes
4. Should check computed styles in DevTools first to identify the exact pixel difference
