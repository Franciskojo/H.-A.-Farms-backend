import { OrderModel } from '../models/order.js';
import { ProductModel } from '../models/product.js';
import { UserModel } from '../models/user.js';

export const getAdminSummary = async (req, res) => {
  try {
    const { range, start, end } = req.query;

    // 1. Determine date range
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
      startDate.setDate(startDate.getDate() - 6); // default to week
    }

    const endDate = end ? new Date(end + 'T23:59:59') : new Date();

    // 2. Revenue aggregation
    const revenueAgg = await OrderModel.aggregate([
      { $match: { status: { $nin: ['cancelled'] } } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // 3. Counts
    const [totalOrders, totalProducts, totalUsers] = await Promise.all([
      OrderModel.countDocuments(),
      ProductModel.countDocuments(),
      UserModel.countDocuments({ role: { $ne: 'admin' } }),
    ]);

    // 4. Recent orders
    const recentOrders = await OrderModel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'fullName');

    const formattedOrders = recentOrders.map(order => ({
      _id: order._id,
      customerName: order.userId?.fullName || 'Guest',
      createdAt: order.createdAt,
      total: order.total,
      status: order.status
    }));

    // 5. Sales chart
    const salesData = await OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $nin: ['cancelled'] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          dailySales: { $sum: "$total" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const salesChartData = {
      labels: salesData.map(d => d._id),
      data: salesData.map(d => d.dailySales)
    };

    // 6. Revenue sources
    const revenueBreakdown = await OrderModel.aggregate([
      { $match: { status: { $nin: ['cancelled'] } } },
      {
        $group: {
          _id: "$paymentMethod",
          amount: { $sum: "$total" }
        }
      }
    ]);

    const revenueSources = {
      labels: revenueBreakdown.map(r => r._id),
      data: revenueBreakdown.map(r => r.amount)
    };

    // ✅ Final response
    res.json({
      totalRevenue,
      totalOrders,
      totalProducts,
      totalUsers,
      recentOrders: formattedOrders,
      salesChartData,
      revenueSources
    });

  } catch (err) {
    console.error('[ADMIN SUMMARY ERROR]', err);
    res.status(500).json({ message: 'Failed to load admin summary' });
  }
};
