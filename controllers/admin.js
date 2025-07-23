import { OrderModel } from '../models/order.js';
import { ProductModel } from '../models/product.js';
import { UserModel } from '../models/user.js';

export const getAdminSummary = async (req, res) => {
  try {
    const { range, start, end } = req.query;

    // 1. Date range
    let startDate;
    if (range === 'month') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 29);
    } else if (range === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
    } else if (start && end) {
      startDate = new Date(start);
    } else {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 6); // default: week
    }

    const endDate = end ? new Date(end + 'T23:59:59') : new Date();

    // 2. Total revenue
    const revenueAgg = await OrderModel.aggregate([
      { $match: { status: { $nin: ['cancelled'] } } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);
    const totalRevenue = revenueAgg?.[0]?.total ?? 0;

    // 3. Counts
    const [totalOrders, totalProducts, totalUsers] = await Promise.all([
      OrderModel.countDocuments(),
      ProductModel.countDocuments(),
      UserModel.countDocuments({ role: { $ne: 'admin' } })
    ]);

    // 4. Recent orders
    const recentOrdersRaw = await OrderModel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email profilePicture');

    const recentOrders = recentOrdersRaw.map(order => ({
      _id: order._id,
      user: order.user ? {
        name: order.user.name,
        email: order.user.email,
        profilePicture: order.user.profilePicture
      } : {
        name: 'Guest',
        email: '',
        profilePicture: ''
      },
      createdAt: order.createdAt,
      total: order.total,
      status: order.status
    }));

    // 5. Sales chart (monthly)
const salesData = await OrderModel.aggregate([
  {
    $match: {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $nin: ['cancelled'] }
    }
  },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, 
      monthlySales: { $sum: "$total" } 
    }
  },
  { $sort: { _id: 1 } } 
]);

const salesChartData = {
  labels: salesData.map(m => m._id),            
  data: salesData.map(m => m.monthlySales)
};

    // 6. Revenue sources chart (by product category)
const categoryRevenue = await OrderModel.aggregate([
  { $match: { status: { $nin: ['cancelled'] } } },  
  { $unwind: "$items" },                            
  {
    $lookup: {
      from: "products",            
      localField: "items.productId",
      foreignField: "_id",
      as: "productInfo"
    }
  },
  { $unwind: "$productInfo" },                     
  {
    $group: {
      _id: "$productInfo.category",                
      amount: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
    }
  },
  { $sort: { amount: -1 } }                        
]);

const revenueSources = {
  labels: categoryRevenue.map(c => c._id),
  data: categoryRevenue.map(c => c.amount)
};

    // ✅ Response
    res.json({
      totalRevenue,
      totalOrders,
      totalProducts,
      totalUsers,
      recentOrders,
      salesChartData: salesChartData.labels?.length ? salesChartData : { labels: [], data: [] },
      revenueSources: revenueSources.labels?.length ? revenueSources : { labels: [], data: [] }
    });

  } catch (err) {
    console.error('[ADMIN SUMMARY ERROR]', err);
    res.status(500).json({ message: 'Failed to load admin summary' });
  }
};
