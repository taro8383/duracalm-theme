# Metaobject Setup via GraphQL Admin API

If the TOML approach doesn't work with your Shopify CLI version, use these GraphQL mutations in the Shopify GraphiQL App or Admin API.

## Step 1: Create the Review Metaobject Definition

```graphql
mutation CreateReviewMetaobjectDefinition {
  metaobjectDefinitionCreate(
    definition: {
      name: "Review"
      type: "custom.review"
      access: {
        admin: MERCHANT_READ_WRITE
        storefront: PUBLIC_READ
      }
      fieldDefinitions: [
        {
          key: "reviewer_name"
          name: "Reviewer Name"
          type: "single_line_text_field"
          required: true
        }
        {
          key: "star_rating"
          name: "Rating"
          type: "number_integer"
          required: true
          validations: [
            { name: "min", value: "1" }
            { name: "max", value: "5" }
          ]
        }
        {
          key: "title"
          name: "Review Title"
          type: "single_line_text_field"
          required: false
        }
        {
          key: "review_text"
          name: "Review Text"
          type: "multi_line_text_field"
          required: true
        }
        {
          key: "location"
          name: "Location"
          type: "single_line_text_field"
          required: false
        }
        {
          key: "product"
          name: "Product"
          type: "product_reference"
          required: false
        }
        {
          key: "verified_purchase"
          name: "Verified Purchase"
          type: "boolean"
          required: false
        }
        {
          key: "featured"
          name: "Featured Review"
          type: "boolean"
          required: false
        }
        {
          key: "review_date"
          name: "Review Date"
          type: "date"
          required: false
        }
        {
          key: "avatar_image"
          name: "Avatar Image"
          type: "file_reference"
          required: false
          validations: [
            { name: "file_type_options", value: "[\\"image\\"]" }
          ]
        }
      ]
    }
  ) {
    metaobjectDefinition {
      id
      type
      name
      fieldDefinitions {
        key
        name
        type {
          name
        }
      }
    }
    userErrors {
      field
      message
      code
    }
  }
}
```

## Step 2: Get the Metaobject Definition ID

Run this query to get the ID of your newly created Review metaobject:

```graphql
query GetReviewMetaobjectDefinition {
  metaobjectDefinitions(first: 10, query: "type:custom.review") {
    edges {
      node {
        id
        type
        name
      }
    }
  }
}
```

Copy the `id` (it will look like `gid://shopify/MetaobjectDefinition/123456789`).

## Step 3: Create the Product Metafield Definition

Replace `YOUR_METAOBJECT_DEFINITION_ID` with the ID from Step 2:

```graphql
mutation CreateProductReviewsMetafieldDefinition {
  metafieldDefinitionCreate(
    definition: {
      name: "Product Reviews"
      namespace: "custom"
      key: "product_reviews"
      description: "Collection of customer reviews for this product"
      type: "list.metaobject_reference"
      ownerType: PRODUCT
      access: {
        admin: MERCHANT_READ_WRITE
        storefront: PUBLIC_READ
      }
      validations: [
        {
          name: "metaobject_definition_id"
          value: "YOUR_METAOBJECT_DEFINITION_ID"
        }
      ]
    }
  ) {
    createdDefinition {
      id
      namespace
      key
      name
      type
    }
    userErrors {
      field
      message
      code
    }
  }
}
```

## Step 4: Verify Setup

Run this query to confirm everything is set up:

```graphql
query VerifySetup {
  metaobjectDefinitions(first: 1, query: "type:custom.review") {
    edges {
      node {
        id
        type
        name
        fieldDefinitions {
          key
          name
          type {
            name
          }
        }
      }
    }
  }
  metafieldDefinitions(first: 1, ownerType: PRODUCT, query: "namespace:custom key:product_reviews") {
    edges {
      node {
        id
        namespace
        key
        name
        type
      }
    }
  }
}
```

## Step 5: Create Sample Review (Optional)

Once the structure is set up, create your first review:

```graphql
mutation CreateSampleReview($productId: ID!) {
  metaobjectCreate(
    metaobject: {
      type: "custom.review"
      handle: "review-001"
      fields: [
        { key: "reviewer_name", value: "Jane Smith" }
        { key: "star_rating", value: "5" }
        { key: "title", value: "Amazing product!" }
        { key: "review_text", value: "This has completely changed my daily routine. Highly recommend!" }
        { key: "location", value: "New York, NY" }
        { key: "product", value: $productId }
        { key: "verified_purchase", value: "true" }
        { key: "featured", value: "true" }
        { key: "review_date", value: "2024-01-15" }
      ]
    }
  ) {
    metaobject {
      id
      handle
      type
      fields {
        key
        value
      }
    }
    userErrors {
      field
      message
    }
  }
}
```

Variables:
```json
{
  "productId": "gid://shopify/Product/YOUR_PRODUCT_ID"
}
```

## How to Run These Queries

### Option A: Shopify GraphiQL App (Easiest)
1. Go to your Shopify Admin
2. Go to Apps → search for "GraphiQL" and install it
3. Open the app and paste the mutations
4. Click the Play button

### Option B: Admin API via Postman/cURL
1. Create a private app with Admin API access
2. Get your Admin API access token
3. Send POST requests to: `https://YOUR_STORE.myshopify.com/admin/api/2024-01/graphql.json`
4. Include header: `X-Shopify-Access-Token: YOUR_TOKEN`

### Option C: Shopify CLI
If you have a development store and CLI access:
```bash
shopify app dev
# Then use the GraphiQL interface at the provided ngrok URL
```
