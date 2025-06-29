import { ProductModel } from "../models/product.js";
import { productValidator, updateProductValidator } from "../validators/product.js";

export const addProduct = async (req, res, next) => {
    try {
        // ✅ Parse variants if it exists and is a string
        if (req.body.variants && typeof req.body.variants === 'string') {
            try {
                req.body.variants = JSON.parse(req.body.variants);
            } catch (err) {
                return res.status(400).json({ error: "Invalid JSON in variants field" });
            }
        }

        // ✅ Validate input after parsing
        const { error, value } = productValidator.validate(req.body);
        if (error) {
            return res.status(422).json({ error: error.details[0].message });
        }

        // ✅ Create product
        const productImageUrl = req.file?.path;
        const product = await ProductModel.create({
            ...value,
            productImage: productImageUrl || value.productImage,
            createdBy: req.auth.id?.id
        });

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
    // Authorization check
    if (!req.auth || !req.auth.id) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Validate request body
    const { error, value } = updateProductValidator.validate({
      ...req.body,
      images: req.file?.path, // optional file support
    });

    if (error) {
      return res.status(422).json({ error: error.details });
    }

    // Update the product
    const product = await ProductModel.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.auth.userId,
      },
      value,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json({ message: 'Product updated successfully', product });
  } catch (err) {
    next(err); // pass to error-handling middleware
  }
};


export const deleteProductById = async (req, res, next) => {
    try {
        const product = await ProductModel.findByIdAndDelete({
            _id: req.params.id,
            user: req.auth.userId
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


