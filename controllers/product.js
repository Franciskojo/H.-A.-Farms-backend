import { ProductModel } from "../models/product.js";
import { productValidator, updateProductValidator } from "../validators/product.js";
import mongoose from 'mongoose';

export const addProduct = async (req, res, next) => {
  try {
    // ✅ Inject Cloudinary image URL into body before Joi validation
    if (req.file?.path) {
      req.body.productImage = req.file.path;
    }


    // ✅ Validate product input with Joi
    const { error, value } = productValidator.validate(req.body);
    if (error) {
      return res.status(422).json({ error: error.details[0].message });
    }

    // ✅ Create product with validated data
    const product = await ProductModel.create({
      ...value,
      createdBy: req.auth?.userId, // add optional chaining to be safe
    });

    // ✅ Respond with success
    res.status(201).json({
      message: `Product "${product.productName}" added successfully.`,
      product
    });

  } catch (error) {
    next(error);
  }
};



export const getProducts = async (req, res, next) => {
    try {
        const { filter = "{}", sort = "{}", limit = 15, skip = 0 } = req.query;
        // Fetch product from database
        const products = await ProductModel.find(JSON.parse(filter))
            .sort(JSON.parse(sort))
            .limit(limit)
            .skip(skip);
        // Return response
        res.status(200).json(products);
    } catch (error) {
        next(error);
    }
};

export const countProducts = async (req, res, next) => {
    try {
        const { filter = "{}" } = req.query;
        // Count products in database
        const count = await ProductModel.countdocuments(JSON.parse(filter));
        // Respond to request
        res.json({ count });
    } catch (error) {
        next(error);
    }
};

export const getProductById = async (req, res, next) => {
    try {
        // Fetch a product from database
        const product = await ProductModel.findById(req.params.id);
        // Return Response
        res.status(200).json(product);
    } catch (error) {
        next(error);
    }
};


export const updateProductById = async (req, res, next) => {
  try {
    // 1. Authentication Check
    if (!req.auth?.userId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // 2. Validate MongoDB ID Format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        error: 'Invalid product ID format',
        receivedId: req.params.id
      });
    }

    // 3. Parse Variants Safely
    if (req.body.variants && typeof req.body.variants === 'string') {
      try {
        req.body.variants = JSON.parse(req.body.variants);
      } catch (err) {
        return res.status(400).json({ 
          error: 'Invalid variants format',
          details: err.message
        });
      }
    }

    // 4. Handle Image Upload
    const productImageUrl = req.file?.path || req.body.productImage;
    if (!productImageUrl) {
      return res.status(400).json({ error: 'Product image is required' });
    }

    // 5. Prepare Update Payload
    const payload = {
      productName: req.body.productName,
      description: req.body.description,
      price: parseFloat(req.body.price),
      quantity: parseInt(req.body.quantity),
      category: req.body.category,
      status: req.body.status,
      variants: Array.isArray(req.body.variants) ? req.body.variants.map(variant => ({
        variantName: variant.variantName,
        variantPrice: parseFloat(variant.variantPrice) || 0,
        sku: variant.sku || '',
        quantity: parseInt(variant.quantity) || 0
      })) : [],
      productImage: productImageUrl
    };

    // 6. Validate Input
    const { error, value } = updateProductValidator.validate(payload);
    if (error) {
      return res.status(422).json({ 
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    // 7. Update Product
    const product = await ProductModel.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.auth.userId
      },
      value,
      { new: true, runValidators: true }
    ).lean();

    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found or not owned by user',
        productId: req.params.id,
        userId: req.auth.userId
      });
    }

    // 8. Success Response
    res.status(200).json({
      message: 'Product updated successfully',
      product
    });

  } catch (err) {
    console.error('[UPDATE PRODUCT ERROR]', {
      error: err,
      params: req.params,
      body: req.body,
      auth: req.auth,
      stack: err.stack
    });

    // Handle specific MongoDB errors
    if (err.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid data format',
        details: err.message,
        path: err.path
      });
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
      return res.status(422).json({
        error: 'Data validation failed',
        details: Object.values(err.errors).map(e => e.message)
      });
    }

    // Generic error handler
    next(err);
  }
};


export const deleteProductById = async (req, res, next) => {
  try {
    const product = await ProductModel.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.auth.userId, // ✅ FIXED
    });

    if (!product) {
      return res.status(404).json("Product not found!");
    }

    res.status(200).json("Product deleted.");
  } catch (error) {
    next(error);
  }
};

export const filterPaginateProducts = async (req, res) => {
    try {
        const { category, isOrganic, page = 1, limit = 10 } = req.query;

        // Build filter object based on query parameters
        const filters = {};
        if (category) filters.category = category;
        if (isOrganic !== undefined) filters.isOrganic = isOrganic;

        // Pagination calculations
        const skip = (page - 1) * limit;
        const products = await ProductModel.find(filters)
            .limit(Number(limit))
            .skip(skip);

        const total = await ProductModel.countDocuments(filters);

        res.json({
            products,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
            total,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




// GET /admin/products
export const getAdminProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            ProductModel.find()
                .select('_id productName price status quantity category productImage') // ✅ Keep _id
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            ProductModel.countDocuments()
        ]);

        res.json({
            products,
            page,
            totalPages: Math.ceil(total / limit),
            totalProducts: total
        });
    } catch (err) {
        console.error('[ADMIN GET PRODUCTS]', err);
        res.status(500).json({ message: 'Failed to load products' });
    }
};

// DELETE /admin/products/:id
export const deleteAdminProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        const deleted = await ProductModel.findByIdAndDelete(productId);
        if (!deleted) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error('[ADMIN DELETE PRODUCT]', err);
        res.status(500).json({ message: 'Failed to delete product' });
    }
};



