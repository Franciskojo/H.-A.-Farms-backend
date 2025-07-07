import { Router } from "express";
import { imageUpload } from "../middlewares/cloudinary.js";
import { isAuthenticated, hasPermission, adminOnly } from "../middlewares/auth.js";
import { addProduct, countProducts, deleteProductById, filterPaginateProducts, getAdminProducts, getProductById, getProducts, updateProductById } from "../controllers/product.js";


const productRouter = Router();


productRouter.post("/products", isAuthenticated, hasPermission("add_product"), imageUpload.single("productImage"), addProduct);


productRouter.get("/products", getProducts);

productRouter.get("/products/count", countProducts);

productRouter.get("/products/:id", getProductById);

productRouter.patch("/products/:id", isAuthenticated, hasPermission("update_product_by_id"), updateProductById);

productRouter.get("/products", filterPaginateProducts);



// for adminOnly
productRouter.get("/admin/products", isAuthenticated, hasPermission("get_admin_products"), adminOnly, getAdminProducts);

productRouter.delete("/admin/products/:productId", isAuthenticated, hasPermission("delete_product_by_productId"), adminOnly,  deleteProductById);


export default productRouter