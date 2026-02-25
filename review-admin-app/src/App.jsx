import React, { useState, useEffect, useCallback, useRef } from 'react';

// Configuration
const CONFIG = {
  shopDomain: 'porongas-2.myshopify.com',
  apiVersion: '2025-01',
};

// Star Rating Component
const StarRating = ({ rating, onChange, editable = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star ${(hoverRating || rating) >= star ? 'filled' : ''}`}
          onClick={() => editable && onChange && onChange(star)}
          onMouseEnter={() => editable && setHoverRating(star)}
          onMouseLeave={() => editable && setHoverRating(0)}
          disabled={!editable}
          style={{ background: 'none', border: 'none', padding: 0 }}
        >
          ★
        </button>
      ))}
    </div>
  );
};

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>
      {message}
    </div>
  );
};

// Review Form Component
const ReviewForm = ({ review, products, onSave, onCancel, loading: parentLoading }) => {
  const [formData, setFormData] = useState({
    reviewer_name: '',
    rating: 5,
    title: '',
    review_text: '',
    location: '',
    verified_purchase: false,
    featured: false,
    review_date: new Date().toISOString().split('T')[0],
    product_id: '',
    avatar_image_url: '',
    ...review,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(review?.avatar_image_url || '');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToShopify = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result.split(',')[1];
        const token = localStorage.getItem('shopify_access_token');

        try {
          const response = await fetch('http://localhost:3001/shopify/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: token,
              shop: CONFIG.shopDomain,
              filename: file.name,
              mimeType: file.type,
              base64Data: base64Data,
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Upload failed');
          }

          resolve({ url: data.file.url, id: data.file.id });
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let avatarUrl = formData.avatar_image_url;
    let avatarFileId = null;

    // If a file was selected, upload it to Shopify
    if (selectedFile) {
      setUploading(true);
      try {
        const uploadResult = await uploadImageToShopify(selectedFile);
        avatarUrl = uploadResult.url;
        avatarFileId = uploadResult.id; // This is the gid://shopify/MediaImage/... ID
      } catch (error) {
        alert('Failed to upload image: ' + error.message);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSave({
      ...formData,
      avatar_image_url: avatarUrl,
      avatar_file_id: avatarFileId,
    });
  };

  const isLoading = parentLoading || uploading;

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">
        {review?.id ? 'Edit Review' : 'Add New Review'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Reviewer Name */}
        <div>
          <label className="form-label">Reviewer Name *</label>
          <input
            type="text"
            required
            className="form-input"
            value={formData.reviewer_name}
            onChange={(e) => setFormData({ ...formData, reviewer_name: e.target.value })}
            placeholder="e.g., Sarah Johnson"
          />
        </div>

        {/* Rating */}
        <div>
          <label className="form-label">Rating *</label>
          <StarRating
            rating={formData.rating}
            onChange={(rating) => setFormData({ ...formData, rating })}
            editable
          />
        </div>

        {/* Title */}
        <div>
          <label className="form-label">Review Title</label>
          <input
            type="text"
            className="form-input"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Amazing product!"
          />
        </div>

        {/* Location */}
        <div>
          <label className="form-label">Location</label>
          <input
            type="text"
            className="form-input"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., New York, NY"
          />
        </div>

        {/* Product */}
        <div className="md:col-span-2">
          <label className="form-label">Product</label>
          <select
            className="form-input"
            value={formData.product_id}
            onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
          >
            <option value="">-- No specific product (general testimonial) --</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.title}
              </option>
            ))}
          </select>
        </div>

        {/* Review Date */}
        <div>
          <label className="form-label">Review Date</label>
          <input
            type="date"
            className="form-input"
            value={formData.review_date}
            onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
          />
        </div>

        {/* Avatar Image Upload */}
        <div>
          <label className="form-label">Avatar Image</label>

          {/* Preview */}
          {previewUrl && (
            <div className="mb-3">
              <img
                src={previewUrl}
                alt="Avatar preview"
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              />
            </div>
          )}

          {/* File Upload */}
          <div className="flex gap-2">
            <label className="btn-secondary cursor-pointer flex-1 text-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isLoading}
              />
              {selectedFile ? 'Change Image' : 'Upload Image'}
            </label>
          </div>

          {selectedFile && (
            <p className="text-xs text-green-600 mt-1">
              ✓ {selectedFile.name} selected (will upload on save)
            </p>
          )}

          <div className="mt-2 text-xs text-gray-500">
            — or use URL —
          </div>

          <input
            type="url"
            className="form-input mt-1"
            value={formData.avatar_image_url}
            onChange={(e) => {
              setFormData({ ...formData, avatar_image_url: e.target.value });
              setPreviewUrl(e.target.value);
              setSelectedFile(null);
            }}
            placeholder="https://..."
            disabled={!!selectedFile}
          />
        </div>

        {/* Checkboxes */}
        <div className="flex gap-6 md:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.verified_purchase}
              onChange={(e) => setFormData({ ...formData, verified_purchase: e.target.checked })}
              className="w-5 h-5 text-brand-500 rounded focus:ring-brand-500"
            />
            <span className="text-sm text-gray-700">Verified Purchase</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              className="w-5 h-5 text-brand-500 rounded focus:ring-brand-500"
            />
            <span className="text-sm text-gray-700">Featured (show on homepage)</span>
          </label>
        </div>

        {/* Review Text */}
        <div className="md:col-span-2">
          <label className="form-label">Review Text *</label>
          <textarea
            required
            rows={5}
            className="form-input resize-none"
            value={formData.review_text}
            onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
            placeholder="Write the review content here..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex items-center gap-2"
        >
          {isLoading && <div className="spinner" />}
          {uploading ? 'Uploading...' : (review?.id ? 'Update Review' : 'Create Review')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

// OAuth Settings Form
const SettingsForm = ({ onSave, onCancel }) => {
  const [clientId, setClientId] = useState(localStorage.getItem('shopify_client_id') || '');
  const [clientSecret, setClientSecret] = useState(localStorage.getItem('shopify_client_secret') || '');
  const [authCode, setAuthCode] = useState('');
  const [step, setStep] = useState('credentials'); // credentials -> authorize -> exchange
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [oauthUrl, setOauthUrl] = useState('');

  const startOAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Save credentials
      localStorage.setItem('shopify_client_id', clientId);
      localStorage.setItem('shopify_client_secret', clientSecret);

      // Get OAuth URL from proxy
      const response = await fetch(
        `http://localhost:3001/auth/start?shop=${CONFIG.shopDomain}&client_id=${clientId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start OAuth');
      }

      setOauthUrl(data.oauthUrl);
      setStep('authorize');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exchangeCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/auth/exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: authCode,
          client_id: clientId,
          client_secret: clientSecret,
          shop: CONFIG.shopDomain,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to exchange code');
      }

      // Save access token
      localStorage.setItem('shopify_access_token', data.access_token);
      localStorage.setItem('shopify_token_scope', data.scope);

      onSave(data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'authorize') {
    return (
      <div>
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Step 2: Authorize the App</h4>
          <p className="text-sm text-blue-600 mb-3">
            Click the button below to open Shopify authorization in a new tab.
            After authorizing, copy the code and paste it here.
          </p>
          <a
            href={oauthUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block btn-primary"
            onClick={() => setStep('exchange')}
          >
            Open Shopify Authorization
          </a>
        </div>

        <button
          onClick={() => setStep('credentials')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to credentials
        </button>
      </div>
    );
  }

  if (step === 'exchange') {
    return (
      <form onSubmit={exchangeCode}>
        <div className="mb-4">
          <label className="form-label">Authorization Code</label>
          <input
            type="text"
            required
            className="form-input font-mono"
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value)}
            placeholder="Paste the code from the authorization page"
          />
          <p className="text-xs text-gray-500 mt-1">
            Copy the code shown after you authorized the app
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            Error: {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading && <div className="spinner" />}
            Complete Connection
          </button>
          <button
            type="button"
            onClick={() => setStep('authorize')}
            className="btn-secondary"
          >
            Back
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={startOAuth}>
      <div className="mb-4">
        <label className="form-label">Client ID</label>
        <input
          type="text"
          required
          className="form-input font-mono"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="e.g., ad8629c6cd8c998b371415ba090f70e2"
        />
      </div>

      <div className="mb-4">
        <label className="form-label">Client Secret</label>
        <input
          type="password"
          required
          className="form-input font-mono"
          value={clientSecret}
          onChange={(e) => setClientSecret(e.target.value)}
          placeholder="shpss_..."
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          Error: {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          {loading && <div className="spinner" />}
          Start Authorization
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">How to get your credentials:</h4>
        <ol className="text-sm text-gray-600 space-y-1.5 list-decimal list-inside">
          <li>Go to <a href="https://partners.shopify.com" target="_blank" rel="noopener" className="text-brand-600 hover:underline">Shopify Partners</a></li>
          <li>Click "Apps" → Your Custom App</li>
          <li>Go to "Settings" tab (you're already there in the screenshot)</li>
          <li>Copy the "Client ID" and "Secret" shown in the Credentials section</li>
          <li>Paste them here and click "Start Authorization"</li>
        </ol>
      </div>
    </form>
  );
};

// Main App Component
function App() {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFeatured, setFilterFeatured] = useState(false);
  const [toast, setToast] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('shopify_access_token') || '');
  const hasLoaded = useRef(false);

  // Show toast message
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Shopify Admin API request helper via proxy
  const shopifyRequest = useCallback(async (query, variables = {}) => {
    // Get token directly from localStorage to avoid stale closure
    const token = localStorage.getItem('shopify_access_token');
    if (!token) {
      throw new Error('No access token configured');
    }

    const response = await fetch('http://localhost:3001/shopify/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: token,
        shop: CONFIG.shopDomain,
        query,
        variables,
      }),
    });

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    return data.data;
  }, []);

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    try {
      const query = `
        query {
          metaobjects(type: "review", first: 100) {
            edges {
              node {
                id
                handle
                fields {
                  key
                  value
                }
              }
            }
          }
        }
      `;

      const data = await shopifyRequest(query);
      const formattedReviews = data.metaobjects.edges.map(({ node }) => {
        const fields = {};
        node.fields.forEach((field) => {
          fields[field.key] = field.value;
        });
        return {
          id: node.id,
          handle: node.handle,
          ...fields,
        };
      });

      setReviews(formattedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      showToast('Failed to load reviews: ' + error.message, 'error');
    }
  }, [shopifyRequest]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const query = `
        query {
          products(first: 250) {
            edges {
              node {
                id
                title
                handle
              }
            }
          }
        }
      `;

      const data = await shopifyRequest(query);
      setProducts(data.products.edges.map(({ node }) => node));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, [shopifyRequest]);

  // Initial load - only run once
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    if (accessToken) {
      setLoading(true);
      Promise.all([fetchReviews(), fetchProducts()]).then(() => setLoading(false));
    } else {
      setShowSettings(true);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create or update review
  const saveReview = async (formData) => {
    setSaving(true);
    try {
      const fields = [
        { key: 'reviewer_name', value: formData.reviewer_name },
        { key: 'star_rating', value: String(formData.rating) },
        { key: 'review_text', value: formData.review_text },
        { key: 'review_title', value: formData.title || '' },
        { key: 'location', value: formData.location || '' },
        { key: 'verified_purchase', value: String(formData.verified_purchase) },
        { key: 'featured', value: String(formData.featured) },
        { key: 'review_date', value: formData.review_date },
        { key: 'avatar_image', value: formData.avatar_file_id || '' },
      ];

      if (formData.product_id) {
        fields.push({ key: 'product', value: formData.product_id });
      }

      if (editingReview?.id) {
        // Update existing review
        const mutation = `
          mutation($id: ID!, $metaobject: MetaobjectUpdateInput!) {
            metaobjectUpdate(id: $id, metaobject: $metaobject) {
              metaobject {
                id
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        const result = await shopifyRequest(mutation, {
          id: editingReview.id,
          metaobject: { fields },
        });

        if (result.metaobjectUpdate.userErrors.length > 0) {
          throw new Error(result.metaobjectUpdate.userErrors[0].message);
        }

        showToast('Review updated successfully!');
      } else {
        // Create new review
        const mutation = `
          mutation($metaobject: MetaobjectCreateInput!) {
            metaobjectCreate(metaobject: $metaobject) {
              metaobject {
                id
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        const result = await shopifyRequest(mutation, {
          metaobject: {
            type: 'review',
            handle: `review-${Date.now()}`,
            fields,
          },
        });

        if (result.metaobjectCreate.userErrors.length > 0) {
          throw new Error(result.metaobjectCreate.userErrors[0].message);
        }

        showToast('Review created successfully!');
      }

      await fetchReviews();
      setShowForm(false);
      setEditingReview(null);
    } catch (error) {
      console.error('Error saving review:', error);
      showToast('Error: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete review
  const deleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      const mutation = `
        mutation($id: ID!) {
          metaobjectDelete(id: $id) {
            deletedId
            userErrors {
              field
              message
            }
          }
        }
      `;

      const result = await shopifyRequest(mutation, { id });

      if (result.metaobjectDelete.userErrors.length > 0) {
        throw new Error(result.metaobjectDelete.userErrors[0].message);
      }

      showToast('Review deleted successfully!');
      await fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      showToast('Error deleting review: ' + error.message, 'error');
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.reviewer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.review_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.review_title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFeatured = !filterFeatured || review.featured === 'true';

    return matchesSearch && matchesFeatured;
  });

  // Save access token from settings
  const saveAccessToken = useCallback((token) => {
    setAccessToken(token);
    setShowSettings(false);
    setLoading(true);
    Promise.all([fetchReviews(), fetchProducts()]).then(() => setLoading(false));
  }, [fetchReviews, fetchProducts]);

  // Disconnect / clear credentials
  const disconnect = useCallback(() => {
    localStorage.removeItem('shopify_client_id');
    localStorage.removeItem('shopify_client_secret');
    localStorage.removeItem('shopify_access_token');
    localStorage.removeItem('shopify_token_scope');
    setAccessToken('');
    setShowSettings(true);
    setReviews([]);
    setProducts([]);
    hasLoaded.current = false;
    showToast('Disconnected from Shopify');
  }, []);

  if (showSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full">
          <h1 className="text-2xl font-bold mb-2 text-gray-800">DuraCalm Review Admin</h1>
          <p className="text-gray-600 mb-6">
            Connect to your Shopify store to manage reviews.
          </p>

          <SettingsForm
            onSave={saveAccessToken}
            onCancel={accessToken ? () => setShowSettings(false) : null}
          />
        </div>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">DuraCalm Reviews</h1>
            <p className="text-gray-600 mt-1">Manage product reviews and testimonials</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className="btn-secondary"
            >
              Settings
            </button>
            <button
              onClick={disconnect}
              className="btn-secondary text-red-600 hover:bg-red-50"
            >
              Disconnect
            </button>
            <button
              onClick={() => {
                setEditingReview(null);
                setShowForm(true);
              }}
              className="btn-primary"
            >
              + Add Review
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-8">
            <ReviewForm
              review={editingReview}
              products={products}
              onSave={saveReview}
              onCancel={() => {
                setShowForm(false);
                setEditingReview(null);
              }}
              loading={saving}
            />
          </div>
        )}

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search reviews..."
              className="form-input md:flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={filterFeatured}
                onChange={(e) => setFilterFeatured(e.target.checked)}
                className="w-5 h-5 text-brand-500 rounded focus:ring-brand-500"
              />
              <span className="text-sm text-gray-700">Featured only</span>
            </label>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card py-4">
            <div className="text-3xl font-bold text-brand-500">{reviews.length}</div>
            <div className="text-sm text-gray-600">Total Reviews</div>
          </div>
          <div className="card py-4">
            <div className="text-3xl font-bold text-brand-500">
              {reviews.filter((r) => r.featured === 'true').length}
            </div>
            <div className="text-sm text-gray-600">Featured</div>
          </div>
          <div className="card py-4">
            <div className="text-3xl font-bold text-brand-500">
              {reviews.filter((r) => r.verified_purchase === 'true').length}
            </div>
            <div className="text-sm text-gray-600">Verified</div>
          </div>
          <div className="card py-4">
            <div className="text-3xl font-bold text-brand-500">
              {reviews.length > 0
                ? (reviews.reduce((acc, r) => acc + (parseInt(r.star_rating) || 0), 0) / reviews.length).toFixed(1)
                : '0.0'}
            </div>
            <div className="text-sm text-gray-600">Avg Rating</div>
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="card text-center py-12">
            <div className="spinner mx-auto mb-4" />
            <p className="text-gray-600">Loading reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">No reviews found.</p>
            <button
              onClick={() => {
                setEditingReview(null);
                setShowForm(true);
              }}
              className="btn-primary mt-4"
            >
              Create your first review
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div key={review.id} className="card hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {review.avatar_image ? (
                      <img
                        src={review.avatar_image}
                        alt={review.reviewer_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-500 text-xl font-semibold">
                        {review.reviewer_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-800">{review.reviewer_name}</h3>
                      {review.location && (
                        <span className="text-sm text-gray-500">• {review.location}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <StarRating rating={parseInt(review.star_rating) || 0} />
                      {review.verified_purchase === 'true' && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Verified
                        </span>
                      )}
                      {review.featured === 'true' && (
                        <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                          Featured
                        </span>
                      )}
                    </div>

                    {review.review_title && (
                      <h4 className="font-medium text-gray-800 mb-1">{review.review_title}</h4>
                    )}

                    <p className="text-gray-600 text-sm line-clamp-3">{review.review_text}</p>

                    {review.product_id && (
                      <p className="text-xs text-gray-500 mt-2">
                        Product: {products.find((p) => p.id === review.product_id)?.title || 'Unknown'}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-2">
                    <button
                      onClick={() => {
                        setEditingReview(review);
                        setShowForm(true);
                        window.scrollTo(0, 0);
                      }}
                      className="btn-secondary text-sm py-1.5 px-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteReview(review.id)}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default App;
