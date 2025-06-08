export const permissions = [
    {
        role: "user",
        actions: [
            "get_profile",
            "get_products",
            "get_product_by_id",
            "update_profile"
            
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
            // "download_assets_csv",
            // "download_assets_xlsx",
            "get_reports",
            "add_user",
            "update_user",
            "get_users",
            "change_user_role",
            "deactivate_user",
            "change_password",
            "change_email",
            "count_products",
        ]
    }
]