# Review Management Guide

## Current Method: Creating Reviews in Shopify Admin

### Step-by-Step Instructions

#### Step 1: Navigate to Metaobjects
1. Log into your Shopify Admin (https://admin.shopify.com/store/porongas-2)
2. In the left sidebar, click **Settings** (bottom left, gear icon)
3. In the Settings menu, click **Custom Data**
4. Click **Metaobjects**
5. You should see "Review" in the list (if you created it already)

#### Step 2: Create a New Review
1. Click on **Review** from the list
2. Click the **Add entry** button (top right)
3. Fill out the form:

**Required Fields (must be filled):**
- **Reviewer Name** - The customer's name (e.g., "Sarah Johnson")
- **Rating** - Number from 1 to 5 (use 5 for 5-star reviews)
- **Review Text** - The actual review content (multi-line text field)

**Optional Fields:**
- **Title** - Optional headline for the review (e.g., "Amazing product!")
- **Location** - Customer's location (e.g., "New York, NY" or "California")
- **Product** - Click the field and search/select the product this review is for
  - This links the review to the product page
  - You can leave this empty for general testimonials
- **Verified Purchase** - Check this box if the customer actually bought the product
- **Featured** - Check this box to show the review on homepage sections
- **Review Date** - Defaults to today, but you can change it
- **Avatar Image** - Upload a customer photo (square image works best)

4. Click **Save**

#### Step 3: View the Review on Your Store
1. If you selected a **Product**, go to that product page
2. The review should appear in:
   - Product page reviews section (if using metaobjects source)
   - Any section set to show product reviews
   - Homepage testimonials (if "Featured" is checked)

#### Step 4: Edit or Delete Reviews
1. Go back to **Settings > Custom Data > Metaobjects > Review**
2. You'll see a list of all reviews
3. Click any review to edit it
4. To delete: Open the review, scroll down, click **Delete entry**

---

## The Problem with Current Method

The Shopify Admin metaobject interface is:
- **Slow** - Multiple clicks to navigate, page reloads
- **Not visual** - Can't see how reviews will look
- **No bulk operations** - Create one by one only
- **No preview** - Can't test before publishing
- **Scattered** - Reviews are in Settings, not with products

---

## Solution Options for a Better Interface

### Option 1: Custom Shopify App (Recommended)

Build a custom Shopify Embedded App that appears inside your Admin.

**Features:**
- Form to add/edit reviews with live preview
- List view of all reviews with filters
- Bulk import/export (CSV)
- Direct product linking with autocomplete
- Drag-and-drop image upload
- Star rating picker (visual)
- Bulk actions (delete multiple, toggle featured)

**Pros:**
- Native Shopify experience
- Can be published to Shopify App Store later
- Secure (uses Shopify's authentication)
- Real-time preview

**Cons:**
- Requires development time (~1-2 weeks)
- Needs hosting (can use free tier initially)

**Estimated Cost:**
- Development: 20-30 hours
- Hosting: $0-10/month (Cloudflare Workers, Vercel, or Fly.io)

---

### Option 2: Custom Admin Page Within Theme

Create a password-protected page in your theme that acts as a review management interface.

**How it works:**
1. Create a new page template: `templates/page.reviews-admin.liquid`
2. Build a form that uses Shopify's Storefront API or AJAX API
3. Use JavaScript to create/update metaobjects
4. Add password protection or IP restriction

**Pros:**
- No external hosting needed
- Uses existing theme infrastructure
- Quick to implement (~1 week)

**Cons:**
- Limited by Shopify's API (can't create metaobjects directly from storefront)
- Would need to use a workaround (create as draft orders or use a private app)
- Less secure than a proper app

---

### Option 3: Use a Spreadsheet + Import Script

Create reviews in a Google Sheet or Excel file, then import them.

**Workflow:**
1. Create a spreadsheet with columns:
   - reviewer_name
   - star_rating
   - title
   - review_text
   - location
   - product_handle
   - verified_purchase (true/false)
   - featured (true/false)
   - review_date
   - avatar_image_url

2. Use a script or Shopify Admin API to bulk import

**Pros:**
- Fastest for bulk creation
- Can copy/paste from existing reviews
- Team can work in parallel

**Cons:**
- No image upload (need URLs)
- Technical to set up initially
- No real-time preview

**Implementation:**
I can create a Node.js script that reads a CSV and creates metaobjects via Shopify Admin API.

---

### Option 4: Third-Party Review App with Metaobject Sync

Use an existing review app (like Judge.me, Loox, or Yotpo) and sync to metaobjects.

**Pros:**
- User-friendly interfaces already built
- Customer-facing review collection
- Photo reviews, video reviews
- Email review requests

**Cons:**
- Monthly cost ($15-50/month)
- May not sync perfectly with your metaobject structure
- Less control over styling

---

## My Recommendation

**Start with Option 3 (Spreadsheet + Import)** for bulk importing existing reviews, then build **Option 1 (Custom App)** for ongoing management.

### Immediate Solution: CSV Import Script

I can build you a script that:
1. Reads a CSV file with review data
2. Downloads avatar images
3. Creates metaobjects via Shopify Admin API
4. Links to products automatically
5. Sets all fields (verified, featured, etc.)

**CSV Format:**
```csv
reviewer_name,star_rating,title,review_text,location,product_handle,verified_purchase,featured,review_date,avatar_url
Sarah Johnson,5,Amazing product!,This changed my life...,New York NY,duracalm-relief-cream,true,true,2024-01-15,https://example.com/sarah.jpg
John Doe,4,Great but pricey,Works well but...,California,,true,false,2024-01-10,
```

### Long-term Solution: Custom Shopify App

Build an embedded app with:
- Modern React interface
- Visual star rating selector
- Product autocomplete
- Image upload with preview
- List view with search/filter
- Bulk operations

---

## Next Steps

Which option would you like me to implement?

1. **CSV Import Script** - Send me your reviews in a spreadsheet and I'll import them
2. **Custom App** - I can build a basic review management app
3. **Both** - Start with CSV import, then build the app
4. **Something else** - Describe what you have in mind

Do you have existing reviews somewhere that need to be imported? If so, where are they currently stored (old website, spreadsheet, manually in theme, etc.)?
