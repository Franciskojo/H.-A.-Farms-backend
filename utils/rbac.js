export const permissions = [
    {
        role: "user",
        actions: [
            "get_profile",
            "get_products",
            "get_product_by_id",
            "update_profile",
            "get_cart",
            "remove_cart",
            "clear_cart",
            "add_to_cart",
            "checkout",
            "get",
            "get_order_id"
            
        ]
    },
    

    {
        role: "admin",
        actions: [
             "get_profile",
            "update_profile",
            "add_product",
            "update_product",
            "get_product_by_id",
            "get_products",
            "delete_product",
            "download_orders_csv",
            "download_oders_xlsx",
            "get_reports",
            "add_user",
            "update_user",
            "get_users",
            "change_user_role",
            "deactivate_user",
            "change_password",
            "change_email",
            "count_products",
            "get_cart",
            "remove_cart",
            "clear_cart",
            "add_to_cart"
        ]
    }
]