export const permissions = [
  {
    role: "user",
    actions: [
      "get_profile",
      "update_profile",
      "get_products",
      "get_product_by_id",
      "add_to_cart",
      "update_cart_item",
      "get_cart",
      "remove_cart",
      "clear_cart",
      "checkout",
      "get",
      "get_order_by_id",
      "get_user_orders",
      "get_order_details"
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
      "count_products",
      "download_orders_csv",
      "download_orders_xlsx",
      "get_reports",
      "add_user",
      "update_user",
      "get_users",
      "update_user_role",
      "deactivate_user",
      "change_password",
      "change_email",
      "add_to_cart",
      "update_cart_item",
      "get_cart",
      "remove_cart",
      "clear_cart",
      "get_all_orders",
      "update_order_status",
      "get_summary"
    ]
  }
];
