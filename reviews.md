# Unified Review System Implementation Plan

## Overview
This document outlines the plan to adapt existing review components to use a unified metaobject-based system, allowing reviews to be created once and populate multiple locations automatically.

---

## Current Review Components Inventory

| Component | File Path | Current Data Source |
|-----------|-----------|---------------------|
| **Testimonials Section** | `sections/testimonials.liquid` | Static blocks (author, text, rating, avatar, verified) |
| **Reviews Snippet** | `snippets/reviews.liquid` | Block settings (3 hardcoded reviews) |
| **Featured Review Slider** | `sections/ss-featured-review-slider.liquid` | Block quotes |
| **Facebook Testimonials** | `sections/facebook-testimonials.liquid` | Static blocks (post + comments structure) |
| **Trustpilot Reviews** | `sections/trustpilot-reviews.liquid` | Static blocks (stars, title, text, author) |
| **Review Avatars** | `snippets/review-avatars.liquid` | Block settings (5 avatars max) |
| **Product Page Reviews** | `main-product.liquid` block | Uses `product.metafields.reviews.rating` (Shopify's default) |

---

## The Problem

All components currently use **manually configured blocks** in the theme editor. You must configure each section independently, and there's no connection between:
- Reviews on product pages
- Featured testimonials on homepage
- Trustpilot-style review grids

---

## Phase 1: Metaobject Structure Setup

### Step 1.1: Create Review Metaobject Definition

In Shopify Admin, go to **Settings > Custom Data > Metaobjects** and create:

**Metaobject Name:** `Review` (handle: `review`)

| Field | Type | Validation | Purpose |
|-------|------|------------|---------|
| `reviewer_name` | Single-line text | Required | Display name |
| `star_rating` | Integer | Min: 1, Max: 5 | Star rating |
| `title` | Single-line text | Optional | Review headline |
| `review_text` | Multi-line text | Required | Full review content |
| `location` | Single-line text | Optional | Reviewer location (e.g., "New York, NY") |
| `product` | Product reference | Optional | Links review to product(s) |
| `verified_purchase` | Boolean | Default: false | Shows verified badge |
| `featured` | Boolean | Default: false | Include in homepage/carousels |
| `review_date` | Date | Default: Current date | When review was written |
| `avatar_image` | File (image) | Optional | Reviewer photo |

#### Required Review Data Fields Summary

Your reviews will contain all 8 required data points:

1. **Rating** → `star_rating` (Integer 1-5)
2. **Title** → `title` (Single-line text, optional)
3. **Review** → `review_text` (Multi-line text)
4. **Name** → `reviewer_name` (Single-line text)
5. **Verified Purchase** → `verified_purchase` (Boolean)
6. **Location** → `location` (Single-line text, optional)
7. **Avatar** → `avatar_image` (File/image)
8. **Product Link** → `product` (Product reference)

Additional fields for organization:
- `featured` - For homepage display
- `review_date` - When review was written

### Step 1.2: Create Product Metafield Definition

In Shopify Admin, go to **Settings > Custom Data > Metafields > Products** and create:

| Setting | Value |
|---------|-------|
| **Namespace** | `custom` |
| **Key** | `product_reviews` |
| **Name** | Product Reviews |
| **Type** | List of metaobjects |
| **Metaobject** | Review |
| **Storefront Access** | Public read |

---

## Phase 2: Section Adaptation Plan

### 2.1: sections/testimonials.liquid

#### Schema Additions

Add after the existing settings (around line 560):

```json
{
  "type": "header",
  "content": "Data Source"
},
{
  "type": "select",
  "id": "data_source",
  "label": "Data source",
  "options": [
    {"value": "blocks", "label": "Manual blocks"},
    {"value": "metaobjects", "label": "Product reviews (metaobjects)"}
  ],
  "default": "blocks"
},
{
  "type": "product",
  "id": "target_product",
  "label": "Target product (for metaobjects)",
  "info": "If left empty, will use the current product on product pages"
},
{
  "type": "checkbox",
  "id": "featured_only",
  "label": "Show only featured reviews",
  "default": false,
  "info": "Only applies when using metaobjects"
},
{
  "type": "range",
  "id": "max_reviews",
  "label": "Maximum reviews to show",
  "min": 1,
  "max": 20,
  "step": 1,
  "default": 6,
  "info": "Only applies when using metaobjects"
}
```

#### Liquid Logic Changes

Replace the block iteration (around line 384) with:

```liquid
{%- liquid
  assign reviews_to_render = ''

  if section.settings.data_source == 'metaobjects'
    if section.settings.target_product != blank
      assign reviews_source = section.settings.target_product.metafields.custom.product_reviews.value
    elsif product != blank
      assign reviews_source = product.metafields.custom.product_reviews.value
    else
      assign reviews_source = ''
    endif

    if section.settings.featured_only
      assign filtered_reviews = ''
      for review in reviews_source
        if review.featured
          assign filtered_reviews = filtered_reviews | append: review.handle | append: ','
        endif
      endfor
      assign reviews_source = filtered_reviews | split: ','
    endif

    if section.settings.max_reviews > 0
      assign reviews_source = reviews_source | slice: 0, section.settings.max_reviews
    endif
  else
    assign reviews_source = section.blocks
  endif
-%}

{%- for item in reviews_source -%}
  {%- liquid
    if section.settings.data_source == 'metaobjects'
      assign review_handle = item
      assign review_metaobject = shop.metaobjects.review[review_handle]

      assign block_image = review_metaobject.avatar_image
      assign block_video = ''
      assign block_title = review_metaobject.title
      assign block_text = review_metaobject.review_text
      assign block_author_avatar = review_metaobject.avatar_image
      assign block_author = review_metaobject.reviewer_name
      assign block_star_rating = review_metaobject.star_rating
      assign block_verified_purchase = review_metaobject.verified_purchase
      assign block_author_location = review_metaobject.location
    else
      assign block_image = item.settings.image
      assign block_video = item.settings.video
      assign block_title = item.settings.title
      assign block_text = item.settings.text
      assign block_author_avatar = item.settings.author_avatar
      assign block_author = item.settings.author
      assign block_star_rating = item.settings.star_rating
      assign block_verified_purchase = item.settings.verified_purchase
      assign block_author_location = item.settings.author_location
    endif
  -%}

  {% comment %} Rest of existing card rendering logic {% endcomment %}
{%- endfor -%}
```

---

### 2.2: snippets/reviews.liquid

#### Block Schema Additions (in main-product.liquid)

Add to the existing "reviews" block type (around line 4638):

```json
{
  "type": "select",
  "id": "data_source",
  "label": "Reviews source",
  "options": [
    {"value": "blocks", "label": "Manual configuration"},
    {"value": "metaobjects", "label": "From product metaobjects"}
  ],
  "default": "metaobjects"
},
{
  "type": "range",
  "id": "max_reviews",
  "label": "Maximum reviews to show",
  "min": 1,
  "max": 5,
  "step": 1,
  "default": 3
}
```

#### Liquid Logic Changes

At the top of `snippets/reviews.liquid`, add:

```liquid
{% liquid
  if block.settings.data_source == 'metaobjects' and product != blank
    assign product_reviews = product.metafields.custom.product_reviews.value
    assign max_reviews = block.settings.max_reviews | default: 3
    assign reviews_to_show = product_reviews | slice: 0, max_reviews

    assign items_count = 0
    for review in reviews_to_show
      assign items_count = items_count | plus: 1
    endfor
  else
    assign items_count = 0
    if block.settings.text_1 != blank
      assign items_count = items_count | plus: 1
    endif
    if block.settings.text_2 != blank
      assign items_count = items_count | plus: 1
    endif
    if block.settings.text_3 != blank
      assign items_count = items_count | plus: 1
    endif
  endif
%}
```

Replace the review loop (around line 89) with:

```liquid
{% if block.settings.data_source == 'metaobjects' %}
  {% for review in reviews_to_show %}
    {% liquid
      assign author = review.reviewer_name
      assign text = review.review_text
      assign image = review.avatar_image
    %}
    {% comment %} Render review item using existing HTML structure {% endcomment %}
  {% endfor %}
{% else %}
  {% comment %} Keep existing for loop for i in (1..items_count) {% endcomment %}
{% endif %}
```

---

### 2.3: sections/trustpilot-reviews.liquid

#### Schema Additions

Add after existing settings:

```json
{
  "type": "header",
  "content": "Data Source"
},
{
  "type": "select",
  "id": "data_source",
  "label": "Data source",
  "options": [
    {"value": "blocks", "label": "Manual blocks"},
    {"value": "metaobjects_all", "label": "All featured reviews"},
    {"value": "metaobjects_product", "label": "Specific product reviews"}
  ],
  "default": "blocks"
},
{
  "type": "product",
  "id": "target_product",
  "label": "Target product"
},
{
  "type": "range",
  "id": "max_reviews",
  "label": "Maximum reviews to show",
  "min": 1,
  "max": 20,
  "step": 1,
  "default": 6
}
```

#### Liquid Logic Changes

Replace block iteration with conditional logic similar to testimonials section.

---

### 2.4: sections/facebook-testimonials.liquid

#### Schema Additions

Same pattern - add data source toggle with metaobject options.

#### Note

Facebook testimonials have a unique structure (post + comments). May need separate metaobject or use structured text fields.

---

### 2.5: sections/ss-featured-review-slider.liquid

#### Schema Additions

```json
{
  "type": "header",
  "content": "Data Source"
},
{
  "type": "select",
  "id": "data_source",
  "label": "Data source",
  "options": [
    {"value": "blocks", "label": "Manual blocks"},
    {"value": "metaobjects", "label": "Featured reviews from metaobjects"}
  ],
  "default": "blocks"
},
{
  "type": "range",
  "id": "max_quotes",
  "label": "Maximum quotes",
  "min": 1,
  "max": 10,
  "step": 1,
  "default": 5
}
```

#### Liquid Logic

Filter reviews by `featured: true` when using metaobjects.

---

### 2.6: snippets/review-avatars.liquid

#### Block Schema Additions

Add to `main-product.liquid` review_avatars block:

```json
{
  "type": "select",
  "id": "avatar_source",
  "label": "Avatar source",
  "options": [
    {"value": "manual", "label": "Manual upload"},
    {"value": "metaobjects", "label": "From product reviews"}
  ],
  "default": "manual"
}
```

#### Liquid Logic Changes

When using metaobjects, pull first 5 avatars from `product.metafields.custom.product_reviews.value`.

---

## Phase 3: Admin Workflow (After Adaptation)

### Adding a Review Once

1. Go to **Settings > Custom Data > Metaobjects** in Shopify Admin
2. Click "Add entry" for the "Review" metaobject
3. Fill in all fields:
   - Reviewer name
   - Rating (1-5 stars)
   - Title (optional headline)
   - Review text
   - Location (optional, e.g., "New York, NY")
   - Select product(s) this review belongs to
   - Check "Verified purchase" if applicable
   - Check "Featured" if it should appear on homepage
   - Upload avatar image (optional)
   - Set review date
4. Save

### Result

The review automatically appears in:
- **Product page** - Shows in Reviews block via `product.metafields.custom.product_reviews`
- **Homepage testimonials** - Shows if `featured: true`
- **Trustpilot section** - Shows if featured and section uses metaobjects
- **Review avatars** - First 5 avatars display automatically

---

## Liquid Reference

### Accessing Reviews from Product

```liquid
{% assign reviews = product.metafields.custom.product_reviews.value %}

{% for review in reviews %}
  {{ review.reviewer_name }}
  {{ review.star_rating }}
  {{ review.title }}
  {{ review.review_text }}
  {{ review.location }}
  {{ review.verified_purchase }}
  {{ review.featured }}
  {{ review.review_date | date: "%B %d, %Y" }}

  {% if review.avatar_image %}
    {{ review.avatar_image | image_url: width: 150 | image_tag }}
  {% endif %}
{% endfor %}
```

### Calculating Average Rating

```liquid
{% assign total_rating = 0 %}
{% assign review_count = 0 %}

{% for review in reviews %}
  {% assign total_rating = total_rating | plus: review.star_rating %}
  {% assign review_count = review_count | plus: 1 %}
{% endfor %}

{% if review_count > 0 %}
  {% assign average_rating = total_rating | divided_by: review_count %}
  Average: {{ average_rating }} stars ({{ review_count }} reviews)
{% endif %}
```

### Filtering Featured Reviews

```liquid
{% assign featured_reviews = '' %}
{% for review in reviews %}
  {% if review.featured %}
    {% assign featured_reviews = featured_reviews | append: review | append: ',' %}
  {% endif %}
{% endfor %}
```

---

## Migration Strategy

### Option A: Gradual Migration

1. Set up metaobject structure
2. Add new data source settings to sections
3. Keep existing blocks as fallback
4. Slowly recreate reviews as metaobjects
5. Switch sections to use metaobjects one by one

### Option B: Bulk Migration

1. Export existing review data from theme customizer
2. Create metaobjects via Shopify Admin API
3. Update all sections at once
4. Remove old block data

---

## Files to Modify

1. `sections/testimonials.liquid` - Add data source toggle, conditional rendering
2. `snippets/reviews.liquid` - Add metaobject support
3. `sections/main-product.liquid` - Update block schemas
4. `sections/trustpilot-reviews.liquid` - Add data source toggle
5. `sections/facebook-testimonials.liquid` - Add data source toggle (optional)
6. `sections/ss-featured-review-slider.liquid` - Add data source toggle
7. `snippets/review-avatars.liquid` - Add avatar source toggle

---

## Testing Checklist

- [ ] Metaobject creation works in Shopify Admin
- [ ] Product metafield references metaobject correctly
- [ ] Testimonials section renders metaobject reviews
- [ ] Product page reviews block renders metaobject reviews
- [ ] Featured filter works correctly
- [ ] Max reviews limit works
- [ ] Avatar images display from metaobjects
- [ ] Location displays correctly
- [ ] Verified badge shows for verified purchases
- [ ] Fallback to blocks still works when selected
- [ ] Empty state handled gracefully

---

## Notes

- **No new components needed** - only modifications to existing files
- Keep backward compatibility - sections should still work with manual blocks
- All existing styling and animations preserved
- Metaobject approach allows for future extensibility (search, filtering, etc.)
- Consider adding "Review Source" field later (Trustpilot, Facebook, etc.) for styling variants
