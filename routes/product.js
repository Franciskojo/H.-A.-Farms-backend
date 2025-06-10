import { Router } from "express";
import { imageUpload } from "../middlewares/cloudinary.js";
import { isAuthenticated, hasPermission } from "../middlewares/auth.js";
import { addProduct, countProducts, deleteProductById, filterPaginateProducts, getProductById, getProducts, updateProductById } from "../controllers/product.js";


const productRouter = Router();


productRouter.post("/products", isAuthenticated, hasPermission("add_product"), imageUpload.single("productImage"), addProduct);


productRouter.get("/products", getProducts);

productRouter.get("/products/count", countProducts);

productRouter.get("/products/:id", getProductById);

productRouter.patch("/products/:id", isAuthenticated, hasPermission("update_asset_by_id"), updateProductById);

productRouter.delete("/products", isAuthenticated, hasPermission("delete_asset_by_id"), deleteProductById);

productRouter.get("/products", filterPaginateProducts);


export default productRouter